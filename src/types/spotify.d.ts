export {};

declare global {
  namespace Spotify {
    type Error = { message: string };
    type Ready = { device_id: string };
    type PlaybackState = {
      paused: boolean;
      position: number;
      track_window: { current_track: { uri: string } };
    };
    class Player {
      constructor(options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      });
      connect(): Promise<boolean>;
      disconnect(): void;
      activateElement(): Promise<void>;
      pause(): Promise<void>;
      resume(): Promise<void>;
      seek(positionMs: number): Promise<void>;
      getVolume(): Promise<number>;
      setVolume(volume: number): Promise<void>;
      getCurrentState(): Promise<PlaybackState | null>;
      addListener(event: "ready" | "not_ready", callback: (value: Ready) => void): boolean;
      addListener(
        event: "authentication_error" | "account_error" | "playback_error",
        callback: (value: Error) => void
      ): boolean;
      addListener(
        event: "player_state_changed",
        callback: (state: PlaybackState | null) => void
      ): boolean;
    }
  }

  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
