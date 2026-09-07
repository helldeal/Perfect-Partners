import { notifyAllUsersFromSystem } from "./firebase/notifications";
import { fetchIGDBGame } from "./igdb";
import { Game } from "./models/games";
import { Movie, TVSeason, TVShow } from "./models/movies";
import { TMDB } from "./tmdb";
import {
  filterMovieFields,
  filterTVSeasonFields,
  filterTVShowFields,
  getTrailerVideos,
} from "../utils/movies";

const databaseUrl = import.meta.env.VITE_FIREBASE_DB_URL;

const patchStoredItem = async (
  collection: "movies" | "tvshows" | "games",
  id: number,
  data: object
) => {
  const response = await fetch(`${databaseUrl}/${collection}/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Impossible de synchroniser ${collection}/${id}`);
  }
};

const getLogo = (images: { logos?: Array<{ iso_3166_1?: string; file_path: string }> }) =>
  images.logos?.find((logo) => logo.iso_3166_1 === "FR")?.file_path ??
  images.logos?.find((logo) => logo.iso_3166_1 === "US")?.file_path ??
  images.logos?.[0]?.file_path;

const hasChanged = (current: unknown, next: unknown) =>
  JSON.stringify(current ?? null) !== JSON.stringify(next ?? null);

const getGameMetadata = (game: Game) => ({
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

export const checkTVShowForNewSeasons = async (tvShow: TVShow) => {
  const details = await TMDB.fetchTVDetails(tvShow.id.toString());
  const storedSeasonNumbers = new Set(
    (tvShow.seasons ?? []).map((season) => season.season_number)
  );
  const newSeasons = (details.seasons ?? []).filter(
    (season: TVSeason) =>
      season.season_number !== 0 && !storedSeasonNumbers.has(season.season_number)
  );
  const checkedAt = Date.now();

  if (newSeasons.length === 0) {
    await patchStoredItem("tvshows", tvShow.id, {
      seasonCheckedAt: checkedAt,
    });
    return false;
  }

  const seasonsWithEpisodes = await Promise.all(
    newSeasons.map(async (season: TVSeason) => {
      const seasonDetails = await TMDB.fetchTVSeasonDetails(
        tvShow.id.toString(),
        season.season_number
      );
      return filterTVSeasonFields({
        ...season,
        episodes: seasonDetails.episodes ?? [],
      });
    })
  );
  const mergedSeasons = [...(tvShow.seasons ?? []), ...seasonsWithEpisodes].sort(
    (a, b) => a.season_number - b.season_number
  );

  await patchStoredItem("tvshows", tvShow.id, {
    seasons: mergedSeasons,
    updatedAt: checkedAt,
    newSeasonAt: checkedAt,
    seasonCheckedAt: checkedAt,
  });
  await notifyAllUsersFromSystem(
    {
      action: "new_season",
      category: "movies",
      itemId: tvShow.id,
      itemName: tvShow.name,
      image: tvShow.poster_path,
    },
    `tv-${tvShow.id}-season-${Math.max(
      ...newSeasons.map((season: TVSeason) => season.season_number)
    )}`
  );

  return true;
};

export const refreshMovieMetadata = async (movie: Movie) => {
  const [details, videos, images, watchProviders] = await Promise.all([
    TMDB.fetchMovieDetails(movie.id.toString()),
    TMDB.fetchMovieVideos(movie.id.toString()),
    TMDB.fetchMovieImages(movie.id.toString()),
    TMDB.fetchMovieWatchProviders(movie.id.toString()),
  ]);
  const next = filterMovieFields({
    ...movie,
    ...details,
    collection: details.belongs_to_collection ?? undefined,
    videos: getTrailerVideos(videos.results ?? []),
    logo: getLogo(images),
    watch_providers: watchProviders.results?.FR?.flatrate ?? [],
  });
  const metadataChanged = [
    "title",
    "overview",
    "poster_path",
    "backdrop_path",
    "logo",
    "runtime",
    "videos",
    "collection",
    "watch_providers",
  ].some((key) =>
    hasChanged(movie[key as keyof Movie], next[key as keyof Movie])
  );

  if (!metadataChanged) {
    await patchStoredItem("movies", movie.id, { updatedAt: Date.now() });
    return false;
  }

  await patchStoredItem("movies", movie.id, {
    ...next,
    updatedAt: Date.now(),
  });
  return true;
};

export const refreshTVShowMetadata = async (tvShow: TVShow) => {
  const [details, videos, images, watchProviders] = await Promise.all([
    TMDB.fetchTVDetails(tvShow.id.toString()),
    TMDB.fetchTVVideos(tvShow.id.toString()),
    TMDB.fetchTVImages(tvShow.id.toString()),
    TMDB.fetchTVWatchProviders(tvShow.id.toString()),
  ]);
  const seasonSummaries = (details.seasons ?? []).filter(
    (season: TVSeason) => season.season_number !== 0
  ) as Array<TVSeason & { episode_count?: number }>;
  const storedSeasonsByNumber = new Map(
    (tvShow.seasons ?? []).map((season) => [season.season_number, season])
  );
  const refreshedSeasons = await Promise.all(
    seasonSummaries.map(async (season) => {
      const seasonDetails = await TMDB.fetchTVSeasonDetails(
        tvShow.id.toString(),
        season.season_number
      );
      const storedEpisodes = new Map(
        (storedSeasonsByNumber.get(season.season_number)?.episodes ?? []).map(
          (episode) => [episode.id, episode]
        )
      );

      return filterTVSeasonFields({
        ...season,
        ...seasonDetails,
        episodes: (seasonDetails.episodes ?? []).map(
          (episode: { id: number; watched?: boolean }) => ({
            ...episode,
            watched: storedEpisodes.get(episode.id)?.watched ?? false,
          })
        ),
      });
    })
  );
  const refreshedSeasonsByNumber = new Map(
    refreshedSeasons.map((season) => [season.season_number, season])
  );
  const mergedSeasons = seasonSummaries.map(
    (season) =>
      refreshedSeasonsByNumber.get(season.season_number) ??
      storedSeasonsByNumber.get(season.season_number) ??
      filterTVSeasonFields(season)
  );
  const newSeasons = seasonSummaries.filter(
    (season) => !storedSeasonsByNumber.has(season.season_number)
  );
  const next = filterTVShowFields({
    ...tvShow,
    name: details.name,
    overview: details.overview,
    first_air_date: details.first_air_date,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    videos: getTrailerVideos(videos.results ?? []),
    logo: getLogo(images),
    watch_providers: watchProviders.results?.FR?.flatrate ?? [],
    seasons: mergedSeasons,
    newSeasonAt: newSeasons.length > 0 ? Date.now() : tvShow.newSeasonAt,
  });
  const metadataChanged = [
    "name",
    "overview",
    "poster_path",
    "backdrop_path",
    "logo",
    "videos",
    "watch_providers",
    "seasons",
    "newSeasonAt",
  ].some((key) =>
    hasChanged(tvShow[key as keyof TVShow], next[key as keyof TVShow])
  );

  if (!metadataChanged) {
    await patchStoredItem("tvshows", tvShow.id, { updatedAt: Date.now() });
    return false;
  }

  await patchStoredItem("tvshows", tvShow.id, {
    ...next,
    updatedAt: Date.now(),
  });
  if (newSeasons.length > 0) {
    await notifyAllUsersFromSystem(
      {
        action: "new_season",
        category: "movies",
        itemId: tvShow.id,
        itemName: tvShow.name,
        image: next.poster_path,
      },
      `tv-${tvShow.id}-season-${Math.max(
        ...newSeasons.map((season) => season.season_number)
      )}`
    );
  }
  return true;
};

export const refreshGameMetadata = async (game: Game) => {
  const freshGame = await fetchIGDBGame(game.id, game.name);
  if (!freshGame) return false;

  const freshMetadata = getGameMetadata(freshGame);
  const metadataChanged = hasChanged(
    getGameMetadata(game),
    freshMetadata
  );

  if (!metadataChanged) {
    await patchStoredItem("games", game.id, { updatedAt: Date.now() });
    return false;
  }

  await patchStoredItem("games", game.id, {
    ...freshMetadata,
    updatedAt: Date.now(),
  });
  return true;
};
