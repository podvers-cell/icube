"use client";

import { useState } from "react";
import Image from "next/image";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

export default function Testimonials() {
  const { testimonials } = useSiteData();

  return (
    <section
      id="testimonials"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-gray via-icube-dark/80 to-icube-gray relative overflow-hidden"
    >
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />
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
}: {
  testimonial: (ReturnType<typeof useSiteData>["testimonials"])[number];
}) {
  return (
    <div className="card-flip-wrap h-full">
      <motion.div
        className="card-flip group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-8 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.08)]"
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
  );
}

function MobileTestimonialsCarousel({
  testimonials,
}: {
  testimonials: ReturnType<typeof useSiteData>["testimonials"];
}) {
  const [index, setIndex] = useState(0);
  if (!testimonials.length) return null;
  const current = testimonials[index];

  const goPrev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setIndex((i) => (i + 1) % testimonials.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <button
          type="button"
          onClick={goPrev}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-white/20 text-gray-200 hover:bg-white/10"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={14} className="mr-1" />
          Previous
        </button>
        <span className="tracking-[0.18em] uppercase text-[11px]">
          {index + 1} / {testimonials.length}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-white/20 text-gray-200 hover:bg-white/10"
          aria-label="Next testimonial"
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
          {testimonials.map((t) => (
            <div key={t.id} className="w-full shrink-0">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </motion.div>
      </div>
      <div className="flex justify-center gap-2 pt-1">
        {testimonials.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
