import { SpotifyPlaylist, SpotifyTrack } from "./models/spotify";

const ACCOUNTS_URL = "https://accounts.spotify.com";
const API_URL = "https://api.spotify.com/v1";
const TOKEN_STORAGE_KEY = "perfect-partners.spotify-token";
const VERIFIER_STORAGE_KEY = "perfect-partners.spotify-verifier";
const STATE_STORAGE_KEY = "perfect-partners.spotify-state";
const AUTH_VERSION = 2;

export type SpotifyToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  authVersion: number;
};

type SpotifyPage<T> = {
  items: T[];
  next: string | null;
};

const getClientId = () => import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;

export const getSpotifyRedirectUri = () => {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${window.location.origin}${base}songless`;
};

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createRandomValue = (length = 64) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

const createChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return base64UrlEncode(new Uint8Array(digest));
};

export const startSpotifyAuthorization = async () => {
  const clientId = getClientId();
  if (!clientId) throw new Error("VITE_SPOTIFY_CLIENT_ID n'est pas configuré.");

  const verifier = createRandomValue();
  const state = createRandomValue(24);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  sessionStorage.setItem(STATE_STORAGE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: await createChallenge(verifier),
    state,
    scope: [
      "playlist-read-private",
      "playlist-read-collaborative",
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-modify-playback-state",
      "user-top-read",
      "user-read-recently-played",
      "user-library-read",
    ].join(" "),
  });

  window.location.assign(`${ACCOUNTS_URL}/authorize?${params.toString()}`);
};

const saveToken = (payload: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}) => {
  const previous = readStoredSpotifyToken();
  const token: SpotifyToken = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? previous?.refreshToken ?? "",
    expiresAt: Date.now() + payload.expires_in * 1000,
    authVersion: AUTH_VERSION,
  };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  return token;
};

export const readStoredSpotifyToken = (): SpotifyToken | null => {
  try {
    const value = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!value) return null;
    const token = JSON.parse(value) as SpotifyToken;
    if (token.authVersion !== AUTH_VERSION) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

export const clearSpotifyToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

export const completeSpotifyAuthorization = async (code: string, state: string) => {
  const clientId = getClientId();
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY);

  if (!clientId || !verifier || state !== expectedState) {
    throw new Error("La réponse d'authentification Spotify n'est pas valide.");
  }

  const response = await fetch(`${ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: getSpotifyRedirectUri(),
      code_verifier: verifier,
    }),
  });
  if (!response.ok) throw new Error("Spotify a refusé la connexion.");

  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  return saveToken(await response.json());
};

const refreshSpotifyToken = async (refreshToken: string) => {
  const clientId = getClientId();
  if (!clientId || !refreshToken) throw new Error("Session Spotify expirée.");
  const response = await fetch(`${ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) {
    clearSpotifyToken();
    throw new Error("La session Spotify a expiré. Reconnectez-vous.");
  }
  return saveToken(await response.json());
};

export const getSpotifyAccessToken = async () => {
  const token = readStoredSpotifyToken();
  if (!token) throw new Error("Spotify n'est pas connecté.");
  if (token.expiresAt > Date.now() + 60_000) return token.accessToken;
  return (await refreshSpotifyToken(token.refreshToken)).accessToken;
};

const spotifyFetch = async <T>(pathOrUrl: string, init?: RequestInit): Promise<T> => {
  const accessToken = await getSpotifyAccessToken();
  const response = await fetch(
    pathOrUrl.startsWith("http") ? pathOrUrl : `${API_URL}${pathOrUrl}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    }
  );
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
    const error = new Error(
      response.status === 429
        ? `Limite Spotify atteinte. Réessayez dans ${retryAfter || "quelques"} seconde${retryAfter === 1 ? "" : "s"}.`
        : response.status === 403
        ? "Spotify ne permet pas d'accéder au contenu de cette playlist."
        : `Erreur Spotify (${response.status}).`
    );
    Object.assign(error, { status: response.status, retryAfter });
    throw error;
  }
  return response.json() as Promise<T>;
};

export const fetchSpotifyPlaylists = async () => {
  const playlists: SpotifyPlaylist[] = [];
  let next: string | null = "/me/playlists?limit=50";
  while (next) {
    const page: SpotifyPage<SpotifyPlaylist> = await spotifyFetch(next);
    playlists.push(...page.items);
    next = page.next;
  }

  const blendId = import.meta.env.VITE_SPOTIFY_BLEND_PLAYLIST_ID as string | undefined;
  if (blendId && !playlists.some((playlist) => playlist.id === blendId)) {
    try {
      playlists.unshift(await spotifyFetch<SpotifyPlaylist>(`/playlists/${blendId}`));
    } catch {
      // Its access error will be explained when the user selects the source.
    }
  }
  return playlists;
};

type PlaylistItem = { item?: SpotifyTrack | null; track?: SpotifyTrack | null };

export const fetchSpotifyPlaylistTracks = async (playlistId: string) => {
  const tracks: SpotifyTrack[] = [];
  let next: string | null = `/playlists/${playlistId}/items?limit=50&additional_types=track`;
  while (next) {
    const page: SpotifyPage<PlaylistItem> = await spotifyFetch(next);
    for (const entry of page.items) {
      const track = entry.item ?? entry.track;
      if (track?.id && track.uri && !track.is_local) tracks.push(track);
    }
    next = page.next;
  }
  return tracks;
};

type TrackItem = { item?: SpotifyTrack | null; track?: SpotifyTrack | null };

const validTracks = (items: Array<SpotifyTrack | null | undefined>) =>
  items.filter(
    (track): track is SpotifyTrack => Boolean(track?.id && track.uri && !track.is_local)
  );

export const fetchSpotifyPersonalizedTracks = async () => {
  const topRanges = ["short_term", "medium_term", "long_term"];
  const requests = [
    ...topRanges.map((range) =>
      spotifyFetch<SpotifyPage<SpotifyTrack>>(`/me/top/tracks?limit=50&time_range=${range}`)
        .then((page) => validTracks(page.items))
    ),
    spotifyFetch<SpotifyPage<TrackItem>>("/me/player/recently-played?limit=50")
      .then((page) => validTracks(page.items.map((entry) => entry.track ?? entry.item))),
    spotifyFetch<SpotifyPage<TrackItem>>("/me/tracks?limit=50")
      .then(async (firstPage) => {
        const items = [...firstPage.items];
        if (firstPage.next) {
          const secondPage = await spotifyFetch<SpotifyPage<TrackItem>>(firstPage.next);
          items.push(...secondPage.items);
        }
        return validTracks(items.map((entry) => entry.track ?? entry.item));
      }),
  ];

  const results = await Promise.allSettled(requests);
  const successful = results
    .filter((result): result is PromiseFulfilledResult<SpotifyTrack[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (successful.length === 0) {
    throw new Error(
      "Spotify n'a pas permis de charger vos goûts. Déconnectez puis reconnectez votre compte."
    );
  }
  return Array.from(new Map(successful.map((track) => [track.id, track])).values());
};

export const startSpotifyTrack = (deviceId: string, uri: string, positionMs: number) =>
  spotifyFetch<void>(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [uri], position_ms: positionMs }),
  });

