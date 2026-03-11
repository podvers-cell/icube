"use client";

import { Quote } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import AnimatedStaggerItem from "./AnimatedStaggerItem";

export default function Testimonials() {
  const { testimonials } = useSiteData();

  return (
    <section
      id="testimonials"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-gray via-icube-dark/80 to-icube-gray relative overflow-hidden"
    >
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Client stories
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            What our clients say
          </h2>
          <div className="section-header-accent" aria-hidden />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <AnimatedStaggerItem key={t.id} index={index}>
            <div className="card-flip-wrap">
              <div className="card-flip group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-8 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.08)]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-icube-gold/0 group-hover:bg-icube-gold/50 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-r" />
              <Quote size={44} className="text-white/[0.06] absolute top-6 right-6 group-hover:text-icube-gold/15 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
              <p className="text-gray-300 font-light leading-relaxed mb-8 relative z-10 pl-2 text-[15px]">"{t.quote}"</p>
              <div className="flex items-center gap-4 pl-2">
                <img src={t.image_url} alt={t.author} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-icube-gold/30 grayscale group-hover:grayscale-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-display font-semibold text-white">{t.author}</h4>
                  <p className="text-icube-gold/90 text-xs uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
            </div>
            </AnimatedStaggerItem>
          ))}
        </div>
      </div>
    </section>
  );
}
