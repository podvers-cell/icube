"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { submitBooking, sendBookingConfirmationEmail } from "../api";
import { useBooking } from "@/BookingContext";

function parseFeatures(s: string): string[] {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [s];
  } catch {
    return [s];
  }
}

/** Parse first number from after-price string (e.g. "399" or "399 / session") for checkout when price_aed is 0. */
function parsePriceFromAfter(priceAfter: string | undefined): number {
  if (!priceAfter?.trim()) return 0;
  const match = priceAfter.trim().match(/^\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function normalizeCategory(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v) return "uncategorized";
  return v.toLowerCase().replace(/[_\s]+/g, "-").replace(/-+/g, "-");
}

function formatCategoryLabel(slug: string): string {
  const normalized = normalizeCategory(slug);
  if (normalized === "uncategorized") return "Uncategorized";
  const withoutPackagesSuffix = normalized.endsWith("-packages") ? normalized.slice(0, -"-packages".length) : normalized;
  return withoutPackagesSuffix
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function Booking() {
  const router = useRouter();
  const { packages: pkgs } = useSiteData();
  const {
    setSelectedPackage,
    setSelectedStudio,
    setSelectedDurationHours,
    setSelectedDate,
    setSelectedTimeSlot,
    setSelectedAddOns,
  } = useBooking();
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!queryCategory) {
      setActiveCategory("all");
      return;
    }
    setActiveCategory(normalizeCategory(queryCategory));
  }, [queryCategory]);

  const sortedPkgs = useMemo(() => {
    return [...pkgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [pkgs]);

  const CATEGORY_ORDER = useMemo(
    () => [
      "social-media-packages",
      "studio-rental-packages",
      "corporate-packages",
      "podcast-packages",
      "video-production-packages",
      "photography-packages",
      "uncategorized",
    ],
    []
  );

  const visibleCategories = useMemo(() => {
    const unique = new Set<string>();
    for (const p of sortedPkgs) unique.add(normalizeCategory(p.category));
    const ordered = CATEGORY_ORDER.filter((x) => unique.has(x));
    const rest = Array.from(unique).filter((x) => !CATEGORY_ORDER.includes(x)).sort();
    return ["all", ...ordered, ...rest];
  }, [CATEGORY_ORDER, sortedPkgs]);

  const visiblePkgs = useMemo(() => {
    if (activeCategory === "all") return sortedPkgs;
    return sortedPkgs.filter((p) => normalizeCategory(p.category) === activeCategory);
  }, [activeCategory, sortedPkgs]);

  // Keep the existing "premium badge" feel stable across categories.
  const premiumPkgId = sortedPkgs[2]?.id ?? null;

  function handleCategoryTabClick(nextCategory: string) {
    setActiveCategory(nextCategory);
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory === "all") params.delete("category");
    else params.set("category", nextCategory);
    const q = params.toString();
    router.replace(`/packages${q ? `?${q}` : ""}`);
  }

  const [submitted, setSubmitted] = useState(false);
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customForm, setCustomForm] = useState({ first_name: "", last_name: "", email: "", phone: "", project_details: "" });

  function handlePackageSelect(pkg: (typeof pkgs)[number]) {
    // Use price_aed when set; else parse from price_after so checkout shows correct total (dashboard may not have main price field)
    const priceForCheckout = pkg.price_aed > 0 ? pkg.price_aed : parsePriceFromAfter(pkg.price_after);
    setSelectedStudio(null);
    setSelectedDurationHours(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedAddOns([]);
    setSelectedPackage({
      id: String(pkg.id),
      name: pkg.name,
      price_aed: priceForCheckout,
      duration: pkg.duration,
    });
    router.push("/packages/date-time");
  }

  async function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    setCustomSubmitting(true);
    try {
      const payload = {
        first_name: customForm.first_name,
        last_name: customForm.last_name,
        email: customForm.email,
        phone: customForm.phone || undefined,
        project_details: customForm.project_details || undefined,
      };
      await submitBooking(payload);
      try {
        await sendBookingConfirmationEmail(payload);
      } catch {
        // Booking saved; email is best-effort
      }
      setSubmitted(true);
      setCustomForm({ first_name: "", last_name: "", email: "", phone: "", project_details: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit. Try again.");
    } finally {
      setCustomSubmitting(false);
    }
  }

  return (
    <section
      id="booking"
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Packages header – centered, like reference */}
        <header className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight">
            Packages
          </h1>
          <p className="mt-4 text-gray-400 font-light text-base md:text-lg max-w-2xl mx-auto">
            Transparent pricing for consistent content. Choose a plan or book a custom package tailored to your brand.
          </p>
        </header>

        {/* Category tabs */}
        {visibleCategories.length > 1 && (
          <div className="mb-10 md:mb-12">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-5xl overflow-x-auto">
                <div className="flex items-center gap-2 px-2 pb-2">
                  {visibleCategories.map((cat) => {
                    const isActive = activeCategory === cat;
                    const label = cat === "all" ? "All" : formatCategoryLabel(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryTabClick(cat)}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wider transition-all duration-200 ${
                          isActive
                            ? "bg-white text-icube-dark"
                            : "bg-transparent border border-white/30 text-white hover:border-white/50 hover:bg-white/5"
                        }`}
                        aria-pressed={isActive}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing cards – glass style, MOST POPULAR glow */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {visiblePkgs.length === 0 ? (
              <div className="py-16 text-center text-gray-400">No packages found in this category.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {visiblePkgs.map((pkg) => {
              const features = parseFeatures(pkg.features);
              const isPopular = !!pkg.is_popular;
              const isPremiumCard = pkg.id === premiumPkgId;
              const variant: "starter" | "pro" | "premium" = isPremiumCard ? "premium" : isPopular ? "pro" : "starter";
              const aedIconClass = variant === "premium" ? "invert" : "";
              const cardTitleClass = variant === "starter" ? "text-[#171717]" : variant === "pro" ? "text-[#111111]" : "text-[#FFFFFF]";
              const subtitleClass = variant === "premium" ? "text-gray-400" : "text-gray-600";
              const priceColorClass = variant === "starter" ? "text-[#B8945B]" : variant === "pro" ? "text-[#A97B3D]" : "text-[#E5C88E]";
              const priceAfterClass = variant === "premium" ? "text-gray-400" : "text-[#171717]/60";
              const dividerClass = variant === "premium" ? "border-white/10" : "border-[#171717]/10";
              const checkIconClass = variant === "premium" ? "text-white/90" : "text-[#171717]/70";
              const featureBaseClass = variant === "premium" ? "text-gray-300" : "text-[#171717]/70";
              const featureHoverClass = variant === "premium" ? "group-hover/card:text-white/90" : "group-hover/card:text-[#111111]";
              const beforePriceClass = variant === "premium" ? "text-gray-400" : "text-[#171717]/40";
              const badgePremiumClass = "bg-[#D2B076] text-[#111111] shadow-[0_0_20px_rgba(210,176,118,0.35)]";
              const badgeProClass = "bg-[#F6EBD8] text-[#7B5A2A] shadow-[0_0_20px_rgba(246,235,216,0.35)]";
              const categoryTextClass = variant === "premium" ? "text-white/70" : "text-[#111111]/60";
              const ctaClass =
                variant === "starter"
                  ? "bg-[#171717] text-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF]"
                  : variant === "pro"
                    ? "bg-[#C9A46A] text-[#111111] hover:bg-[#A97B3D] hover:text-[#111111]"
                    : "bg-[#D2B076] text-[#111111] hover:bg-[#D2B076]/90 hover:text-[#111111]";
              const cardBg = variant === "starter" ? "#FAF7F2" : variant === "pro" ? "#FFFFFF" : "#151515";
              const cardBorder = variant === "starter" ? "#E7DED1" : variant === "pro" ? "#C9A46A" : "#D2B076";
              const subtitle = pkg.description?.trim() || pkg.best_for_label?.trim() || null;
              return (
                <div
                  key={pkg.id}
                  className={`package-card group/card relative flex flex-col rounded-2xl border transition-all duration-300 ease-out ${
                    isPremiumCard
                      ? "bg-[#151515] border-[#D2B076] shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
                      : isPopular
                        ? "bg-[#FFFFFF] border-[#C9A46A] shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
                        : "bg-[#FAF7F2] border-[#E7DED1] shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                  }`}
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                >
                  {isPremiumCard && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center bg-icube-gold text-icube-dark text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] z-10"
                      style={{ backgroundColor: "#D2B076", color: "#111111" }}
                    >
                      Premium
                    </div>
                  )}
                  {!isPremiumCard && isPopular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center bg-white text-icube-dark text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.25)] z-10"
                      style={{ backgroundColor: "#F6EBD8", color: "#7B5A2A" }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-4">
                      <div className={`text-xs uppercase tracking-widest font-semibold ${categoryTextClass}`}>
                        {formatCategoryLabel(normalizeCategory(pkg.category))}
                      </div>
                    </div>
                    <div className="mb-5">
                      <h3 className={`text-xl font-display font-bold tracking-tight ${cardTitleClass}`}>
                        {pkg.name}
                      </h3>
                      {subtitle && (
                        <p className={`mt-2 text-sm leading-relaxed ${subtitleClass}`}>
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {pkg.price_before_aed != null && pkg.price_before_aed > 0 && (
                        <span className={`flex items-baseline ${beforePriceClass} text-base line-through`}>
                          <img
                            src="/aed-symbol.svg"
                            alt="AED"
                          className={`mr-1 h-3 w-auto inline-block align-baseline ${aedIconClass}`}
                          />
                          {pkg.price_before_aed.toLocaleString()}
                        </span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <img
                          src="/aed-symbol.svg"
                          alt="AED"
                          className={`h-6 w-auto inline-block align-baseline ${aedIconClass}`}
                        />
                        <span className={`text-4xl md:text-5xl font-display font-extrabold tracking-tight ${priceColorClass}`}>
                          {pkg.price_aed > 0 ? pkg.price_aed.toLocaleString() : (pkg.price_after?.trim() || "—")}
                        </span>
                      </div>
                      <span className={`text-base md:text-lg ${priceAfterClass}`}>
                        {pkg.price_aed > 0 ? (pkg.price_after?.trim() || "/ session").replace(/^\s*\/?/, "").trim() : ""}
                      </span>
                    </div>

                    {/* Features – all checkmarks glow when hovering anywhere on card */}
                    <ul className={`mt-2 pt-6 space-y-3.5 border-t ${dividerClass} flex-1`}>
                      {features.map((feature, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-3 text-sm leading-relaxed cursor-default"
                        >
                          <span className="package-feature-check shrink-0 mt-0.5 inline-flex">
                            <CheckCircle2
                              size={20}
                              className={checkIconClass}
                            />
                          </span>
                          <span className={`${featureBaseClass} ${featureHoverClass} transition-colors duration-300`}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA – white + glow, hover: gold + glow */}
                    <button
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
                      className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 ${ctaClass} shadow-[0_0_20px_rgba(0,0,0,0.12)]`}
                    >
                      Book now
                    </button>
                  </div>
                </div>
              );
            })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Prices in AED. Contact us for custom or multi-session quotes.
        </p>

        <div
          id="custom-booking-form"
          className="glass-card mt-20 overflow-hidden rounded-2xl p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-display font-bold mb-4">Need a custom setup?</h3>
              <p className="text-gray-400 font-light mb-8">
                Tell us about your project in Dubai or across the UAE, and we'll build a custom production package for you.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <Calendar size={20} className="text-icube-gold" />
                <span>Check availability</span>
              </div>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              {submitted && (
                <p className="text-icube-gold text-sm">
                  Booking made successfully. Thank you for choosing us — we'll contact you shortly.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={customForm.first_name}
                  onChange={(e) => setCustomForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white placeholder:text-gray-600"
                />
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={customForm.last_name}
                  onChange={(e) => setCustomForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white placeholder:text-gray-600"
                />
              </div>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={customForm.email}
                onChange={(e) => setCustomForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-black/50 border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white placeholder:text-gray-600"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={customForm.phone}
                onChange={(e) => setCustomForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-black/50 border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white placeholder:text-gray-600"
              />
              <textarea
                placeholder="Project Details"
                rows={4}
                value={customForm.project_details}
                onChange={(e) => setCustomForm((f) => ({ ...f, project_details: e.target.value }))}
                className="w-full bg-black/50 border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white placeholder:text-gray-600 resize-none"
              />
              <button
                type="submit"
                disabled={customSubmitting}
                className="w-full py-4 bg-white text-black font-semibold uppercase tracking-wider rounded-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {customSubmitting ? "Sending…" : "Request Custom Quote"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
