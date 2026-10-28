import { SpotifyTrack } from "../api/models/spotify";

export const normalizeSpotifyText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\([^)]*(remaster|radio edit|version|deluxe|feat\.?)[^)]*\)/gi, "")
    .replace(/\[[^\]]*(remaster|radio edit|version|deluxe|feat\.?)[^\]]*\]/gi, "")
    .replace(/\s[-–—]\s.*\b(remaster|radio edit|version|deluxe)\b.*$/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const getSpotifyTrackIdentity = (track: SpotifyTrack) => {
  const title = normalizeSpotifyText(track.name);
  const primaryArtist = normalizeSpotifyText(track.artists[0]?.name ?? "");
  return `title:${title}|artist:${primaryArtist}`;
};

export const deduplicateSpotifyTracks = (tracks: SpotifyTrack[]) =>
  Array.from(new Map(tracks.map((track) => [getSpotifyTrackIdentity(track), track])).values());
