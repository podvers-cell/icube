"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useSiteData } from "../SiteDataContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import { ProjectDetailModal } from "../components/ProjectDetailModal";
import { PlayPulseOverlay } from "../components/PlayPulseOverlay";

type Project = {
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

function normalizeCategory(c: string) {
  return c.trim().toLowerCase();
}

function matchCategory(projectCategory: string, tab: string) {
  if (tab === "All") return true;
  return normalizeCategory(projectCategory) === normalizeCategory(tab);
}

export default function PortfolioPage() {
  const { portfolio } = useSiteData();
  const [activeCategory, setActiveCategory] = useState("All");
  const [playingProject, setPlayingProject] = useState<Project | null>(null);

  const visibleItems = useMemo(
    () =>
      portfolio
        .filter((p) => p.visible !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [portfolio]
  );

  const categories = useMemo(() => {
    const fromData = new Map<string, string>(); // normalized -> display
    visibleItems.forEach((p) => {
      const raw = p.category.trim();
      if (!raw) return;
      const norm = normalizeCategory(raw);
      if (!fromData.has(norm)) fromData.set(norm, raw);
    });
    const ordered: string[] = ["All"];
    ["Commercial", "Product", "Events", "Social", "Lifestyle"].forEach((label) => {
      if (fromData.has(normalizeCategory(label))) ordered.push(label);
    });
    fromData.forEach((display, norm) => {
      const inFixed = (["Commercial", "Product", "Events", "Social", "Lifestyle"] as const).some(
        (c) => normalizeCategory(c) === norm
      );
      if (!inFixed) ordered.push(display);
    });
    return ordered;
  }, [visibleItems]);

  const filteredItems = useMemo(
    () => visibleItems.filter((p) => matchCategory(p.category, activeCategory)),
    [visibleItems, activeCategory]
  );

  return (
    <div className="site-wrapper relative min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray/95 to-[#0d0f18] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300 overflow-hidden">
      {/* Glowing background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-[10%] left-[10%] w-[min(80vw,600px)] h-[min(80vw,600px)] rounded-full bg-icube-gold/12 blur-[120px] glow-orb-pulse" />
        <div className="absolute top-[50%] right-[5%] w-[min(50vw,400px)] h-[min(50vw,400px)] rounded-full bg-white/[0.05] blur-[100px] glow-orb-pulse-slow" />
        <div className="absolute bottom-[15%] left-[15%] w-[min(40vw,320px)] h-[min(40vw,320px)] rounded-full bg-icube-gold/8 blur-[80px]" />
      </div>
      <Navbar />
      <main id="main-content" className="relative z-10">
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-6 md:px-12 max-w-7xl mx-auto">
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight text-white mb-4">
            Portfolio
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
            A selection of our best work across various industries.
          </p>
        </section>

        {/* Category tabs */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto pb-8">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-white text-icube-dark"
                      : "bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Grid */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto pb-28 md:pb-32">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-white/10 bg-white/5">
              <p className="text-gray-400 font-light">No projects in this category yet.</p>
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className="mt-4 text-sm font-semibold uppercase tracking-wider text-icube-gold hover:text-icube-gold-light transition-colors"
              >
                View all
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((project, index) => (
                  <PortfolioPageCard
                    key={project.id}
                    project={project}
                    index={index}
                    onPlay={() => setPlayingProject(project)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
      <Footer />

      <AnimatePresence mode="wait">
        {playingProject && (() => {
          const embed = playingProject.video_url ? getVideoEmbed(playingProject.video_url) : null;
          return embed ? (
            <ProjectDetailModal
              key={playingProject.id}
              project={playingProject}
              embed={embed}
              onClose={() => setPlayingProject(null)}
            />
          ) : null;
        })()}
      </AnimatePresence>
    </div>
  );
}

function PortfolioPageCard({
  project,
  index,
  onPlay,
}: {
  project: Project;
  index: number;
  onPlay: () => void;
}) {
  const hasVideo = project.video_url && getVideoEmbed(project.video_url);
  const subtitle = project.subtitle ?? project.client ?? "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-white/[0.06] backdrop-blur-sm
        shadow-[0_12px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.04)]
        hover:border-white/25 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_24px_rgba(255,255,255,0.08),0_24px_56px_rgba(0,0,0,0.35)]
        transition-all duration-300"
    >
      {/* Image – full-bleed to rounded corners */}
      <div
        role={hasVideo ? "button" : undefined}
        tabIndex={hasVideo ? 0 : undefined}
        onClick={() => hasVideo && onPlay()}
        onKeyDown={(e) => hasVideo && (e.key === "Enter" || e.key === " ") && onPlay()}
        className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer"
      >
        <Image
          src={project.image_url}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:blur-[2px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
        {hasVideo && <PlayPulseOverlay className="z-10" />}
      </div>
      {/* Content: title, subtitle, tag right-aligned */}
      <div className="p-5 md:p-6 flex flex-col gap-1">
        <h3 className="font-display font-bold text-xl text-white tracking-tight">
          {project.title}
        </h3>
        {subtitle && (
          <p className="text-gray-400 text-sm font-normal">
            {subtitle}
          </p>
        )}
        <div className="flex justify-end mt-1">
          <span className="inline-block px-3 py-1.5 rounded-full bg-black/80 text-white text-[10px] font-semibold uppercase tracking-wider border border-white/10">
            {project.category || "Work"}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
