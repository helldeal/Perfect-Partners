export type Game = {
  id: number;
  name: string;
  released: string;
  sgdbCover?: string | null;
  background_image: string;
  rating: number;
  ratings_count: number;
  platforms: { platform: { name: string } }[];
};
