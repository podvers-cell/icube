"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { useBooking } from "../BookingContext";
import AnimatedStaggerItem from "./AnimatedStaggerItem";

export default function Studio() {
  const router = useRouter();
  const { studios } = useSiteData();
  const { setSelectedStudio, setSelectedPackage } = useBooking();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selected = useMemo(() => studios.find((s) => s.id === openId) || null, [studios, openId]);
  const images = selected?.images?.length
    ? selected.images
    : selected
      ? [{ image_url: selected.cover_image_url, caption: null, sort_order: 0 }]
      : [];

  useEffect(() => {
    if (!selected) return;
    setActiveImage(0);
  }, [selected?.id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
      if (!selected) return;
      if (e.key === "ArrowLeft") setActiveImage((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setActiveImage((i) => (i + 1) % images.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, images.length]);

  function StudioCard({
    studio,
    expandedId,
    setExpandedId,
    setSelectedStudio,
    setSelectedPackage,
    setOpenId,
    router,
  }: {
    studio: (typeof studios)[number];
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    setSelectedStudio: (studio: { id: string; name: string; price_aed_per_hour: number }) => void;
    setSelectedPackage: (p: null) => void;
    setOpenId: (id: string | null) => void;
    router: ReturnType<typeof useRouter>;
  }) {
    const s = studio;
    return (
      <article className="flex flex-col rounded-2xl bg-white/[0.06] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300">
        <button
          type="button"
          onClick={() => setOpenId(s.id)}
          className="relative block w-full aspect-[4/3] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold focus-visible:ring-offset-2 focus-visible:ring-offset-icube-dark"
        >
          <img
            src={s.cover_image_url}
            alt={s.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </button>
        <div className="flex flex-col flex-1 p-6">
          <h3 className="text-xl font-display font-bold text-white mb-1">{s.name}</h3>
          <div className="mb-3 flex items-baseline gap-2">
            {"price_aed_per_hour_before" in s && s.price_aed_per_hour_before ? (
              <span className="text-gray-500 text-xs line-through">{s.price_aed_per_hour_before} AED/hour</span>
            ) : null}
            <span className="text-icube-gold/90 text-sm font-semibold">{s.price_aed_per_hour} AED/hour</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{s.short_description}</p>

          <div className="border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="flex items-center justify-between w-full py-2 text-left text-sm font-medium text-white/90 hover:text-icube-gold transition-colors"
              aria-expanded={expandedId === s.id}
            >
              <span>What&apos;s included?</span>
              <ChevronDown
                size={18}
                className={`shrink-0 transition-transform duration-200 ${expandedId === s.id ? "rotate-180" : ""}`}
              />
            </button>
            {expandedId === s.id && (
              <div className="overflow-hidden">
                <ul className="pt-0 pb-3 space-y-2 text-sm text-gray-400">
                  <li>
                    <span className="text-white/80">Capacity:</span> {s.capacity} people
                  </li>
                  <li>
                    <span className="text-white/80">Size:</span> {s.size_sqm} m²
                  </li>
                  <li className="text-gray-400 leading-relaxed">{s.details}</li>
                </ul>
              </div>
            )}
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
          >
            Book now
          </button>
        </div>
      </article>
    );
  }

  function MobileStudiosCarousel(props: {
    studios: typeof studios;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    setSelectedStudio: (studio: { id: string; name: string; price_aed_per_hour: number }) => void;
    setSelectedPackage: (p: null) => void;
    setOpenId: (id: string | null) => void;
    router: ReturnType<typeof useRouter>;
  }) {
    const { studios, expandedId, setExpandedId, setSelectedStudio, setSelectedPackage, setOpenId, router } = props;
    const [index, setIndex] = useState(0);
    if (!studios.length) return null;
    const current = studios[index];

    const goPrev = () => setIndex((i) => (i - 1 + studios.length) % studios.length);
    const goNext = () => setIndex((i) => (i + 1) % studios.length);

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
            {index + 1} / {studios.length}
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
            {studios.map((s) => (
              <div key={s.id} className="w-full shrink-0">
                <StudioCard
                  studio={s}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  setSelectedStudio={setSelectedStudio}
                  setSelectedPackage={setSelectedPackage}
                  setOpenId={setOpenId}
                  router={router}
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
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
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
      className="py-28 md:py-32 bg-gradient-to-b from-icube-gray via-icube-dark/90 to-icube-gray/80 relative overflow-hidden"
    >
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-16 flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Studio spaces
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white">
            Explore our studios
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4">
            Professional spaces for podcasts, video, and branded content. Choose your studio and book your slot.
          </p>
        </div>

        {/* Mobile carousel with arrows */}
        <div className="md:hidden">
          <MobileStudiosCarousel
            studios={studios}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            setSelectedStudio={setSelectedStudio}
            setSelectedPackage={setSelectedPackage}
            setOpenId={setOpenId}
            router={router}
          />
        </div>

        {/* Desktop / tablet grid stays as before */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studios.map((s, index) => (
            <AnimatedStaggerItem key={s.id} index={index}>
              <StudioCard
                studio={s}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                setSelectedStudio={setSelectedStudio}
                setSelectedPackage={setSelectedPackage}
                setOpenId={setOpenId}
                router={router}
              />
            </AnimatedStaggerItem>
          ))}
        </div>
      </div>

      {selected && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setOpenId(null)}
          >
            <div
              className="w-full max-w-6xl bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                <div className="min-w-0">
                  <p className="text-icube-gold text-xs uppercase tracking-[0.2em]">Studio</p>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white truncate">{selected.name}</h3>
                </div>
                <button
                  onClick={() => setOpenId(null)}
                  className="p-2 rounded-sm hover:bg-white/5 text-gray-300 hover:text-white"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] flex-1 min-h-0 overflow-auto">
                <div className="relative bg-black min-h-[320px]">
                  <img
                    src={images[activeImage]?.image_url}
                    alt={selected.name}
                    className="w-full h-[380px] md:h-[560px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  {images.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, i) => (
                          <button
                            key={`${img.image_url}-${i}`}
                            onClick={() => setActiveImage(i)}
                            className={`shrink-0 w-20 h-14 rounded-sm overflow-hidden border ${
                              i === activeImage ? "border-icube-gold" : "border-white/10"
                            }`}
                            aria-label={`Thumbnail ${i + 1}`}
                          >
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 md:p-6 lg:p-6 max-w-[420px] lg:max-w-none flex flex-col gap-6 overflow-auto">
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium">About this studio</p>
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-5 min-h-[80px] shadow-inner">
                      <p className="text-gray-200 font-light text-sm leading-relaxed whitespace-pre-wrap break-words max-h-[240px] overflow-auto pr-1">
                        {selected.details}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-5 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium">Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-4 flex flex-col gap-2 min-h-[72px] shadow-inner">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium shrink-0">Price</p>
                        <div className="flex flex-col gap-0.5 min-h-0">
                          {selected.price_aed_per_hour_before ? (
                            <span className="text-gray-500 text-xs line-through shrink-0">
                              {selected.price_aed_per_hour_before} AED/hr
                            </span>
                          ) : null}
                          <span className="text-white font-semibold text-sm">{selected.price_aed_per_hour} AED/hr</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-4 flex flex-col gap-2 min-h-[72px] shadow-inner">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium shrink-0">Capacity</p>
                        <p className="text-white font-semibold text-sm mt-0.5">{selected.capacity} people</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setSelectedStudio({
                            id: selected.id,
                            name: selected.name,
                            price_aed_per_hour: selected.price_aed_per_hour,
                          });
                          setSelectedPackage(null);
                          setOpenId(null);
                          router.push("/studio/booking/date-time");
                        }
                      }}
                      className="w-full px-6 py-3.5 bg-icube-gold text-icube-dark font-semibold rounded-xl hover:bg-icube-gold-light transition-colors shadow-lg"
                    >
                      Book this studio
                    </button>
                    <p className="text-gray-500 text-[11px]">
                      Tip: Use ← → to browse images, Esc to close.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}
