import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { X, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import type { VideoEmbedResult } from "../lib/videoEmbed";

interface VimeoPlayer {
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

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
    Vimeo?: { Player: new (el: HTMLIFrameElement) => VimeoPlayer };
  }
}

declare const YT: {
  Player: new (
    element: string | HTMLElement,
    config: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: (e: { target: YTPlayer }) => void; onStateChange?: (e: { data: number }) => void };
    }
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

interface YTPlayer {
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

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PlayerApi = {
  play: () => void;
  pause: () => void;
  getPlaying: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (t: number) => void;
  getVolume: () => number;
  setVolume: (v: number) => void;
  getMuted: () => boolean;
  setMuted: (m: boolean) => void;
};

export function VideoPlayerModal({
  embed,
  title,
  onClose,
}: {
  embed: VideoEmbedResult;
  title: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ytDivRef = useRef<HTMLDivElement>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerApi | null>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(true);

  const tickRef = useRef<number | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current != null) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    const tick = () => {
      const p = playerRef.current;
      if (!p || !p.getPlaying()) return;
      setCurrentTime(p.getCurrentTime());
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
  }, [stopTick]);

  useEffect(() => {
    return () => stopTick();
  }, [stopTick]);

  useEffect(() => {
    if (!embed) return;

    if (embed.provider === "youtube") {
      const loadYT = () => {
        if (!ytDivRef.current || !embed || embed.provider !== "youtube") return;
        const ytId = embed.videoId;
        try {
          const player = new YT.Player(ytDivRef.current, {
            videoId: ytId,
            playerVars: {
              autoplay: 1,
              mute: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              playsinline: 1,
              disablekb: 1,
              fs: 0,
            },
            events: {
              onReady(e: { target: YTPlayer }) {
                const yt = e.target;
                playerRef.current = {
                  play: () => yt.playVideo(),
                  pause: () => yt.pauseVideo(),
                  getPlaying: () => yt.getPlayerState() === YT.PlayerState.PLAYING,
                  getCurrentTime: () => yt.getCurrentTime(),
                  getDuration: () => yt.getDuration(),
                  seekTo: (t) => yt.seekTo(t, true),
                  getVolume: () => yt.getVolume(),
                  setVolume: (v) => yt.setVolume(v),
                  getMuted: () => yt.isMuted(),
                  setMuted: (m) => (m ? yt.mute() : yt.unMute()),
                };
                setDuration(yt.getDuration());
                setVolume(yt.getVolume());
                setIsMuted(yt.isMuted());
                setIsPlaying(true);
                setReady(true);
                startTick();
              },
            },
          });
        } catch (err) {
          console.error("YT Player init error", err);
          setReady(true);
        }
      };

      if (window.YT?.Player) {
        loadYT();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        loadYT();
      };
      document.head.appendChild(script);
      return () => {
        window.onYouTubeIframeAPIReady = prev;
        playerRef.current = null;
      };
    }

    // Vimeo
    const iframe = vimeoIframeRef.current;
    if (!iframe || embed.provider !== "vimeo") return;

    const loadVimeo = () => {
      const Vimeo = (window as unknown as { Vimeo: { Player: new (el: HTMLIFrameElement) => VimeoPlayer } }).Vimeo;
      if (!Vimeo?.Player) return;
      const vp = new Vimeo.Player(iframe);
      vimeoPlayerRef.current = vp;
      vp.getDuration().then((d) => setDuration(d));
      vp.getVolume().then((v) => setVolume(Math.round(v * 100)));
      vp.getMuted().then(setIsMuted);
      vp.getPaused().then((p) => setIsPlaying(!p));
      playerRef.current = {
        play: () => { vp.play(); setIsPlaying(true); },
        pause: () => { vp.pause(); setIsPlaying(false); },
        getPlaying: () => true,
        getCurrentTime: () => currentTime,
        getDuration: () => duration,
        seekTo: (t) => vp.setCurrentTime(t),
        getVolume: () => volume,
        setVolume: (v) => { vp.setVolume(v / 100); setVolume(v); },
        getMuted: () => isMuted,
        setMuted: (m) => { vp.setMuted(m); setIsMuted(m); },
      };
      vp.play().then(() => {
        setIsPlaying(true);
        setReady(true);
      });
    };

    if (window.Vimeo?.Player) {
      loadVimeo();
      return () => { playerRef.current = null; vimeoPlayerRef.current = null; };
    }
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    script.onload = loadVimeo;
    document.head.appendChild(script);
    return () => { playerRef.current = null; vimeoPlayerRef.current = null; };
  }, [embed?.provider, embed?.videoId]);

  // Vimeo: poll currentTime and duration when playing
  useEffect(() => {
    if (embed?.provider !== "vimeo" || !ready) return;
    const vp = vimeoPlayerRef.current;
    if (!vp) return;
    const id = setInterval(() => {
      vp.getCurrentTime().then(setCurrentTime);
      vp.getDuration().then(setDuration);
      vp.getPaused().then((p) => setIsPlaying(!p));
    }, 250);
    return () => clearInterval(id);
  }, [embed?.provider, ready]);

  const handlePlayPause = () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      p.pause();
      stopTick();
    } else {
      p.play();
      startTick();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = playerRef.current;
    if (!p) return;
    const t = Number(e.target.value);
    setCurrentTime(t);
    p.seekTo(t);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    const next = !isMuted;
    setIsMuted(next);
    p.setMuted(next);
    if (next) p.setVolume(0);
    else p.setVolume(volume || 100);
  };

  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
      onClick={onClose}
    >
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "tween", duration: 0.2 }}
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top: close + title */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
          <p className="text-white font-semibold text-sm truncate max-w-[70%]">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video area */}
        <div className="relative flex-1 min-h-0">
          {embed.provider === "youtube" && <div ref={ytDivRef} className="absolute inset-0 w-full h-full" />}
          {embed.provider === "vimeo" && (
            <iframe
              ref={vimeoIframeRef}
              src={embed.embedUrl}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
          {/* Overlay to block hover; corner mask hides YT/Vimeo logo */}
          <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden />
          <div
            className="absolute bottom-0 right-0 z-10 w-36 h-24 pointer-events-none bg-gradient-to-tl from-black/95 via-black/40 to-transparent"
            aria-hidden
          />
        </div>

        {/* Custom control bar */}
        <div className="z-30 flex items-center gap-3 px-3 py-2 bg-black/80 border-t border-white/10">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-icube-gold hover:text-icube-dark transition-colors shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <span className="text-white/90 text-xs tabular-nums shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrentTime(t);
              playerRef.current?.seekTo(t);
            }}
            className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 accent-icube-gold cursor-pointer"
          />
          <span className="text-white/90 text-xs tabular-nums shrink-0">{formatTime(duration)}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 rounded-full appearance-none bg-white/20 accent-icube-gold cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={handleFullscreen}
            className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white shrink-0"
            aria-label="Fullscreen"
          >
            <Maximize size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
