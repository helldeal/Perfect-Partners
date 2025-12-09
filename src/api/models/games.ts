export type Platform = {
  name: string;
};

export type Websites = {
  official?: string;
  stores?: Website[];
  social?: Website[];
  wikis?: Website[];
  other?: Website[];
};

export type Website = {
  url: string;
  type: string;
};

export type Company = {
  name: string;
  developer: boolean;
  publisher: boolean;
};

export type Game = {
  id: number;
  name: string;
  cover?: string;
  overview: string;
  storyline?: string;
  release_date?: number;
  artworks?: string[];
  screenshots?: string[];
  genres?: string[];
  themes?: string[];
  video?: string;
  similar_games?: number[];
  collections?: number[];
  platforms?: Platform[];
  websites?: Websites;
  companies?: Company[];
  videoUrl?: string;
  logoUrl?: string;
  possessedBy: string[];
};
