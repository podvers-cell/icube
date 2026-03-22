"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeCarousel } from "../hooks/useSwipeCarousel";
import { useSiteData } from "../SiteDataContext";
import { useBooking } from "../BookingContext";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

const OPTIMIZED_IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
function isOptimizedImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return OPTIMIZED_IMAGE_HOSTS.some((h) => host === h);
  } catch {
    return false;
  }
}

export default function Studio() {
  const router = useRouter();
  const { studios } = useSiteData();
  const { setSelectedStudio, setSelectedPackage } = useBooking();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [desktopPage, setDesktopPage] = useState(0);
  const desktopCardsPerPage = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(studios.length / desktopCardsPerPage));
  const canGoPrev = desktopPage > 0;
  const canGoNext = desktopPage < desktopTotalPages - 1;
  const desktopStartIndex = desktopPage * desktopCardsPerPage;
  const desktopPageStudios = studios.slice(desktopStartIndex, desktopStartIndex + desktopCardsPerPage);

  function StudioCard({
    studio,
    expandedId,
    setExpandedId,
    setSelectedStudio,
    setSelectedPackage,
    router,
    isPriority = false,
  }: {
    studio: (typeof studios)[number];
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    setSelectedStudio: (studio: { id: string; name: string; price_aed_per_hour: number }) => void;
    setSelectedPackage: (p: null) => void;
    router: ReturnType<typeof useRouter>;
    isPriority?: boolean;
  }) {
    const s = studio;
    const useNextImage = isOptimizedImageUrl(s.cover_image_url);
    return (
      <div className="w-[95%] md:w-full mx-auto h-full">
      <article className="studio-card glass-card flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300">
        <Link
          href={`/studio/${s.id}`}
          className="relative block w-full aspect-[4/3] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold focus-visible:ring-offset-2 focus-visible:ring-offset-icube-dark"
        >
          {useNextImage ? (
            <Image
              src={s.cover_image_url}
              alt={s.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover hover:scale-105 transition-transform duration-500 ease-out"
              priority={isPriority}
              loading={isPriority ? undefined : "lazy"}
            />
          ) : (
            <img
              src={s.cover_image_url}
              alt={s.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
              loading={isPriority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={isPriority ? "high" : undefined}
            />
          )}
        </Link>
        <div className="flex flex-col flex-1 p-6">
          <h3 className="text-xl font-display font-bold text-white mb-1">{s.name}</h3>
          <div className="mb-3 flex items-baseline gap-2">
            {"price_aed_per_hour_before" in s && s.price_aed_per_hour_before ? (
              <span className="text-gray-500 text-xs line-through">{s.price_aed_per_hour_before} AED/hour</span>
            ) : null}
            <span className="text-icube-gold/90 text-sm font-semibold">{s.price_aed_per_hour} AED/hour</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{s.short_description}</p>

          <div className="studio-card-divider border-t border-white/10 pt-4 mt-1">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="flex items-center justify-between w-full py-2 text-left text-sm font-medium text-white/90 hover:text-icube-gold transition-colors"
              aria-expanded={expandedId === s.id}
              aria-label={expandedId === s.id ? `Collapse details for ${s.name}` : `Expand details for ${s.name}`}
            >
              <span>What&apos;s included?</span>
              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform duration-200 ${expandedId === s.id ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {expandedId === s.id && (
                <motion.div
                  key="studio-details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
                  className="overflow-hidden"
                  aria-live="polite"
                >
                  <ul className="pt-0 pb-3 space-y-2 text-sm text-gray-400">
                    <li>
                      <span className="text-white/80">Capacity:</span> {s.capacity} people
                    </li>
                    <li>
                      <span className="text-white/80">Size:</span> {s.size_sqm} m²
                    </li>
                    <li className="text-gray-400 leading-relaxed">{s.details}</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedStudio({
                id: s.id,
                name: s.name,
                price_aed_per_hour: s.price_aed_per_hour,
              });
              setSelectedPackage(null);
              router.push("/studio/booking/date-time");
            }}
            className="mt-4 inline-flex items-center justify-center w-full py-3 px-4 bg-icube-dark border border-icube-gold/40 text-white font-semibold uppercase tracking-wider text-sm rounded-lg hover:bg-icube-gold hover:text-icube-dark transition-colors duration-200"
            aria-label={`Book ${s.name} studio`}
          >
            Book now
          </button>
        </div>
      </article>
      </div>
    );
  }

  function MobileStudiosCarousel(props: {
    studios: typeof studios;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    setSelectedStudio: (studio: { id: string; name: string; price_aed_per_hour: number }) => void;
    setSelectedPackage: (p: null) => void;
    router: ReturnType<typeof useRouter>;
  }) {
    const { studios, expandedId, setExpandedId, setSelectedStudio, setSelectedPackage, router } = props;
    const len = studios.length;
    const [index, setIndex] = useState(0);
    const [noTransition, setNoTransition] = useState(false);
    const displayItems = len ? [...studios, ...studios] : [];

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
            {displayItems.map((s, i) => (
              <div key={`${s.id}-${i}`} className="w-full shrink-0">
                <StudioCard
                  studio={s}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  setSelectedStudio={setSelectedStudio}
                  setSelectedPackage={setSelectedPackage}
                  router={router}
                  isPriority={i === 0}
                />
              </div>
            ))}
          </motion.div>
        </div>
        <div className="flex justify-center gap-2 pt-1">
          {studios.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (i !== logicalIndex) setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === logicalIndex ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
              }`}
              aria-label={`Go to studio ${i + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      id="studio"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark/95 via-icube-gray/75 to-icube-dark/90 relative overflow-hidden"
    >
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatedSectionHeader className="section-header" amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Studio spaces</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title studio-section-heading">
            <span className="studio-title-gradient bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
              Explore our studios
            </span>
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4">
            Professional spaces for podcasts, video, and branded content. Choose your studio and book your slot.
          </p>
        </AnimatedSectionHeader>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <MobileStudiosCarousel
            studios={studios}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            setSelectedStudio={setSelectedStudio}
            setSelectedPackage={setSelectedPackage}
            router={router}
          />
        </div>

        {/* Desktop: 3 cards per row with left/right arrows */}
        <div className="hidden md:block">
          <div className="relative flex items-stretch">
            <button
              type="button"
              onClick={() => setDesktopPage((p) => Math.max(0, p - 1))}
              disabled={!canGoPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 z-10 w-11 h-11 rounded-full bg-icube-dark/90 border border-white/20 text-white flex items-center justify-center hover:bg-icube-gold hover:text-icube-dark hover:border-icube-gold disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-lg"
              aria-label="Previous studios"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 overflow-visible px-4">
              <div className="grid grid-cols-3 gap-4 max-w-[110%] mx-auto">
                {desktopPageStudios.map((s, index) => (
                  <AnimatedStaggerItem key={s.id} index={desktopStartIndex + index}>
                    <StudioCard
                      studio={s}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      setSelectedStudio={setSelectedStudio}
                      setSelectedPackage={setSelectedPackage}
                      router={router}
                      isPriority={desktopStartIndex + index === 0}
                    />
                  </AnimatedStaggerItem>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDesktopPage((p) => Math.min(desktopTotalPages - 1, p + 1))}
              disabled={!canGoNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 z-10 w-11 h-11 rounded-full bg-icube-dark/90 border border-white/20 text-white flex items-center justify-center hover:bg-icube-gold hover:text-icube-dark hover:border-icube-gold disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-lg"
              aria-label="Next studios"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          {desktopTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: desktopTotalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDesktopPage(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === desktopPage ? "bg-icube-gold w-6" : "bg-white/20 w-1.5"
                  }`}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
