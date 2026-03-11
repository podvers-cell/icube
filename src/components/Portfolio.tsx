"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useContactModal } from "../ContactModalContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import { VideoPlayerModal } from "./VideoPlayerModal";
import AnimatedStaggerItem from "./AnimatedStaggerItem";

type Project = { id: number; title: string; category: string; image_url: string; sort_order: number; video_url?: string };

type PortfolioProps = {
  /** Show only this many items (e.g. on home). Omit for full portfolio page. */
  limit?: number;
  /** Small label above title. Default "Selected work". Use "Our work" on full page. */
  sectionLabel?: string;
  /** Main heading. Default "Portfolio highlights". Use "Our work" on full page. */
  title?: string;
  /** Show "Full portfolio" link to /portfolio. Default true when limit is set. */
  showFullPortfolioLink?: boolean;
};

export default function Portfolio({ limit, sectionLabel = "Selected work", title: titleProp = "Portfolio highlights", showFullPortfolioLink = !!limit }: PortfolioProps) {
  const { portfolio } = useSiteData();
  const { openContact } = useContactModal();
  const [playingProject, setPlayingProject] = useState<Project | null>(null);
  const items = limit != null ? portfolio.slice(0, limit) : portfolio;

  return (
    <section
      id="portfolio"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/80 relative overflow-hidden"
    >
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-16 flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              {sectionLabel}
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            {titleProp}
          </h2>
          <div className="section-header-accent" aria-hidden />
          {showFullPortfolioLink ? (
            <Link
              href="/portfolio"
              className="mt-4 inline-flex items-center gap-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-white/80 hover:text-icube-gold transition-colors border-b border-white/20 pb-1 hover:border-icube-gold"
            >
              Full portfolio
            </Link>
          ) : (
            <button
              type="button"
              onClick={openContact}
              className="mt-4 inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-white/80 hover:text-icube-gold transition-colors border-b border-white/20 pb-1 hover:border-icube-gold text-left"
            >
              Get in touch about a project
            </button>
          )}
        </div>

        {/* Mobile: arrow-controlled carousel, one card at a time */}
        <div className="md:hidden">
          <MobilePortfolioCarousel items={items} setPlayingProject={setPlayingProject} />
        </div>

        {/* Desktop / tablet: original grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-8">
          {items.map((project, index) => (
            <AnimatedStaggerItem key={project.id} index={index}>
              <PortfolioCard project={project} setPlayingProject={setPlayingProject} />
            </AnimatedStaggerItem>
          ))}
        </div>
      </div>

      {playingProject && (() => {
          const embed = playingProject.video_url ? getVideoEmbed(playingProject.video_url) : null;
          if (!embed) return null;
          return (
            <VideoPlayerModal
              key={playingProject.id}
              embed={embed}
              title={playingProject.title}
              onClose={() => setPlayingProject(null)}
            />
          );
        })()}
    </section>
  );
}

function PortfolioCard({
  project,
  setPlayingProject,
}: {
  project: Project;
  setPlayingProject: (p: Project | null) => void;
}) {
  const hasVideo = project.video_url && getVideoEmbed(project.video_url);
  return (
    <div
      role={hasVideo ? "button" : undefined}
      tabIndex={hasVideo ? 0 : undefined}
      onClick={() => hasVideo && setPlayingProject(project)}
      onKeyDown={(e) => hasVideo && (e.key === "Enter" || e.key === " ") && setPlayingProject(project)}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-icube-gold/30 hover:shadow-[0_24px_56px_rgba(0,0,0,0.4)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      <img
        src={project.image_url}
        alt={project.title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent/80 opacity-85 group-hover:opacity-95 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/15 border border-white/30 shadow-[0_0_28px_rgba(212,175,55,0.5),0_0_56px_rgba(212,175,55,0.25)]">
          <Play size={32} className="text-white ml-1" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <span className="text-icube-gold font-mono text-xs tracking-[0.2em] uppercase mb-2 block">
          {project.category}
        </span>
        <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight drop-shadow-sm">
          {project.title}
        </h3>
      </div>
    </div>
  );
}

function MobilePortfolioCarousel({
  items,
  setPlayingProject,
}: {
  items: Project[];
  setPlayingProject: (p: Project | null) => void;
}) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const current = items[index];

  const goPrev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <button
          type="button"
          onClick={goPrev}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-white/20 text-gray-200 hover:bg-white/10"
        >
          <ChevronLeft size={14} className="mr-1" />
          Previous
        </button>
        <span className="tracking-[0.18em] uppercase text-[11px]">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-white/20 text-gray-200 hover:bg-white/10"
        >
          Next
          <ChevronRight size={14} className="ml-1" />
        </button>
      </div>
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${index * 100}%` }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {items.map((p) => (
            <div key={p.id} className="w-full shrink-0">
              <PortfolioCard project={p} setPlayingProject={setPlayingProject} />
            </div>
          ))}
        </motion.div>
      </div>
      <div className="flex justify-center gap-2 pt-1">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
            }`}
            aria-label={`Go to project ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
