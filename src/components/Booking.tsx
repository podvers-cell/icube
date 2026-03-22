"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2, Medal } from "lucide-react";
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

  /** Explicit premium from dashboard; if none set anywhere, keep legacy: 3rd sorted package. */
  const anyPremiumMarked = useMemo(() => sortedPkgs.some((p) => !!p.is_premium), [sortedPkgs]);
  const fallbackPremiumPkgId = useMemo(
    () => (anyPremiumMarked ? null : sortedPkgs[2]?.id ?? null),
    [anyPremiumMarked, sortedPkgs]
  );

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {visiblePkgs.map((pkg) => {
              const features = parseFeatures(pkg.features);
              const isPopular = !!pkg.is_popular;
              const isPremiumCard =
                !!pkg.is_premium || (fallbackPremiumPkgId != null && pkg.id === fallbackPremiumPkgId);
              const variant: "starter" | "pro" | "premium" = isPremiumCard ? "premium" : isPopular ? "pro" : "starter";
              const aedIconClass = variant === "premium" ? "invert" : "";
              const cardTitleClass = variant === "starter" ? "text-[#171717]" : variant === "pro" ? "text-[#111111]" : "text-[#FFFFFF]";
              const subtitleClass = variant === "premium" ? "text-gray-300" : "text-gray-600";
              const priceColorClass = variant === "starter" ? "text-[#B8945B]" : variant === "pro" ? "text-[#A97B3D]" : "text-[#E5C88E]";
              const priceAfterClass = variant === "premium" ? "text-gray-400" : "text-[#171717]/60";
              const dividerClass = variant === "premium" ? "border-[#D2B076]/25" : "border-[#171717]/10";
              const checkIconClass = variant === "premium" ? "text-white" : "text-[#171717]/70";
              const featureBaseClass = variant === "premium" ? "text-white" : "text-[#171717]/70";
              const featureHoverClass = variant === "premium" ? "group-hover/card:text-white" : "group-hover/card:text-[#111111]";
              const beforePriceClass = variant === "premium" ? "text-gray-500" : "text-[#171717]/40";
              const badgeProClass = "bg-[#F6EBD8] text-[#7B5A2A] shadow-[0_0_20px_rgba(246,235,216,0.35)]";
              const categoryTextClass = variant === "premium" ? "text-white/90 tracking-[0.22em]" : "text-[#111111]/60";
              const ctaClass =
                variant === "starter"
                  ? "bg-[#171717] text-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF]"
                  : variant === "pro"
                    ? "bg-[#C9A46A] text-[#111111] hover:bg-[#A97B3D] hover:text-[#111111]"
                    : "bg-[#D2B076] text-[#111111] font-bold hover:bg-[#E5C88E] hover:text-[#0a0a0a] shadow-[0_0_28px_rgba(210,176,118,0.45)]";
              const cardBg = variant === "starter" ? "#FAF7F2" : variant === "pro" ? "#FFFFFF" : "#0a0a0a";
              const cardBorder = variant === "starter" ? "#E7DED1" : variant === "pro" ? "#C9A46A" : "#D2B076";
              const subtitle = pkg.description?.trim() || pkg.best_for_label?.trim() || null;
              /** Gold-tinted AED symbol on black premium card (SVG is black fill). */
              const premiumAedStyle = isPremiumCard
                ? {
                    filter:
                      "brightness(0) saturate(100%) invert(79%) sepia(28%) saturate(520%) hue-rotate(358deg) brightness(1.02) contrast(92%)",
                  }
                : undefined;
              return (
                <div
                  key={pkg.id}
                  className={`package-card group/card relative flex h-full min-h-0 flex-col rounded-2xl border transition-all duration-300 ease-out ${
                    isPremiumCard
                      ? "border-[#D2B076] shadow-[0_0_0_1px_rgba(210,176,118,0.55),0_0_32px_rgba(210,176,118,0.22),0_12px_48px_rgba(0,0,0,0.55)] hover:shadow-[0_0_0_1px_rgba(210,176,118,0.75),0_0_44px_rgba(210,176,118,0.32),0_20px_64px_rgba(0,0,0,0.6)]"
                      : isPopular
                        ? "bg-[#FFFFFF] border-[#C9A46A] shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
                        : "bg-[#FAF7F2] border-[#E7DED1] shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                  }`}
                  style={
                    isPremiumCard
                      ? { backgroundColor: "#0a0a0a", borderColor: "#D2B076" }
                      : { backgroundColor: cardBg, borderColor: cardBorder }
                  }
                >
                  {isPremiumCard && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center rounded-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#111111] shadow-[0_0_28px_rgba(210,176,118,0.55),0_4px_14px_rgba(0,0,0,0.35)]"
                      style={{ backgroundColor: "#D2B076" }}
                    >
                      PREMIUM
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

                  <div className="flex min-h-0 flex-1 flex-col p-8">
                    <div className="mb-4">
                      <div className={`text-xs uppercase tracking-widest font-semibold ${categoryTextClass}`}>
                        {formatCategoryLabel(normalizeCategory(pkg.category))}
                      </div>
                    </div>
                    <div className="mb-5">
                      <h3
                        className={`text-xl font-display font-bold tracking-tight flex items-center gap-2.5 ${cardTitleClass}`}
                      >
                        {isPremiumCard && (
                          <Medal
                            className="shrink-0 text-[#E5C88E]"
                            size={22}
                            strokeWidth={1.65}
                            aria-hidden
                          />
                        )}
                        <span>{pkg.name}</span>
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
                            className={`mr-1 h-3 w-auto inline-block align-baseline ${isPremiumCard ? "" : aedIconClass}`}
                            style={premiumAedStyle}
                          />
                          {pkg.price_before_aed.toLocaleString()}
                        </span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <img
                          src="/aed-symbol.svg"
                          alt="AED"
                          className={`h-6 w-auto inline-block align-baseline ${isPremiumCard ? "" : aedIconClass}`}
                          style={premiumAedStyle}
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
                    <ul className={`mt-2 min-h-0 flex-1 space-y-3.5 border-t pt-6 ${dividerClass}`}>
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
                      className={`mt-6 w-full shrink-0 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-[0.2em] transition-all duration-300 ${
                        isPremiumCard ? ctaClass : `${ctaClass} shadow-[0_0_20px_rgba(0,0,0,0.12)]`
                      }`}
                    >
                      {isPremiumCard ? "BOOK NOW" : "Book now"}
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
