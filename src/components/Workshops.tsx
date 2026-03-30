"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useSiteData } from "@/SiteDataContext";
import { useSwipeCarousel } from "@/hooks/useSwipeCarousel";
import { isWorkshopSoldOut } from "@/utils/workshopCapacity";
import { AnimatedSectionHeader } from "./ScrollReveal";
import AnimatedStaggerItem from "./AnimatedStaggerItem";

type Workshop = {
  id: string;
  title: string;
  price_before_aed?: number;
  price_aed: number;
  short_description?: string;
  description?: string;
  cover_image_url?: string;
  workshop_date?: string;
  duration_label?: string;
  group_size_label?: string;
  group_size_max?: number;
  paid_enrollments_count?: number;
  sold_out_override?: boolean;
  sold_out?: boolean;
  level_label?: string;
  highlights?: string[];
};

function WorkshopCard({ w, index }: { w: Workshop; index: number }) {
  const router = useRouter();
  const isSoldOut = useMemo(() => isWorkshopSoldOut(w), [w]);
  const isUpcoming = useMemo(() => {
    const d = (w.workshop_date || "").trim();
    if (!d) return false;
    const t = new Date(`${d}T00:00:00Z`).getTime();
    if (!Number.isFinite(t)) return false;
    return t >= Date.now() - 24 * 60 * 60 * 1000;
  }, [w.workshop_date]);

  return (
    <AnimatedStaggerItem index={index}>
      <motion.div
        className="glass-card group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 md:p-8 transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] h-full flex flex-col"
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-icube-gold/10 via-transparent to-transparent" />

        {w.cover_image_url ? (
          <div className="relative mb-5 -mx-7 md:-mx-8 -mt-7 md:-mt-8 overflow-hidden bg-black/30 aspect-[4/3]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <img
              src={w.cover_image_url}
              alt={w.title}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05] ${
                isSoldOut ? "grayscale" : ""
              }`}
              loading="lazy"
            />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-200/80">Workshop</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="truncate font-display font-semibold text-white">{w.title}</p>
                {isSoldOut ? (
                  <span className="shrink-0 rounded-full bg-red-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                    Sold out
                  </span>
                ) : isUpcoming ? (
                  <span className="shrink-0 rounded-full bg-icube-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-icube-dark shadow-[0_8px_24px_rgba(212,175,55,0.25)]">
                    Upcoming
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
            <h3 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-white group-hover:text-icube-gold transition-colors">
              {w.title}
            </h3>
            {isSoldOut ? (
              <span className="shrink-0 rounded-full bg-red-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                Sold out
              </span>
            ) : isUpcoming ? (
              <span className="shrink-0 rounded-full bg-icube-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-icube-dark shadow-[0_8px_24px_rgba(212,175,55,0.25)]">
                Upcoming
              </span>
            ) : null}
          </div>
        )}

        <div className="relative z-10 flex-1 flex flex-col">
          <p className="text-sm leading-relaxed text-gray-400 font-light line-clamp-3">
            {w.short_description || w.description || " "}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                <CalendarDays size={14} className="text-icube-gold" />
                Date
              </span>
              <span className="text-sm text-gray-200">{w.workshop_date || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                <Clock size={14} className="text-icube-gold" />
                Duration
              </span>
              <span className="text-sm text-gray-200">{w.duration_label || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                <Users size={14} className="text-icube-gold" />
                Group
              </span>
              <span className="text-sm text-gray-200">{w.group_size_label || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                <BadgeCheck size={14} className="text-icube-gold" />
                Level
              </span>
              <span className="text-sm text-gray-200">{w.level_label || "—"}</span>
            </div>
          </div>

          {Array.isArray(w.highlights) && w.highlights.length > 0 ? (
            <ul className="mt-5 space-y-2 text-sm text-gray-300">
              {w.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-icube-gold/80 shrink-0" aria-hidden />
                  <span className="line-clamp-2">{h}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 shrink-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.18em] text-gray-500">Price</span>
              <div className="flex items-baseline gap-2">
                {w.price_before_aed ? (
                  <span className="text-sm text-gray-500 line-through">AED {Number(w.price_before_aed)}</span>
                ) : null}
                <span className="text-base font-semibold text-icube-gold">AED {Number(w.price_aed ?? 0)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.push(`/workshops/${encodeURIComponent(w.id)}/checkout`)}
              disabled={isSoldOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-icube-gold px-4 py-3 text-xs font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSoldOut ? "Sold out" : "Enroll now"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/workshops/${encodeURIComponent(w.id)}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
            >
              Learn more <ArrowRight size={14} />
            </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatedStaggerItem>
  );
}

export default function Workshops() {
  const { workshops } = useSiteData();
  const items = (Array.isArray(workshops) ? workshops : []) as unknown as Workshop[];
  const len = items.length;

  // Desktop paging (3 cards per page)
  const desktopCardsPerPage = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(len / desktopCardsPerPage));
  const [desktopPage, setDesktopPage] = useState(0);
  const desktopStartIndex = desktopPage * desktopCardsPerPage;
  const desktopPageItems = items.slice(desktopStartIndex, desktopStartIndex + desktopCardsPerPage);
  const canGoPrev = desktopPage > 0;
  const canGoNext = desktopPage < desktopTotalPages - 1;

  // Mobile carousel (infinite loop like Studio)
  const [mobileIndex, setMobileIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const displayItems = len ? [...items, ...items] : [];
  const logicalIndex = len ? mobileIndex % len : 0;

  useEffect(() => {
    if (!noTransition) return;
    const id = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(id);
  }, [noTransition, mobileIndex]);

  const goPrev = () => {
    if (!len) return;
    if (mobileIndex === 0) {
      setNoTransition(true);
      setMobileIndex(2 * len - 1);
    } else setMobileIndex((i) => i - 1);
  };
  const goNext = () => {
    if (!len) return;
    if (mobileIndex === 2 * len - 1) {
      setNoTransition(true);
      setMobileIndex(0);
    } else setMobileIndex((i) => i + 1);
  };
  const swipe = useSwipeCarousel(goPrev, goNext);

  return (
    <section
      id="workshops"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark/90 via-icube-gray/70 to-icube-dark/95 relative overflow-hidden"
    >
      <div className="absolute -top-32 -right-40 w-[520px] h-[520px] bg-icube-gold/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-white/4 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatedSectionHeader className="section-header" amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Workshops</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title">
            <span className="bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
              Learn, shoot, and level up
            </span>
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4">
            Practical sessions inside ICUBE — designed for creators, founders, and teams who want better content, faster.
          </p>
        </AnimatedSectionHeader>

        {/* Mobile: swipe carousel + dots (only when > 1) */}
        <div className="mt-10 md:hidden">
          {len ? (
            <div className="space-y-4">
              {len > 1 ? (
                <div className="flex justify-center text-xs text-gray-400 px-1">
                  <span className="tracking-[0.18em] uppercase text-[11px]">
                    {logicalIndex + 1} / {len}
                  </span>
                </div>
              ) : null}
              <div
                className="-mx-6 w-screen overflow-hidden touch-pan-y select-none max-w-[100vw] box-content"
                onTouchStart={swipe.onTouchStart}
                onTouchEnd={swipe.onTouchEnd}
              >
                <motion.div
                  className="flex"
                  animate={{ x: `-${mobileIndex * 100}%` }}
                  transition={noTransition ? { duration: 0 } : { duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                >
                  {displayItems.map((w, i) => (
                    <div key={`${w.id}-${i}`} className="w-full shrink-0 px-6">
                      <WorkshopCard w={w} index={i} />
                    </div>
                  ))}
                </motion.div>
              </div>
              {len > 1 ? (
                <div className="flex justify-center gap-2 pt-1">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (i !== logicalIndex) setMobileIndex(i);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === logicalIndex ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
                      }`}
                      aria-label={`Go to workshop ${i + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Desktop: 3 cards per row + arrows + dots (only when > 3) */}
        <div className="hidden md:block mt-10">
          {len ? (
            <>
              <div className="relative flex items-stretch">
                {len > desktopCardsPerPage ? (
                  <button
                    type="button"
                    onClick={() => setDesktopPage((p) => Math.max(0, p - 1))}
                    disabled={!canGoPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 z-10 w-11 h-11 rounded-full bg-icube-dark/90 border border-white/20 text-white flex items-center justify-center hover:bg-icube-gold hover:text-icube-dark hover:border-icube-gold disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-lg"
                    aria-label="Previous workshops"
                  >
                    <ChevronLeft size={24} />
                  </button>
                ) : null}

                <div className="flex-1 overflow-visible px-4">
                  <div className="grid grid-cols-3 gap-4 items-stretch">
                    {desktopPageItems.map((w, index) => (
                      <WorkshopCard key={w.id} w={w} index={desktopStartIndex + index} />
                    ))}
                  </div>
                </div>

                {len > desktopCardsPerPage ? (
                  <button
                    type="button"
                    onClick={() => setDesktopPage((p) => Math.min(desktopTotalPages - 1, p + 1))}
                    disabled={!canGoNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 z-10 w-11 h-11 rounded-full bg-icube-dark/90 border border-white/20 text-white flex items-center justify-center hover:bg-icube-gold hover:text-icube-dark hover:border-icube-gold disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-lg"
                    aria-label="Next workshops"
                  >
                    <ChevronRight size={24} />
                  </button>
                ) : null}
              </div>

              {desktopTotalPages > 1 ? (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: desktopTotalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDesktopPage(i)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        i === desktopPage ? "bg-icube-gold w-6" : "bg-white/20 w-1.5"
                      }`}
                      aria-label={`Workshop page ${i + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

