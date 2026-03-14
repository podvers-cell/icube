"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Zap, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { motion } from "motion/react";
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

export type ProjectDetail = {
  id: number | string;
  title: string;
  category: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  visible?: boolean;
  show_in_selected_work?: boolean;
  client?: string;
  subtitle?: string;
  description?: string;
  deliverables?: string[];
  year?: string | number;
  camera?: string;
  output?: string;
  live_link?: string;
  roles?: string[];
};

export function ProjectDetailModal({
  project,
  embed,
  onClose,
}: {
  project: ProjectDetail;
  embed: VideoEmbedResult;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
      if (!p) return;
      setCurrentTime(p.getCurrentTime());
      setDuration(p.getDuration());
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
  }, [stopTick]);

  useEffect(() => () => stopTick(), [stopTick]);

  /* استطلاع ثابت للوقت والحالة (YouTube) حتى يتحرك المؤشر والتايمر حتى لو الفيديو موقوف */
  useEffect(() => {
    if (embed?.provider !== "youtube" || !ready) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      const d = p.getDuration();
      if (Number.isFinite(t)) setCurrentTime(t);
      if (Number.isFinite(d) && d > 0) setDuration(d);
      setIsPlaying(p.getPlaying());
    }, 200);
    return () => clearInterval(id);
  }, [embed?.provider, ready]);

  useEffect(() => {
    if (!embed) return;
    if (embed.provider === "youtube") {
      const loadYT = () => {
        if (!ytDivRef.current || !embed || embed.provider !== "youtube") return;
        try {
          const player = new window.YT!.Player(ytDivRef.current, {
            videoId: embed.videoId,
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
                const d = yt.getDuration();
                if (Number.isFinite(d) && d > 0) setDuration(d);
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
        return () => { playerRef.current = null; };
      }
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); loadYT(); };
      document.head.appendChild(script);
      return () => { window.onYouTubeIframeAPIReady = prev; playerRef.current = null; };
    }
    if (embed.provider === "vimeo") {
      const iframe = vimeoIframeRef.current;
      if (!iframe) return;
      const loadVimeo = () => {
        const Vimeo = (window as unknown as { Vimeo: { Player: new (el: HTMLIFrameElement) => VimeoPlayerInstance } }).Vimeo;
        if (!Vimeo?.Player) return;
        const vp = new Vimeo.Player(iframe);
        vimeoPlayerRef.current = vp;
        vp.getDuration().then(setDuration);
        vp.getVolume().then((v) => setVolume(Math.round(v * 100)));
        vp.setMuted(false);
        vp.setVolume(1);
        setIsMuted(false);
        setVolume(100);
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
        vp.play().then(() => { setIsPlaying(true); setReady(true); });
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
    }
  }, [embed?.provider, embed?.videoId, startTick]);

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
    if (isPlaying) { p.pause(); stopTick(); } else { p.play(); startTick(); }
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
    if (!panelRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      panelRef.current.requestFullscreen();
    }
  };

  const subtitle = project.subtitle ?? project.client ?? "";
  const roles = project.roles?.length ? project.roles : [project.category];
  const hasDescription = !!project.description?.trim();
  const hasDeliverables = Array.isArray(project.deliverables) && project.deliverables.length > 0;
  const hasDetails = project.year ?? project.camera ?? project.output ?? project.live_link;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0d0f18] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close – top right of panel */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 hover:border-white/20 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Video – top of panel */}
        <div className="relative w-full aspect-video bg-black shrink-0 rounded-t-2xl overflow-hidden">
          {embed.provider === "youtube" && <div ref={ytDivRef} className="absolute inset-0 w-full h-full" />}
          {embed.provider === "vimeo" && (
            <iframe
              ref={vimeoIframeRef}
              src={embed.embedUrl}
              title={project.title}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        {/* Control bar – play/pause, time, seek, volume */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-black/40 shrink-0">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-icube-gold hover:text-icube-dark transition-colors shrink-0"
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
            onChange={handleSeek}
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
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>

        {/* Project details – scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 md:p-8">
            {/* Title row: title + subtitle + pills */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
                  {project.title}
                </h2>
                {subtitle && (
                  <p className="text-gray-400 text-lg mt-1">{subtitle}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="px-4 py-2 rounded-full bg-black/60 text-white text-xs font-semibold uppercase tracking-wider border border-white/10"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
              {/* Left: The Project + Deliverables */}
              <div className="lg:col-span-2 space-y-8">
                {hasDescription && (
                  <section>
                    <h3 className="flex items-center gap-2 text-icube-gold font-semibold text-sm uppercase tracking-wider mb-3">
                      <Zap size={16} />
                      The Project
                    </h3>
                    <p className="text-gray-300 font-light leading-relaxed">
                      {project.description}
                    </p>
                  </section>
                )}

                {hasDeliverables && (
                  <section>
                    <h3 className="text-icube-gold font-semibold text-sm uppercase tracking-wider mb-3">
                      Deliverables
                    </h3>
                    <ul className="list-disc list-inside text-gray-300 font-light space-y-1">
                      {project.deliverables!.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {!hasDescription && !hasDeliverables && (
                  <p className="text-gray-500 font-light">No additional details for this project.</p>
                )}
              </div>

              {/* Right: Details card */}
              {(hasDetails || project.category) && (
                <div className="lg:col-span-1">
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-6 space-y-4">
                    {project.year != null && (
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wider block mb-0.5">Year</span>
                        <span className="text-white font-medium">{String(project.year)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider block mb-0.5">Category</span>
                      <span className="text-white font-medium">{project.category || "—"}</span>
                    </div>
                    {project.camera && (
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wider block mb-0.5">Camera</span>
                        <span className="text-white font-medium">{project.camera}</span>
                      </div>
                    )}
                    {project.output && (
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wider block mb-0.5">Output</span>
                        <span className="text-white font-medium">{project.output}</span>
                      </div>
                    )}
                    {project.live_link && (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-black/60 border border-white/10 text-white text-sm font-semibold hover:bg-icube-gold hover:text-icube-dark hover:border-icube-gold transition-colors"
                      >
                        View Live Link
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
