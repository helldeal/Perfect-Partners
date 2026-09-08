import { ref, runTransaction } from "firebase/database";
import { db } from "../firebase/firebase";
import { fetchIGDBGame } from "./igdb";
import { Game } from "./models/games";
import { Movie, TVEpisode, TVSeason, TVShow } from "./models/movies";
import { notifyAllUsersFromSystem } from "./firebase/notifications";
import { TMDB } from "./tmdb";
import { filterTVSeasonFields, getTrailerVideos } from "../utils/movies";

const MAX_SEASON_REQUESTS = 3;

type Metadata = Record<string, unknown>;

const hasChanged = (current: unknown, fresh: unknown) =>
  JSON.stringify(current) !== JSON.stringify(fresh);

const stripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)])
    ) as T;
  }
  return value;
};

const applyMetadata = (target: Metadata, metadata: Metadata) => {
  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined) delete target[key];
    else target[key] = value;
  });
};

const getLogo = (images: { logos?: Array<Record<string, unknown>> }) => {
  const logos = images.logos ?? [];
  return (
    logos.find((logo) => logo.iso_3166_1 === "FR")?.file_path ??
    logos.find((logo) => logo.iso_3166_1 === "US")?.file_path ??
    logos[0]?.file_path
  ) as string | undefined;
};

const getMovieMetadata = (movie: Movie): Metadata => ({
  title: movie.title,
  overview: movie.overview,
  release_date: movie.release_date,
  poster_path: movie.poster_path,
  backdrop_path: movie.backdrop_path,
  logo: movie.logo,
  runtime: movie.runtime,
  watch_providers: movie.watch_providers,
  collection: movie.collection,
  videos: movie.videos,
});

const getTVShowMetadata = (tvShow: TVShow): Metadata => ({
  name: tvShow.name,
  overview: tvShow.overview,
  first_air_date: tvShow.first_air_date,
  poster_path: tvShow.poster_path,
  backdrop_path: tvShow.backdrop_path,
  logo: tvShow.logo,
  watch_providers: tvShow.watch_providers,
  videos: tvShow.videos,
});

const getGameMetadata = (game: Game): Metadata => ({
  name: game.name,
  cover: game.cover,
  overview: game.overview,
  storyline: game.storyline,
  release_date: game.release_date,
  artworks: game.artworks,
  screenshots: game.screenshots,
  genres: game.genres,
  themes: game.themes,
  video: game.video,
  similar_games: game.similar_games,
  collections: game.collections,
  platforms: game.platforms,
  websites: game.websites,
  companies: game.companies,
});

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
) => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
};

const preserveEpisodeProgress = (
  freshEpisode: TVEpisode,
  storedEpisode?: TVEpisode
): TVEpisode => ({
  ...freshEpisode,
  watched: storedEpisode?.watched ?? false,
});

const mergeSeasons = (fresh: TVSeason[], stored: TVSeason[] = []) => {
  const freshNumbers = new Set(fresh.map((season) => season.season_number));
  const merged: TVSeason[] = fresh.map((season) => {
    const storedSeason = stored.find(
      (candidate) => candidate.season_number === season.season_number
    );
    return {
      ...season,
      episodes: (season.episodes ?? []).map((episode) =>
        preserveEpisodeProgress(
          episode,
          storedSeason?.episodes?.find((candidate) => candidate.id === episode.id)
        )
      ),
    };
  });

  stored.forEach((season) => {
    if (!freshNumbers.has(season.season_number)) merged.push(season);
  });

  return merged.sort((a, b) => a.season_number - b.season_number);
};

const fetchSeason = async (tvShowId: number, seasonNumber: number) =>
  filterTVSeasonFields(
    await TMDB.fetchTVSeasonDetails(tvShowId.toString(), seasonNumber)
  );

const notifyNewSeasons = async (
  tvShow: TVShow,
  seasonNumbers: number[]
) => {
  if (seasonNumbers.length === 0) return;
  await notifyAllUsersFromSystem(
    {
      action: "new_season",
      category: "movies",
      itemId: tvShow.id,
      itemName: tvShow.name,
      image: tvShow.poster_path,
    },
    `tv-${tvShow.id}-seasons-${seasonNumbers.join("-")}`
  );
};

export const checkTVShowForNewSeasons = async (tvShow: TVShow) => {
  const details = await TMDB.fetchTVDetails(tvShow.id.toString());
  const storedNumbers = new Set(
    (tvShow.seasons ?? []).map((season) => season.season_number)
  );
  const candidates = (details.seasons ?? []).filter(
    (season: { season_number: number }) =>
      season.season_number !== 0 && !storedNumbers.has(season.season_number)
  );
  const freshSeasons = await mapWithConcurrency(
    candidates,
    MAX_SEASON_REQUESTS,
    (season: { season_number: number }) =>
      fetchSeason(tvShow.id, season.season_number)
  );
  const checkedAt = Date.now();
  let addedSeasonNumbers: number[] = [];
  let committedShow: TVShow | null = null;

  const result = await runTransaction(ref(db, `tvshows/${tvShow.id}`), (value) => {
    if (!value) return value;
    const current = value as TVShow;
    const currentNumbers = new Set(
      (current.seasons ?? []).map((season) => season.season_number)
    );
    const actuallyNew = freshSeasons.filter(
      (season) => !currentNumbers.has(season.season_number)
    );
    addedSeasonNumbers = actuallyNew.map((season) => season.season_number);

    const next: TVShow = {
      ...current,
      seasonCheckedAt: checkedAt,
    };
    if (actuallyNew.length > 0) {
      next.seasons = mergeSeasons(
        [...(current.seasons ?? []), ...actuallyNew],
        current.seasons
      );
      next.newSeasonAt = checkedAt;
      next.updatedAt = checkedAt;
    }
    committedShow = next;
    return stripUndefined(next);
  });

  if (!result.committed || addedSeasonNumbers.length === 0 || !committedShow) {
    return false;
  }
  await notifyNewSeasons(committedShow, addedSeasonNumbers);
  return true;
};

