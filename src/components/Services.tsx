"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useSwipeCarousel } from "../hooks/useSwipeCarousel";
import { getIcon } from "../lib/icons";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

const colors = ["from-red-500/20 to-transparent", "from-orange-500/20 to-transparent", "from-blue-500/20 to-transparent", "from-purple-500/20 to-transparent", "from-emerald-500/20 to-transparent"];

function ServiceCard({
  service,
  colorClass,
}: {
  service: { id: string | number; icon: string; title: string; description: string };
  colorClass: string;
}) {
  const Icon = getIcon(service.icon);
  return (
    <div className="w-[85%] md:w-full mx-auto">
    <motion.div
      className="card-flip glass-card group relative overflow-hidden rounded-2xl p-8 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-icube-gold/0 to-transparent group-hover:via-icube-gold/80 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`} />
      <div className="relative z-10">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner group-hover:border-icube-gold/40 group-hover:bg-icube-gold/10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <Icon size={24} className="text-white group-hover:text-icube-gold transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
        </div>
        <h3 className="text-xl font-display font-semibold mb-3 tracking-tight text-white group-hover:text-icube-gold transition-colors">
          {service.title}
        </h3>
        <p className="text-gray-400 font-light leading-relaxed text-sm mb-6">{service.description}</p>
        <Link href="/contact" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/90 group-hover:text-icube-gold transition-colors border-b border-transparent group-hover:border-icube-gold pb-0.5">
          Learn More <span className="group-hover:translate-x-1 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">→</span>
        </Link>
      </div>
    </motion.div>
    </div>
  );
}

function MobileServicesCarousel({
  services,
}: {
  services: { id: string | number; icon: string; title: string; description: string }[];
}) {
  const len = services.length;
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const displayItems = len ? [...services, ...services] : [];

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
          {displayItems.map((service, i) => (
            <div key={`${String(service.id)}-${i}`} className="w-full shrink-0">
              <ServiceCard service={service} colorClass={colors[i % colors.length]} />
            </div>
          ))}
        </motion.div>
      </div>
      <div className="flex justify-center gap-2 pt-1">
        {services.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (i !== logicalIndex) setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === logicalIndex ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
            }`}
            aria-label={`Go to service ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  const { services } = useSiteData();

  return (
    <section
      id="services"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark via-icube-gray/60 to-icube-dark/80 relative overflow-hidden"
    >
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <AnimatedSectionHeader className="section-header" amount={0.25}>
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Our Expertise</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title services-section-heading">
            <span className="services-title-gradient bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
              Premium production services
            </span>
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4">
            End-to-end media solutions in Dubai for brands and creators across the UAE and beyond.
          </p>
        </AnimatedSectionHeader>

        {/* Mobile carousel with arrows and dots */}
        <div className="md:hidden">
          <MobileServicesCarousel services={services} />
        </div>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-7">
          {services.map((service, index) => {
            return (
              <AnimatedStaggerItem key={service.id} index={index}>
                <div className="card-flip-wrap">
                  <ServiceCard service={service} colorClass={colors[index % colors.length]} />
                </div>
              </AnimatedStaggerItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}
