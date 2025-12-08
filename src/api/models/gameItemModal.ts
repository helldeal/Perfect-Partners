export type WatchItemModal = {
  id: number;
  title: string;
  overview: string;
  date: string;
  background_path: string;
  runtime?: number;
  videos: any[];
  logo?: string;
  recommendationsQuery?: any;
  collectionId?: string;
  collectionQuery?: any;
  gameProvidersQuery?: any;
  videosQuery?: any;
  imagesQuery?: any;
};
