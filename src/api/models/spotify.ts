export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  external_urls?: { spotify?: string };
};

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  is_local: boolean;
  external_urls?: { spotify?: string };
  artists: SpotifyArtist[];
  album: {
    name: string;
    images: SpotifyImage[];
    external_urls?: { spotify?: string };
  };
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  description?: string | null;
  collaborative: boolean;
  images: SpotifyImage[];
  owner: { display_name?: string | null };
  external_urls?: { spotify?: string };
  items?: { total: number };
  tracks?: { total: number };
};

