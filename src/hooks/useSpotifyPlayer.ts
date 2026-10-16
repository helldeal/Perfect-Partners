import { useCallback, useEffect, useRef, useState } from "react";
import { getSpotifyAccessToken, startSpotifyTrack } from "../api/spotify";

const SDK_ID = "spotify-player-sdk";

const loadSpotifySdk = () =>
  new Promise<void>((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    const previous = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      previous?.();
      resolve();
    };
    if (!document.getElementById(SDK_ID)) {
      const script = document.createElement("script");
      script.id = SDK_ID;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });

export const useSpotifyPlayer = (enabled: boolean) => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const playbackPollRef = useRef<number | null>(null);
  const pauseGuardPollRef = useRef<number | null>(null);
  const pendingSnippetRef = useRef<{
    uri: string;
    durationMs: number;
    positionMs: number;
  } | null>(null);
  const loadedTrackUriRef = useRef<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const clearPlaybackTimers = useCallback(() => {
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    if (playbackPollRef.current) window.clearInterval(playbackPollRef.current);
    if (pauseGuardPollRef.current) window.clearInterval(pauseGuardPollRef.current);
    pauseTimerRef.current = null;
    playbackPollRef.current = null;
    pauseGuardPollRef.current = null;
  }, []);

  const enforceSnippetPause = useCallback((player: Spotify.Player, uri: string) => {
    void player.pause().finally(() => setPlaying(false));
    const guardStartedAt = Date.now();
    if (pauseGuardPollRef.current) window.clearInterval(pauseGuardPollRef.current);
    pauseGuardPollRef.current = window.setInterval(() => {
      if (Date.now() - guardStartedAt > 3_000) {
        if (pauseGuardPollRef.current) window.clearInterval(pauseGuardPollRef.current);
        pauseGuardPollRef.current = null;
        return;
      }
      void player.getCurrentState().then((state) => {
        if (state && !state.paused && state.track_window.current_track.uri === uri) {
          void player.pause().finally(() => setPlaying(false));
        }
      });
    }, 60);
  }, []);

  const armSnippetPause = useCallback(
    (player: Spotify.Player, state: Spotify.PlaybackState | null) => {
      if (!state) return;
      setPlaying(!state.paused);
      const pending = pendingSnippetRef.current;
      if (state.paused || !pending || state.track_window.current_track.uri !== pending.uri) return;

      pendingSnippetRef.current = null;
      if (playbackPollRef.current) window.clearInterval(playbackPollRef.current);
      playbackPollRef.current = null;
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
      const elapsed = Math.max(0, state.position - pending.positionMs);
      const remaining = Math.max(0, pending.durationMs - elapsed);
      pauseTimerRef.current = window.setTimeout(() => {
        enforceSnippetPause(player, pending.uri);
      }, remaining);
    },
    [enforceSnippetPause]
  );

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    void loadSpotifySdk().then(async () => {
      if (disposed || playerRef.current) return;
      const player = new window.Spotify.Player({
        name: "Perfect Partners — Songless",
        getOAuthToken: (callback) => {
          void getSpotifyAccessToken()
            .then(callback)
            .catch(() => setError("La session Spotify a expiré."));
        },
        volume: 0.7,
      });
      player.addListener("ready", ({ device_id }) => setDeviceId(device_id));
      player.addListener("not_ready", () => setDeviceId(null));
      player.addListener("authentication_error", ({ message }) => setError(message));
      player.addListener("account_error", () =>
        setError("Spotify Premium est nécessaire pour lancer la lecture.")
      );
      player.addListener("playback_error", ({ message }) => setError(message));
      player.addListener("player_state_changed", (state) => {
        armSnippetPause(player, state);
      });
      playerRef.current = player;
      const success = await player.connect();
      if (!success) setError("Le lecteur Spotify n'a pas pu démarrer.");
    });

    return () => {
      disposed = true;
      clearPlaybackTimers();
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [armSnippetPause, clearPlaybackTimers, enabled]);

  const playSnippet = useCallback(
    async (uri: string, durationMs: number, positionMs = 10_000) => {
      const player = playerRef.current;
      if (!player || !deviceId) throw new Error("Le lecteur Spotify n'est pas encore prêt.");
      setError(null);
      clearPlaybackTimers();
      await player.activateElement();
      const replayingLoadedTrack = loadedTrackUriRef.current === uri;
      if (replayingLoadedTrack) await player.pause();
      pendingSnippetRef.current = { uri, durationMs, positionMs };
      let pollCount = 0;
      playbackPollRef.current = window.setInterval(() => {
        pollCount += 1;
        if (pollCount > 250) {
          if (playbackPollRef.current) window.clearInterval(playbackPollRef.current);
          playbackPollRef.current = null;
          pendingSnippetRef.current = null;
          setError("Spotify n'a pas confirmé le démarrage de la lecture.");
          return;
        }
        void player.getCurrentState().then((state) => armSnippetPause(player, state));
      }, 40);
      try {
        if (replayingLoadedTrack) {
          await player.seek(positionMs);
          await player.resume();
        } else {
          await startSpotifyTrack(deviceId, uri, positionMs);
          loadedTrackUriRef.current = uri;
        }
      } catch (reason) {
        pendingSnippetRef.current = null;
        if (playbackPollRef.current) window.clearInterval(playbackPollRef.current);
        playbackPollRef.current = null;
        loadedTrackUriRef.current = null;
        throw reason;
      }
    },
    [armSnippetPause, clearPlaybackTimers, deviceId]
  );

  const playFullTrack = useCallback(
    async (uri: string, positionMs = 10_000) => {
      const player = playerRef.current;
      if (!player || !deviceId) throw new Error("Le lecteur Spotify n'est pas encore prêt.");
      clearPlaybackTimers();
      pendingSnippetRef.current = null;
      setError(null);
      await player.activateElement();
      if (loadedTrackUriRef.current === uri) {
        await player.seek(positionMs);
        await player.resume();
      } else {
        await startSpotifyTrack(deviceId, uri, positionMs);
        loadedTrackUriRef.current = uri;
      }
      setPlaying(true);
    },
    [clearPlaybackTimers, deviceId]
  );

  const pause = useCallback(async () => {
    clearPlaybackTimers();
    pendingSnippetRef.current = null;
    await playerRef.current?.pause();
    setPlaying(false);
  }, [clearPlaybackTimers]);

  return { ready: Boolean(deviceId), playing, error, playSnippet, playFullTrack, pause };
};

