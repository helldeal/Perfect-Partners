export type MediaItem = Movie | TVShow;
export type MediaList = MediaItem[];
export type MediaDisplayList = (MediaItem | MovieSaga)[];

export type MovieSaga = {
  movies: Movie[];
} & MovieCollection;

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  logo?: string;
  runtime?: number;
  watched?: boolean;
  watch_providers?: WatchProvider[];
  collection?: MovieCollection;
  videos?: Video[];
};

export type TVShow = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  backdrop_path: string;
  logo?: string;
  watch_providers?: WatchProvider[];
  videos?: Video[];
  seasons?: TVSeason[];
};

export type TVSeason = {
  id: number;
  air_date: string;
  name: string;
  overview: string;
  season_number: number;
  poster_path: string;
  episodes?: TVEpisode[];
};

export type TVEpisode = {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  runtime?: number;
  air_date: string;
  still_path: string;
  watched?: boolean;
};

export type MovieCollection = {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
};

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};
