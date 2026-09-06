"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Camera, PackageX } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnimatedStaggerItem from "../components/AnimatedStaggerItem";
import { AnimatedSectionHeader } from "../components/ScrollReveal";
import { WHATSAPP_URL } from "../constants/whatsapp";
import { rentalAvailabilityLabel, type RentalEquipment } from "../types/rentalEquipment";
import { cloudinaryImage } from "@/lib/cloudinaryImage";

const ALL = "All";

function priceUnitLabel(unit: RentalEquipment["price_unit"]): string {
  if (unit === "day") return "per day";
  if (unit === "week") return "per week";
  if (unit === "session") return "per session";
  return "per project";
}

function availabilityClasses(status: RentalEquipment["availability_status"]): string {
  if (status === "available") return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
  if (status === "unavailable") return "border-red-400/40 bg-red-500/15 text-red-300";
  return "border-icube-gold/40 bg-icube-gold/10 text-icube-gold";
}

function EquipmentCard({ item }: { item: RentalEquipment }) {
  return (
    <motion.article
      className="glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow] duration-300 hover:border-icube-gold/40 hover:shadow-[0_24px_56px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.12)]"
      whileHover={{ y: -6 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
        {item.image_url ? (
          <Image
            src={cloudinaryImage(item.image_url, 700)}
            unoptimized
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20" aria-hidden>
            <Camera size={48} />
          </div>
        )}

        {item.is_featured && (
          <span className="absolute left-3 top-3 rounded-full border border-icube-gold/50 bg-icube-dark/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-icube-gold backdrop-blur">
            Featured
          </span>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur ${availabilityClasses(item.availability_status)}`}
        >
          {rentalAvailabilityLabel(item.availability_status)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-icube-gold">{item.category}</p>
        <h3 className="mb-2 font-display text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-icube-gold">
          {item.name}
        </h3>

        {item.short_description && (
          <p className="mb-4 flex-1 text-sm font-light leading-relaxed text-gray-400">{item.short_description}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <p className="font-display text-xl font-bold text-white">
              AED {item.price_aed.toLocaleString("en-AE")}
            </p>
            <p className="text-xs text-gray-500">{priceUnitLabel(item.price_unit)}</p>
          </div>
          {(item.quantity_available ?? 0) > 0 && (
            <p className="text-xs text-gray-500">{item.quantity_available} available</p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function RentEquipmentPage({ items }: { items: RentalEquipment[] }) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const item of items) {
      const category = item.category.trim();
      if (category && !seen.includes(category)) seen.push(category);
    }
    return seen;
  }, [items]);

  const [active, setActive] = useState<string>(ALL);

  const visible = useMemo(
    () => (active === ALL ? items : items.filter((item) => item.category.trim() === active)),
    [items, active]
  );

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />

      <main id="main-content" className="pt-20 md:pt-24">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <AnimatedSectionHeader className="section-header" amount={0.25}>
            <div className="section-label-row">
              <div className="section-label-line" aria-hidden />
              <span className="section-label">Equipment Rental</span>
              <div className="section-label-line" aria-hidden />
            </div>
            <h1 className="section-title">
              <span className="bg-gradient-to-r from-white via-white to-icube-gold/90 bg-clip-text text-transparent">
                Rent Equipment
              </span>
            </h1>
            <div className="section-header-accent" aria-hidden />
            <p className="mt-4 max-w-2xl font-light text-gray-400">
              Professional cameras, lighting and audio gear available for rent in Dubai — with or without a
              studio booking.
            </p>
          </AnimatedSectionHeader>

          {items.length === 0 ? (
            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-white/10 bg-black/30 p-10 text-center">
              <PackageX size={40} className="mx-auto mb-4 text-white/25" aria-hidden />
              <h2 className="mb-2 font-display text-lg font-semibold text-white">Catalogue coming soon</h2>
              <p className="mb-6 text-sm text-gray-400">
                Our rental list is being finalised. Tell us what you need and we will confirm availability.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-icube-gold px-5 py-2.5 text-sm font-semibold text-icube-dark transition-colors hover:bg-icube-gold-light"
              >
                Ask about equipment
              </Link>
            </div>
          ) : (
            <>
              {categories.length > 1 && (
                <div className="mt-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by category">
                  {[ALL, ...categories].map((category) => {
                    const selected = active === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActive(category)}
                        aria-pressed={selected}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                          selected
                            ? "border-icube-gold bg-icube-gold text-icube-dark"
                            : "border-white/15 text-gray-300 hover:border-icube-gold/50 hover:text-icube-gold"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-6 text-center text-xs text-gray-500" aria-live="polite">
                {visible.length} {visible.length === 1 ? "item" : "items"}
                {active !== ALL ? ` in ${active}` : ""}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((item, index) => (
                  <AnimatedStaggerItem key={item.id} index={index}>
                    <EquipmentCard item={item} />
                  </AnimatedStaggerItem>
                ))}
              </div>

              <div className="mt-16 rounded-2xl border border-white/10 bg-black/30 p-8 text-center md:p-10">
                <h2 className="mb-3 font-display text-xl font-bold text-white md:text-2xl">
                  Need a custom rental package?
                </h2>
                <p className="mx-auto mb-6 max-w-xl text-sm font-light leading-relaxed text-gray-400">
                  Tell us your shoot dates and gear list and we will put together a quote, with or without a studio.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center rounded-md bg-icube-gold px-6 py-3 text-sm font-semibold text-icube-dark transition-colors hover:bg-icube-gold-light sm:w-auto"
                  >
                    Request a quote
                  </Link>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-md border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-icube-gold/50 hover:text-icube-gold sm:w-auto"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
