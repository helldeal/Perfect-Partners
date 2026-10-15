import { useCallback, useEffect, useState } from "react";
import {
  clearSpotifyToken,
  completeSpotifyAuthorization,
  readStoredSpotifyToken,
  startSpotifyAuthorization,
} from "../api/spotify";

export const useSpotifyAuth = () => {
  const [connected, setConnected] = useState(() => Boolean(readStoredSpotifyToken()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const spotifyError = params.get("error");
    if (!code && !spotifyError) return;

    window.history.replaceState({}, "", window.location.pathname);
    if (spotifyError || !state) {
      setError("La connexion Spotify a été annulée.");
      return;
    }

    setLoading(true);
    void completeSpotifyAuthorization(code!, state)
      .then(() => setConnected(true))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Connexion Spotify impossible.")
      )
      .finally(() => setLoading(false));
  }, []);

  const connect = useCallback(() => {
    setError(null);
    setLoading(true);
    void startSpotifyAuthorization().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Connexion Spotify impossible.");
      setLoading(false);
    });
  }, []);

  const disconnect = useCallback(() => {
    clearSpotifyToken();
    setConnected(false);
  }, []);

  return { connected, loading, error, connect, disconnect };
};

