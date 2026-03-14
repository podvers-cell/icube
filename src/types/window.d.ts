/**
 * Shared global Window extensions for YouTube (YT) and Vimeo players.
 * Declared once to avoid "Subsequent property declarations must have the same type" when multiple files extend Window.
 */

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
}

export interface VimeoPlayerInstance {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  getPaused: () => Promise<boolean>;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  setCurrentTime: (t: number) => Promise<number>;
  getVolume: () => Promise<number>;
  setVolume: (v: number) => Promise<number>;
  getMuted: () => Promise<boolean>;
  setMuted: (m: boolean) => Promise<void>;
}

export interface YTNamespace {
  Player: new (
    element: string | HTMLElement,
    config: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: { target: YTPlayerInstance }) => void;
        onStateChange?: (e: { data: number }) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: { Player: new (el: HTMLIFrameElement) => VimeoPlayerInstance };
  }
}

export {};
