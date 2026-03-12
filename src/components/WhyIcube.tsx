"use client";

import { motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { getIcon } from "../lib/icons";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

export default function WhyIcube() {
  const { whyUs } = useSiteData();

  return (
    <section
      id="why-us"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-gray via-icube-dark/80 to-icube-gray relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent mix-blend-overlay pointer-events-none" />
      <div className="absolute -top-20 right-0 w-72 h-72 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatedSectionHeader className="section-header" amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">The Difference</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title whyus-section-heading">
            <span className="whyus-title-gradient bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
              Why creators choose ICUBE
            </span>
          </h2>
          <div className="section-header-accent" aria-hidden />
        </AnimatedSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {whyUs.map((feature, index) => {
            const Icon = getIcon(feature.icon);
            return (
              <AnimatedStaggerItem key={feature.id} index={index}>
              <div className="card-flip-wrap">
                <motion.div
                  className="card-flip group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-8 md:p-10 text-center transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.08)]"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-icube-gold/0 to-transparent group-hover:via-icube-gold/70 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-b" />
                <div className="w-16 h-16 mx-auto rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 group-hover:border-icube-gold/40 group-hover:bg-icube-gold/10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                  <Icon size={28} className="text-white group-hover:text-icube-gold transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 tracking-tight text-white">{feature.title}</h3>
                <p className="text-gray-400 font-light leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
              </div>
              </AnimatedStaggerItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}
