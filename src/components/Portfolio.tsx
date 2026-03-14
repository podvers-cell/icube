"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useSwipeCarousel } from "../hooks/useSwipeCarousel";
import { useContactModal } from "../ContactModalContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import { VideoPlayerModal } from "./VideoPlayerModal";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

type Project = {
  id: number | string;
  title: string;
  category: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  visible?: boolean;
  show_in_selected_work?: boolean;
};

type PortfolioProps = {
  /** Show only this many items (e.g. on home). Omit for full portfolio page. */
  limit?: number;
  /** Small label above title. Default "Selected work". Use "Our work" on full page. */
  sectionLabel?: string;
  /** Main heading. Default "Portfolio highlights". Use "Our work" on full page. */
  title?: string;
  /** Show "Full portfolio" link to /portfolio. Default true when limit is set. */
  showFullPortfolioLink?: boolean;
  /** When true (home), show only items with show_in_selected_work. When false (full page), show all visible. */
  useSelectedWorkOnly?: boolean;
};

export default function Portfolio({ limit, sectionLabel = "Selected work", title: titleProp = "Portfolio highlights", showFullPortfolioLink = !!limit, useSelectedWorkOnly = false }: PortfolioProps) {
  const { portfolio } = useSiteData();
  const { openContact } = useContactModal();
  const [playingProject, setPlayingProject] = useState<Project | null>(null);
  const items = (() => {
    let list = portfolio.filter((p) => p.visible !== false);
    if (useSelectedWorkOnly) {
      list = list.filter((p) => !!p.show_in_selected_work);
      // If no items marked for Selected Work, show first N visible (fallback so section isn’t empty)
      if (list.length === 0) list = portfolio.filter((p) => p.visible !== false);
    }
    list = [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return limit != null ? list.slice(0, limit) : list;
  })();

  const columnsPerRow = limit != null ? 3 : 4;
  const gridColsClass = limit != null ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";
  const separatorSpanClass = limit != null ? "md:col-span-2 lg:col-span-3" : "md:col-span-2 lg:col-span-4";
  const isSelectedWork = limit != null;

  const useBentoLayout = isSelectedWork && items.length >= 2 && items.length <= 4 && limit != null;

  return (
    <section
      id="portfolio"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/80 relative overflow-hidden"
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(212,175,55,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-icube-gold/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header: more dramatic for selected work */}
        <AnimatedSectionHeader className={`section-header ${useBentoLayout ? "md:mb-20" : ""}`} amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">{sectionLabel}</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title portfolio-section-heading">
            {useBentoLayout ? (
              <span className="portfolio-title-gradient bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
                {titleProp}
              </span>
            ) : (
              titleProp
            )}
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4 text-center text-sm md:text-base leading-relaxed">
            A selection of our latest video and content work for brands and creators.
          </p>
          {showFullPortfolioLink ? (
            <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ type: "tween", duration: 0.2 }}>
              <Link
                href="/portfolio"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider bg-white/5 border border-icube-gold/40 text-icube-gold hover:bg-icube-gold/15 hover:border-icube-gold/60 transition-all duration-300"
              >
                Full portfolio
                <ChevronRight size={16} className="opacity-80" />
              </Link>
            </motion.span>
          ) : (
            <button
              type="button"
              onClick={openContact}
              className="mt-4 inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-white/80 hover:text-icube-gold transition-colors border-b border-white/20 pb-1 hover:border-icube-gold text-left"
            >
              Get in touch about a project
            </button>
          )}
        </AnimatedSectionHeader>

        {items.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-gray-400 font-light mb-6">No projects to show yet.</p>
            <button
              type="button"
              onClick={openContact}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-icube-gold hover:text-icube-gold-light transition-colors border-b border-icube-gold/50 pb-1 hover:border-icube-gold"
            >
              Get in touch about a project
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: arrow-controlled carousel */}
            <div className="md:hidden">
              <MobilePortfolioCarousel items={items} setPlayingProject={setPlayingProject} enhanced={isSelectedWork} />
            </div>

            {/* Desktop: bento layout for selected work (3–4 items), else standard grid */}
            {useBentoLayout ? (
              <div className="hidden md:block">
                <BentoSelectedWork items={items} setPlayingProject={setPlayingProject} />
              </div>
            ) : (
              <div className={`hidden md:grid ${gridColsClass} gap-6 lg:gap-8`}>
                {items.map((project, index) => (
                  <React.Fragment key={project.id}>
                    <AnimatedStaggerItem index={index}>
                      <PortfolioCard project={project} setPlayingProject={setPlayingProject} enhanced={isSelectedWork} />
                    </AnimatedStaggerItem>
                    {(index + 1) % columnsPerRow === 0 && index !== items.length - 1 && (
                      <div className={`${separatorSpanClass} portfolio-row-separator border-b border-white/15 my-4`} aria-hidden />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </>
        )}
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

/** Bento layout for selected work: one large featured card (2 cols, 2 rows) + two smaller cards stacked on the right */
function BentoSelectedWork({ items, setPlayingProject }: { items: Project[]; setPlayingProject: (p: Project | null) => void }) {
  const [featured, ...rest] = items;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 lg:grid-rows-2 lg:auto-rows-fr">
      {/* Featured: 2 cols, 2 rows on desktop */}
      <AnimatedStaggerItem index={0} className="lg:col-span-2 lg:row-span-2 min-h-[280px] lg:min-h-0">
        <BentoFeaturedCard project={featured} setPlayingProject={setPlayingProject} />
      </AnimatedStaggerItem>
      {/* Side stack: one card per row */}
      {rest.slice(0, 2).map((project, i) => (
        <AnimatedStaggerItem key={project.id} index={i + 1} className="min-h-[180px] lg:min-h-0">
          <BentoSmallCard project={project} setPlayingProject={setPlayingProject} />
        </AnimatedStaggerItem>
      ))}
    </div>
  );
}

function BentoFeaturedCard({ project, setPlayingProject }: { project: Project; setPlayingProject: (p: Project | null) => void }) {
  const hasVideo = project.video_url && getVideoEmbed(project.video_url);
  return (
    <motion.div
      className="group h-full min-h-[280px] lg:min-h-[340px] flex flex-col"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "tween", duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        role={hasVideo ? "button" : undefined}
        tabIndex={hasVideo ? 0 : undefined}
        onClick={() => hasVideo && setPlayingProject(project)}
        onKeyDown={(e) => hasVideo && (e.key === "Enter" || e.key === " ") && setPlayingProject(project)}
        className="group/card relative flex-1 min-h-[240px] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] cursor-pointer
          shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]
          hover:border-icube-gold/50 hover:shadow-[0_28px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(212,175,55,0.25),0_0_60px_rgba(212,175,55,0.12)]
          transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-icube-gold/0 to-transparent group-hover:via-icube-gold/70 transition-all duration-500 z-20 pointer-events-none rounded-t-2xl" />
        <div className="absolute inset-0">
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
            style={{ transformOrigin: "center center" }}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="rounded-full flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-icube-gold/25 border border-icube-gold/50 shadow-[0_0_24px_rgba(212,175,55,0.4)] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300">
            <Play size={28} className="text-white ml-1" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BentoSmallCard({ project, setPlayingProject }: { project: Project; setPlayingProject: (p: Project | null) => void }) {
  const hasVideo = project.video_url && getVideoEmbed(project.video_url);
  return (
    <motion.div
      className="group h-full flex flex-col"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        role={hasVideo ? "button" : undefined}
        tabIndex={hasVideo ? 0 : undefined}
        onClick={() => hasVideo && setPlayingProject(project)}
        onKeyDown={(e) => hasVideo && (e.key === "Enter" || e.key === " ") && setPlayingProject(project)}
        className="group/card relative flex-1 min-h-[160px] overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] cursor-pointer
          shadow-[0_8px_24px_rgba(0,0,0,0.3)]
          hover:border-icube-gold/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212,175,55,0.15)]
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-icube-gold/0 to-transparent group-hover:via-icube-gold/60 transition-all duration-400 rounded-t-xl" />
        <div className="absolute inset-0">
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ transformOrigin: "center center" }}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="rounded-full w-12 h-12 flex items-center justify-center bg-icube-gold/25 border border-icube-gold/40">
            <Play size={22} className="text-white ml-0.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PortfolioCard({
  project,
  setPlayingProject,
  enhanced = false,
}: {
  project: Project;
  setPlayingProject: (p: Project | null) => void;
  enhanced?: boolean;
}) {
  const hasVideo = project.video_url && getVideoEmbed(project.video_url);
  return (
    <div className="w-[85%] md:w-full mx-auto">
    <motion.div
      className="group/card flex flex-col gap-3"
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        role={hasVideo ? "button" : undefined}
        tabIndex={hasVideo ? 0 : undefined}
        onClick={() => hasVideo && setPlayingProject(project)}
        onKeyDown={(e) => hasVideo && (e.key === "Enter" || e.key === " ") && setPlayingProject(project)}
        className={`group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${enhanced
            ? "border border-white/15 bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)] hover:border-icube-gold/40 hover:shadow-[0_24px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(212,175,55,0.2),0_0_40px_rgba(212,175,55,0.08)]"
            : "border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-icube-gold/30 hover:shadow-[0_24px_56px_rgba(0,0,0,0.4)]"
          }`}
      >
        {enhanced && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-icube-gold/0 to-transparent group-hover:via-icube-gold/80 transition-all duration-500 z-20 pointer-events-none rounded-t-2xl" />
        )}
        <div className="relative w-full h-full">
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${enhanced ? "group-hover:scale-[1.08]" : "group-hover:scale-105"}`}
            style={enhanced ? { transformOrigin: "center center" } : undefined}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none">
          <div className={`rounded-full flex items-center justify-center border shadow-[0_0_28px_rgba(212,175,55,0.5),0_0_56px_rgba(212,175,55,0.25)] ${enhanced ? "w-24 h-24 bg-icube-gold/20 border-icube-gold/50" : "w-20 h-20 bg-white/15 border-white/30"}`}>
            <Play size={enhanced ? 36 : 32} className="text-white ml-1" />
          </div>
        </div>
      </div>
    </motion.div>
    </div>
  );
}

function MobilePortfolioCarousel({
  items,
  setPlayingProject,
  enhanced = false,
}: {
  items: Project[];
  setPlayingProject: (p: Project | null) => void;
  enhanced?: boolean;
}) {
  const len = items.length;
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const displayItems = len ? [...items, ...items] : [];

  useEffect(() => {
    if (!noTransition) return;
    const id = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(id);
  }, [noTransition, index]);

  const goPrev = () => {
    if (index === 0) {
      setNoTransition(true);
      setIndex(2 * len - 1);
    } else setIndex((i) => i - 1);
  };
  const goNext = () => {
    if (index === 2 * len - 1) {
      setNoTransition(true);
      setIndex(0);
    } else setIndex((i) => i + 1);
  };
  const swipe = useSwipeCarousel(goPrev, goNext);
  const logicalIndex = len ? index % len : 0;

  if (!len) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center text-xs text-gray-400 px-1">
        <span className="tracking-[0.18em] uppercase text-[11px]">
          {logicalIndex + 1} / {len}
        </span>
      </div>
      <div
        className="-mx-6 w-screen overflow-hidden touch-pan-y select-none max-w-[100vw] box-content"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <motion.div
          className="flex"
          animate={{ x: `-${index * 100}%` }}
          transition={noTransition ? { duration: 0 } : { duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {displayItems.map((p, i) => (
            <div key={`${p.id}-${i}`} className="w-full shrink-0">
              <PortfolioCard project={p} setPlayingProject={setPlayingProject} enhanced={enhanced} />
            </div>
          ))}
        </motion.div>
      </div>
      <div className="flex justify-center gap-2 pt-1">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (i !== logicalIndex) setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === logicalIndex ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
            }`}
            aria-label={`Go to project ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
