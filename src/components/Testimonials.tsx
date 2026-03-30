"use client";

import { useState } from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useSwipeCarousel } from "../hooks/useSwipeCarousel";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

export default function Testimonials() {
  const { testimonials } = useSiteData();

  return (
    <section
      id="testimonials"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark/95 via-icube-gray/75 to-icube-dark/90 relative overflow-hidden"
    >
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none hidden md:block" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatedSectionHeader className="section-header" amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Client stories</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title testimonials-section-heading">
            <span className="testimonials-title-gradient bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
              What our clients say
            </span>
          </h2>
          <div className="section-header-accent" aria-hidden />
        </AnimatedSectionHeader>

        {/* Mobile: arrow-controlled carousel */}
        <div className="md:hidden">
          <MobileTestimonialsCarousel testimonials={testimonials} />
        </div>

        {/* Desktop / tablet: grid with equal-height cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 items-stretch">
          {testimonials.map((t, index) => (
            <AnimatedStaggerItem key={t.id} index={index} className="h-full">
              <TestimonialCard testimonial={t} />
            </AnimatedStaggerItem>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial: t,
  fillSlide,
}: {
  testimonial: (ReturnType<typeof useSiteData>["testimonials"])[number];
  fillSlide?: boolean;
}) {
  return (
    <div className={fillSlide ? "w-full h-full" : "w-[85%] md:w-full mx-auto h-full"}>
    <div className="card-flip-wrap h-full">
      <motion.div
        className="card-flip glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl p-8 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.3),0_0_0_1px_rgba(212,175,55,0.1)]"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-icube-gold/0 group-hover:bg-icube-gold/50 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-r" />
        <Quote
          size={40}
          className="text-white/[0.06] absolute top-5 right-5 group-hover:text-icube-gold/15 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
          aria-hidden
        />
        <p className="text-gray-300 font-light leading-relaxed mb-8 relative z-10 pl-2 pr-14 pt-1 text-[15px] flex-1 min-h-[7rem]">
          "{t.quote}"
        </p>
        <div className="flex items-center gap-4 pl-2 shrink-0">
          {t.image_url ? (
            <Image
              src={t.image_url}
              alt={t.author}
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-icube-gold/30 grayscale group-hover:grayscale-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/10 ring-2 ring-white/10 flex items-center justify-center text-icube-gold/80 font-display font-semibold text-sm" aria-hidden>
              {t.author.charAt(0)}
            </div>
          )}
          <div>
            <h4 className="font-display font-semibold text-white">{t.author}</h4>
            <p className="text-icube-gold/90 text-xs uppercase tracking-wider">{t.role}</p>
          </div>
        </div>
      </motion.div>
    </div>
    </div>
  );
}

function MobileTestimonialsCarousel({
  testimonials,
}: {
  testimonials: ReturnType<typeof useSiteData>["testimonials"];
}) {
  const len = testimonials.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goPrev = () => {
    if (!len) return;
    setDirection(-1);
    setIndex((i) => (i - 1 + len) % len);
  };
  const goNext = () => {
    if (!len) return;
    setDirection(1);
    setIndex((i) => (i + 1) % len);
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
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={testimonials[logicalIndex]?.id ?? logicalIndex}
            initial={{ x: direction > 0 ? 36 : -36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -36 : 36, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.8, 0.25, 1] }}
            className="w-full px-2"
          >
            <TestimonialCard testimonial={testimonials[logicalIndex]!} fillSlide />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-2 pt-1">
        {testimonials.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (i !== logicalIndex) {
                setDirection(i > logicalIndex ? 1 : -1);
                setIndex(i);
              }
            }}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === logicalIndex ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
