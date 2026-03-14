"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { VideoEmbedResult } from "../lib/videoEmbed";
import type { VimeoPlayerInstance, YTPlayerInstance } from "../types/window";

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
  useFocusTrap(containerRef, true);
  const ytDivRef = useRef<HTMLDivElement>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerApi | null>(null);
  const vimeoPlayerRef = useRef<VimeoPlayerInstance | null>(null);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

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
          const player = new window.YT!.Player(ytDivRef.current, {
            videoId: ytId,
            playerVars: {
              autoplay: 1,
              mute: 0,
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
              onReady(e: { target: YTPlayerInstance }) {
                const yt = e.target;
                playerRef.current = {
                  play: () => yt.playVideo(),
                  pause: () => yt.pauseVideo(),
                  getPlaying: () => yt.getPlayerState() === window.YT!.PlayerState.PLAYING,
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
                yt.unMute();
                yt.setVolume(100);
                setIsMuted(false);
                setVolume(100);
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
      const Vimeo = (window as unknown as { Vimeo: { Player: new (el: HTMLIFrameElement) => VimeoPlayerInstance } }).Vimeo;
      if (!Vimeo?.Player) return;
      const vp = new Vimeo.Player(iframe);
      vimeoPlayerRef.current = vp;
      vp.getDuration().then((d) => setDuration(d));
      vp.getVolume().then((v) => setVolume(Math.round(v * 100)));
      vp.setMuted(false);
      vp.setVolume(1);
      setIsMuted(false);
      setVolume(100);
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
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 bg-white/[0.04] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header – glass */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-white/[0.06] backdrop-blur-md shrink-0">
          <p className="text-white font-semibold text-sm truncate flex-1 min-w-0">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-icube-gold hover:text-icube-dark transition-colors shrink-0 border border-white/5"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video area */}
        <div className="relative w-full aspect-video min-h-0 bg-black/40 rounded-none overflow-hidden">
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
          <div
            className="absolute inset-0 z-10 bg-transparent cursor-default"
            aria-hidden
            style={{ pointerEvents: "auto" }}
          />
        </div>

        {/* Control bar – glass */}
        <div className="z-30 flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-white/[0.06] backdrop-blur-md">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-icube-gold hover:text-icube-dark transition-colors shrink-0 border border-white/5"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <span className="text-white/90 text-xs tabular-nums shrink-0 min-w-[2.5rem]">{formatTime(currentTime)}</span>
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
            className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 accent-icube-gold cursor-pointer min-w-0"
          />
          <span className="text-white/90 text-xs tabular-nums shrink-0 min-w-[2.5rem]">{formatTime(duration)}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/5 transition-colors"
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
              className="w-14 h-1 rounded-full appearance-none bg-white/20 accent-icube-gold cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={handleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Fullscreen"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
