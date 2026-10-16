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
  const activationRef = useRef<Promise<void> | null>(null);
  const preparationRef = useRef<{ playbackError: string | null } | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const activate = useCallback(() => {
    const player = playerRef.current;
    if (!player) return undefined;
    if (!activationRef.current) {
      activationRef.current = player.activateElement().catch((reason: unknown) => {
        activationRef.current = null;
        throw reason;
      });
    }
    return activationRef.current;
  }, []);

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
        name: "Perfect Partners — Blindtest",
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
      player.addListener("playback_error", ({ message }) => {
        if (preparationRef.current) {
          preparationRef.current.playbackError = message;
        } else {
          setError(message);
        }
      });
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
      activationRef.current = null;
    };
  }, [armSnippetPause, clearPlaybackTimers, enabled]);

  const playSnippet = useCallback(
    async (uri: string, durationMs: number, positionMs = 10_000) => {
      const player = playerRef.current;
      if (!player || !deviceId) throw new Error("Le lecteur Spotify n'est pas encore prêt.");
      setError(null);
      clearPlaybackTimers();
      await activate();
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
    [activate, armSnippetPause, clearPlaybackTimers, deviceId]
  );

  const playFullTrack = useCallback(
    async (uri: string, positionMs = 10_000, resume = false) => {
      const player = playerRef.current;
      if (!player || !deviceId) throw new Error("Le lecteur Spotify n'est pas encore prêt.");
      clearPlaybackTimers();
      pendingSnippetRef.current = null;
      setError(null);
      await activate();
      if (loadedTrackUriRef.current === uri) {
        if (!resume) await player.seek(positionMs);
        await player.resume();
      } else {
        await startSpotifyTrack(deviceId, uri, positionMs);
        loadedTrackUriRef.current = uri;
      }
      setPlaying(true);
    },
    [activate, clearPlaybackTimers, deviceId]
  );

  const pause = useCallback(async () => {
    clearPlaybackTimers();
    pendingSnippetRef.current = null;
    const player = playerRef.current;
    const state = await player?.getCurrentState();
    if (state && !state.paused) await player?.pause();
    setPlaying(false);
  }, [clearPlaybackTimers]);

  const prepareTrack = useCallback(async (uri: string, positionMs: number, signal: AbortSignal) => {
    const player = playerRef.current;
    if (!player || !deviceId) throw new Error("Le lecteur Spotify n'est pas encore prêt.");
    const checkCancelled = () => {
      if (signal.aborted) throw new DOMException("Chargement annulé.", "AbortError");
    };
    checkCancelled();
    if (loadedTrackUriRef.current === uri) {
      const state = await player.getCurrentState();
      if (state?.track_window.current_track.uri === uri && state.paused) return;
    }
    const volume = await player.getVolume();
    const preparation = { playbackError: null as string | null };
    preparationRef.current = preparation;
    try {
      await player.setVolume(0);
      checkCancelled();
      // Do not start preparation on devices that cannot mute the SDK.
      if (await player.getVolume() !== 0) throw new Error("Ce navigateur ne permet pas le préchargement silencieux Spotify.");
      checkCancelled();
      await startSpotifyTrack(deviceId, uri, positionMs);
      const startedAt = Date.now();
      while (Date.now() - startedAt < 10_000) {
        checkCancelled();
        const state = await player.getCurrentState();
        if (state?.track_window.current_track.uri === uri) {
          await player.pause();
          await player.seek(positionMs);
          const pausedState = await player.getCurrentState();
          if (pausedState?.paused && pausedState.track_window.current_track.uri === uri) {
            checkCancelled();
            loadedTrackUriRef.current = uri;
            setPlaying(false);
            setError(null);
            return;
          }
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
      }
      throw new Error("Spotify n'a pas confirmé le chargement du morceau. Réessayez.");
    } catch (reason) {
      if (signal.aborted) throw new DOMException("Chargement annulé.", "AbortError");
      if (preparation.playbackError) {
        throw new Error(`Le chargement Spotify a échoué : ${preparation.playbackError}`);
      }
      throw reason;
    } finally {
      try {
        try {
          const state = await player.getCurrentState();
          if (state && !state.paused) await player.pause();
        } finally {
          await player.setVolume(volume);
        }
      } finally {
        if (preparationRef.current === preparation) preparationRef.current = null;
      }
    }
  }, [deviceId]);

  return { ready: Boolean(deviceId), playing, error, playSnippet, playFullTrack, pause, activate, prepareTrack };
};