export const refreshMovieMetadata = async (movie: Movie) => {
  const [details, providers, videos, images] = await Promise.all([
    TMDB.fetchMovieDetails(movie.id.toString()),
    TMDB.fetchMovieWatchProviders(movie.id.toString()),
    TMDB.fetchMovieVideos(movie.id.toString()),
    TMDB.fetchMovieImages(movie.id.toString()),
  ]);
  const freshMovie: Movie = {
    ...movie,
    title: details.title,
    overview: details.overview,
    release_date: details.release_date,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    logo: getLogo(images),
    runtime: details.runtime ?? undefined,
    collection: details.belongs_to_collection ?? undefined,
    videos: getTrailerVideos(videos.results ?? []),
    watch_providers: providers.results?.FR?.flatrate ?? [],
  };
  const freshMetadata = getMovieMetadata(freshMovie);
  const refreshedAt = Date.now();
  let changed = false;

  await runTransaction(ref(db, `movies/${movie.id}`), (value) => {
    if (!value) return value;
    const current = value as Movie;
    changed = hasChanged(getMovieMetadata(current), freshMetadata);
    const next = { ...current } as Movie & Metadata;
    applyMetadata(next, freshMetadata);
    next.updatedAt = refreshedAt;
    return stripUndefined(next);
  });
  return changed;
};

export const refreshTVShowMetadata = async (tvShow: TVShow) => {
  const [details, providers, videos, images] = await Promise.all([
    TMDB.fetchTVDetails(tvShow.id.toString()),
    TMDB.fetchTVWatchProviders(tvShow.id.toString()),
    TMDB.fetchTVVideos(tvShow.id.toString()),
    TMDB.fetchTVImages(tvShow.id.toString()),
  ]);
  const summaries = (details.seasons ?? []).filter(
    (season: { season_number: number }) => season.season_number !== 0
  );
  const freshSeasons = await mapWithConcurrency(
    summaries,
    MAX_SEASON_REQUESTS,
    (season: { season_number: number }) =>
      fetchSeason(tvShow.id, season.season_number)
  );
  const freshShow: TVShow = {
    ...tvShow,
    name: details.name,
    overview: details.overview,
    first_air_date: details.first_air_date,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    logo: getLogo(images),
    videos: getTrailerVideos(videos.results ?? []),
    watch_providers: providers.results?.FR?.flatrate ?? [],
  };
  const freshMetadata = getTVShowMetadata(freshShow);
  const refreshedAt = Date.now();
  let addedSeasonNumbers: number[] = [];
  let changed = false;
  let committedShow: TVShow | null = null;

  const result = await runTransaction(ref(db, `tvshows/${tvShow.id}`), (value) => {
    if (!value) return value;
    const current = value as TVShow;
    const currentNumbers = new Set(
      (current.seasons ?? []).map((season) => season.season_number)
    );
    addedSeasonNumbers = freshSeasons
      .filter((season) => !currentNumbers.has(season.season_number))
      .map((season) => season.season_number);
    const seasons = mergeSeasons(freshSeasons, current.seasons);
    changed =
      hasChanged(getTVShowMetadata(current), freshMetadata) ||
      hasChanged(current.seasons ?? [], seasons);

    const next = { ...current } as TVShow & Metadata;
    applyMetadata(next, freshMetadata);
    next.seasons = seasons;
    next.updatedAt = refreshedAt;
    if (addedSeasonNumbers.length > 0) next.newSeasonAt = refreshedAt;
    committedShow = next;
    return stripUndefined(next);
  });

  if (result.committed && committedShow) {
    await notifyNewSeasons(committedShow, addedSeasonNumbers);
  }
  return changed;
};

const patchStoredGame = async (gameId: number, values: Metadata) => {
  const body = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value ?? null])
  );
  const response = await fetch(
    `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${gameId}.json`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) throw new Error("Impossible de mettre à jour le jeu");
};

export const refreshGameMetadata = async (game: Game) => {
  const freshGame = await fetchIGDBGame(game.id, game.name);
  if (!freshGame) return false;

  const metadata = getGameMetadata(freshGame);
  const changed = hasChanged(getGameMetadata(game), metadata);
  await patchStoredGame(game.id, {
    ...(changed ? metadata : {}),
    updatedAt: Date.now(),
  });
  return changed;
};
