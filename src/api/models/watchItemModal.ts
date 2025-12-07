import { Movie, TVSeason, Video, WatchProvider } from "./movies";

export type WatchItemModal = {
  id: number;
  title: string;
  overview: string;
  date: string;
  background_path: string;
  list?: TVSeason[] | Movie[];
  runtime?: number;
  videos: Video[];
  logo?: string;
  recommendationsQuery?: any;
  collectionId?: string;
  collectionQuery?: any;
  watchProvidersQuery?: any;
  videosQuery?: any;
  imagesQuery?: any;
  detailsQuery?: any;
  creditsQuery?: any;
  watch_providers: WatchProvider[];
  handleDelete: () => void;
  handleAllWatch: () => void;
  handleWatchItem?: (id: string, list?: any) => void;
  handleUnwatchItem?: (id: string, list?: any) => void;
  allWatched?: boolean;
  wishListed: boolean;
};
