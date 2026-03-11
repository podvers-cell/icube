"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { getIcon } from "../lib/icons";
import AnimatedStaggerItem from "./AnimatedStaggerItem";

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
    <div className="card-flip group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-8 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-icube-gold/50 hover:shadow-[0_24px_56px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212,175,55,0.1)]">
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
    </div>
  );
}

function MobileServicesCarousel({
  services,
}: {
  services: { id: string | number; icon: string; title: string; description: string }[];
}) {
  const [index, setIndex] = useState(0);
  if (!services.length) return null;

  const goPrev = () => setIndex((i) => (i - 1 + services.length) % services.length);
  const goNext = () => setIndex((i) => (i + 1) % services.length);

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
          {index + 1} / {services.length}
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
          {services.map((service, i) => (
            <div key={service.id} className="w-full shrink-0">
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
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index ? "bg-icube-gold w-4" : "bg-white/20 w-1.5"
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
        <div className="mb-16 flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Our Expertise
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Premium production services
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4">
            End-to-end media solutions in Dubai for brands and creators across the UAE and beyond.
          </p>
        </div>

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
