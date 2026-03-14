"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import { VideoPlayerModal } from "./VideoPlayerModal";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

type Video = { id: string; title: string; url: string; sort_order: number };

export default function Videos() {
  const { videos } = useSiteData();
  const [playing, setPlaying] = useState<Video | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <section
      id="videos"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark/90 via-icube-gray/50 to-icube-dark/80 relative overflow-hidden"
    >
      <div className="absolute top-1/3 -left-24 w-72 h-72 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatedSectionHeader className="section-header" amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Videos</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title">Videos</h2>
          <div className="section-header-accent" aria-hidden />
        </AnimatedSectionHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => {
            const embed = getVideoEmbed(video.url);
            return (
              <AnimatedStaggerItem key={video.id} index={index}>
              <div className="card-flip-wrap">
                <button
                  type="button"
                  onClick={() => embed && setPlaying(video)}
                  className="card-flip w-full group text-left rounded-2xl overflow-hidden border border-white/10 bg-white/[0.06] backdrop-blur-sm hover:border-icube-gold/40 shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold"
                >
                <div className="aspect-video bg-black/50 flex items-center justify-center relative overflow-hidden">
                  {embed ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 opacity-70 group-hover:opacity-90 transition-opacity" />
                      <div className="relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-white/15 border border-white/30 shadow-[0_0_24px_rgba(212,175,55,0.45),0_0_48px_rgba(212,175,55,0.2)]">
                        <Play size={26} className="text-white ml-1 md:ml-1" fill="currentColor" />
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">Unsupported link</span>
                  )}
                </div>
                <div className="p-4 md:p-5 border-t border-white/5">
                  <h3 className="font-display font-semibold text-white group-hover:text-icube-gold transition-colors line-clamp-2 text-sm md:text-base">
                    {video.title}
                  </h3>
                </div>
              </button>
              </div>
              </AnimatedStaggerItem>
            );
          })}
        </div>
      </div>

      {playing && (() => {
          const embed = getVideoEmbed(playing.url);
          if (!embed) return null;
          return (
            <VideoPlayerModal
              key={playing.id}
              embed={embed}
              title={playing.title}
              onClose={() => setPlaying(null)}
            />
          );
        })()}
    </section>
  );
}
