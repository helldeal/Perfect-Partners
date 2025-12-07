import {
  MediaDisplayList,
  MediaItem,
  Movie,
  MovieSaga,
  TVEpisode,
  TVSeason,
  TVShow,
} from "../api/models/movies";

export function isMovie(item: MediaItem): item is Movie {
  return "title" in item;
}

export function isTVShow(item: MediaItem): item is TVShow {
  return "name" in item;
}

export function isMovieSaga(item: MediaItem | MovieSaga): item is MovieSaga {
  return "movies" in item;
}

export const streamingLinks: Record<number, string> = {
  8: "https://www.netflix.com/",
  337: "https://www.disneyplus.com/",
  9: "https://www.primevideo.com/",
  119: "https://www.primevideo.com/",
  2: "https://www.apple.com/apple-tv-plus/",
  1899: "https://www.hbomax.com/",
  15: "https://www.hulu.com/",
  384: "https://www.max.com/",
  35: "https://www.rakuten.tv/",
  531: "https://www.paramountplus.com/",
  283: "https://www.crunchyroll.com/",
  192: "https://www.youtube.com/", // YouTube
  193: "https://www.sfrplay.fr/", // SFR Play (VOD/Streaming)
  3: "https://play.google.com/store/movies", // Google Play Movies / VOD
  2077: "https://www.plex.tv/", // Plex / Plex Channels
  610: "https://www.arte.tv/",
  1967: "https://www.molotov.tv/",
};
export const filterMovieFields = (movie: any): Movie => {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    release_date: movie.release_date,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    logo: movie.logo,
    runtime: movie.runtime,
    watched: movie.watched ?? false,
    watch_providers: movie.watch_providers,
    collection: movie.collection,
    videos: movie.videos,
  };
};

export const filterTVShowFields = (tvShow: any): TVShow => {
  return {
    id: tvShow.id,
    name: tvShow.name,
    overview: tvShow.overview,
    first_air_date: tvShow.first_air_date,
    poster_path: tvShow.poster_path,
    backdrop_path: tvShow.backdrop_path,
    logo: tvShow.logo,
    watch_providers: tvShow.watch_providers,
    videos: tvShow.videos,
    seasons:
      tvShow.seasons?.map((season: any) => filterTVSeasonFields(season)) ?? [],
  };
};

export const filterTVSeasonFields = (season: any): TVSeason => {
  return {
    id: season.id,
    air_date: season.air_date,
    name: season.name,
    overview: season.overview,
    season_number: season.season_number,
    poster_path: season.poster_path,
    episodes:
      season.episodes?.map((episode: any) => filterTVEpisodeFields(episode)) ??
      [],
  };
};

export const filterTVEpisodeFields = (episode: any): TVEpisode => {
  return {
    id: episode.id,
    name: episode.name,
    overview: episode.overview,
    episode_number: episode.episode_number,
    runtime: episode.runtime,
    air_date: episode.air_date,
    still_path: episode.still_path,
    watched: episode.watched ?? false,
  };
};

export const getMediaListFromMediaItems = (items: MediaItem[]) => {
  const planToWatch: MediaDisplayList = [];
  const watching: MediaDisplayList = [];
  const completed: MediaDisplayList = [];

  const groupedMovies: Record<number, Movie[]> = {};

  items.forEach((item) => {
    if (isMovie(item)) {
      if (item.collection) {
        if (!groupedMovies[item.collection.id]) {
          groupedMovies[item.collection.id] = [];
        }
        groupedMovies[item.collection.id].push(item);
      } else {
        groupedMovies[item.id] = [item];
      }
    } else if (isTVShow(item)) {
      item.seasons = item.seasons?.filter(
        (season) => season.season_number !== 0
      ); // Exclude specials
      const allEpisodes = item.seasons!.flatMap((season) => season.episodes);
      const watchedEpisodes = allEpisodes.filter((episode) => episode.watched);

      if (watchedEpisodes.length === 0) {
        planToWatch.push(item);
      } else if (watchedEpisodes.length === allEpisodes.length) {
        completed.push(item);
      } else {
        watching.push(item);
      }
    }
  });

  Object.values(groupedMovies).forEach((movies: Movie[]) => {
    if (movies.length === 1) {
      if (movies[0].watched) {
        completed.push(movies[0]);
      } else {
        planToWatch.push(movies[0]);
      }
      return;
    }
    movies.sort((a, b) =>
      a.release_date && b.release_date
        ? a.release_date.localeCompare(b.release_date)
        : a.title.localeCompare(b.title)
    );
    const movieSaga: MovieSaga = {
      ...movies[0].collection!,
      movies,
    };
    const watchedMovies = movies.filter((movie) => movie.watched);
    if (watchedMovies.length === 0) {
      planToWatch.push(movieSaga);
    } else if (watchedMovies.length === movies.length) {
      completed.push(movieSaga);
    } else {
      watching.push(movieSaga);
    }
  });

  return {
    planToWatch: planToWatch.sort((a, b) =>
      (isMovieSaga(a) ? a.name : isMovie(a) ? a.title : a.name).localeCompare(
        isMovieSaga(b) ? b.name : isMovie(b) ? b.title : b.name
      )
    ),
    watching: watching.sort((a, b) =>
      (isMovieSaga(a) ? a.name : isMovie(a) ? a.title : a.name).localeCompare(
        isMovieSaga(b) ? b.name : isMovie(b) ? b.title : b.name
      )
    ),
    completed: completed.sort((a, b) =>
      (isMovieSaga(a) ? a.name : isMovie(a) ? a.title : a.name).localeCompare(
        isMovieSaga(b) ? b.name : isMovie(b) ? b.title : b.name
      )
    ),
  };
};
