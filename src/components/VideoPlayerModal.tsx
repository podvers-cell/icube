"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize, Zap } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { VideoEmbedResult } from "../lib/videoEmbed";

type VideoDimensions = { width: number; height: number };

async function fetchEmbedDimensions(embed: VideoEmbedResult, signal?: AbortSignal): Promise<VideoDimensions | null> {
  try {
    if (embed.provider === "youtube") {
      const res = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${embed.videoId}`)}`,
        { signal }
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { width?: number; height?: number };
      if (Number.isFinite(json.width) && Number.isFinite(json.height) && (json.width ?? 0) > 0 && (json.height ?? 0) > 0) {
        return { width: json.width!, height: json.height! };
      }
      return null;
    }

    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${embed.videoId}`)}`,
      { signal }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { width?: number; height?: number };
    if (Number.isFinite(json.width) && Number.isFinite(json.height) && (json.width ?? 0) > 0 && (json.height ?? 0) > 0) {
      return { width: json.width!, height: json.height! };
    }
    return null;
  } catch {
    return null;
  }
}

export type VideoPlayerProjectInfo = {
  subtitle?: string;
  category?: string;
  description?: string;
  deliverables?: string[];
  year?: string;
  camera?: string;
  output?: string;
};

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
  projectInfo,
}: {
  embed: VideoEmbedResult;
  title: string;
  onClose: () => void;
  projectInfo?: VideoPlayerProjectInfo;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);
  const ytDivRef = useRef<HTMLDivElement>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerApi | null>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDims, setVideoDims] = useState<VideoDimensions | null>(null);

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
      if (p) {
        const t = p.getCurrentTime();
        if (Number.isFinite(t)) setCurrentTime(t);
      }
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
  }, [stopTick]);

  useEffect(() => {
    return () => stopTick();
  }, [stopTick]);

  // Fetch actual video aspect (portrait vs landscape) so modal matches the video.
  useEffect(() => {
    if (!embed) return;
    const controller = new AbortController();
    setVideoDims(null);
    fetchEmbedDimensions(embed, controller.signal).then((d) => {
      if (!controller.signal.aborted) setVideoDims(d);
    });
    return () => controller.abort();
  }, [embed?.provider, embed?.videoId]);

  // YouTube: poll duration when ready (in case it was 0 on first load)
  useEffect(() => {
    if (embed?.provider !== "youtube" || !ready) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p) {
        const d = p.getDuration();
        if (Number.isFinite(d) && d > 0) setDuration(d);
      }
    }, 500);
    return () => clearInterval(id);
  }, [embed?.provider, ready]);

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
                const d = yt.getDuration();
                if (Number.isFinite(d)) setDuration(d);
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
      const Vimeo = (window as unknown as { Vimeo: { Player: new (el: HTMLIFrameElement) => VimeoPlayer } }).Vimeo;
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
        getCurrentTime: () => 0,
        getDuration: () => 0,
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

  // Vimeo: poll currentTime and duration so timer and indicator update
  useEffect(() => {
    if (embed?.provider !== "vimeo" || !ready) return;
    const vp = vimeoPlayerRef.current;
    if (!vp) return;
    const id = setInterval(() => {
      vp.getCurrentTime().then((t) => setCurrentTime((prev) => (Number.isFinite(t) ? t : prev)));
      vp.getDuration().then((d) => setDuration((prev) => (Number.isFinite(d) ? d : prev)));
      vp.getPaused().then((p) => setIsPlaying(!p));
    }, 150);
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
    if (!containerRef.current) return;

    // خرج من وضع ملء الشاشة إن كان مفعّلًا
    const docAny = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };
    if (document.fullscreenElement || docAny.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (docAny.webkitExitFullscreen) {
        docAny.webkitExitFullscreen().catch(() => {});
      }
      return;
    }

    // دخول ملء الشاشة على نفس كارت الفيديو داخل الموقع (حيثما كان مدعومًا)
    const elAny = containerRef.current as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (elAny.requestFullscreen) {
      elAny.requestFullscreen().catch(() => {});
    } else if (elAny.webkitRequestFullscreen) {
      elAny.webkitRequestFullscreen().catch(() => {});
    }
  };

  const hasProjectInfo = projectInfo && (projectInfo.subtitle || projectInfo.category || projectInfo.description || (projectInfo.deliverables?.length) || projectInfo.year || projectInfo.camera || projectInfo.output);
  const tags = projectInfo?.category ? [projectInfo.category] : [];
  const aspect = videoDims?.width && videoDims?.height ? `${videoDims.width} / ${videoDims.height}` : "16 / 9";
  const isPortrait = (videoDims?.height ?? 0) > (videoDims?.width ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 bg-[#1a1d26]"
        style={{
          maxWidth: isPortrait ? "min(92vw, 420px)" : "min(96vw, 56rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close – top right of card */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition-colors shrink-0 border border-white/10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Video area – aspect matches the actual video */}
        <div
          className="relative w-full min-h-0 bg-black overflow-hidden"
          style={{
            aspectRatio: aspect,
            maxHeight: "85svh",
          }}
        >
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
          {/* Centered play overlay when paused */}
          {!isPlaying && (
            <button
              type="button"
              onClick={handlePlayPause}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              aria-label="Play"
            >
              <span className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 hover:scale-105 transition-all">
                <Play size={36} className="text-white ml-1" fill="white" />
              </span>
            </button>
          )}
        </div>

        {/* تم إخفاء قسم البيانات، التفاصيل، واسم المقطع بالكامل من البلاير */}

        {/* Control bar */}
        <div className="z-30 flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-black/30">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-icube-gold hover:text-icube-dark transition-colors shrink-0 border border-white/10"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <span className="text-white/90 text-xs tabular-nums shrink-0 min-w-[2.5rem]">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            value={Math.min(currentTime, duration > 0 ? duration : 1)}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrentTime(t);
              playerRef.current?.seekTo(t);
            }}
            className="video-progress-range flex-1 h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer min-w-0"
          />
          <span className="text-white/90 text-xs tabular-nums shrink-0 min-w-[2.5rem]">{formatTime(duration)}</span>
          {/* التحكم بالصوت مخفي على الموبايل فقط */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
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
          {/* زر ملء الشاشة: يظهر على الديسكتوب/التابلت فقط، وعلى الموبايل استخدم زر التكبير الأصلي داخل YouTube/Vimeo */}
          <button
            type="button"
            onClick={handleFullscreen}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Fullscreen"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
