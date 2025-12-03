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
  recomandationsQuery?: any;
  creditsQuery?: any;
  watch_providers: WatchProvider[];
  handleDelete: () => void;
  handleAllWatch: () => void;
  handleWatchItem?: (id: string) => void;
  allWatched?: boolean;
};
