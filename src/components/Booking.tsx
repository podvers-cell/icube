"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2 } from "lucide-react";
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
    router.push("/packages/checkout");
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
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/80 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-icube-gold/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="section-header">
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Reserve your spot</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title">Book a studio session</h2>
          <div className="section-header-accent" aria-hidden />
        </div>

        {/* Pricing cards – reference layout, brand colors, no icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {[...pkgs]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((pkg, index) => {
              const features = parseFeatures(pkg.features);
              const isPopular = pkg.is_popular;
              const isMostPopularCard = index === 1;
              const isPremiumCard = index === 2;
              const subtitle = pkg.description?.trim() || pkg.best_for_label?.trim() || null;
              return (
                <div
                  key={pkg.id}
                  className={`group relative flex flex-col rounded-2xl border transition-shadow duration-300 ease-out ${
                    isPremiumCard
                      ? "bg-gradient-to-b from-icube-gold/15 to-icube-gold/5 border-icube-gold/60 shadow-[0_0_0_1px_rgba(212,175,55,0.3),0_16px_48px_rgba(0,0,0,0.4),0_0_60px_rgba(212,175,55,0.12)] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.4),0_20px_56px_rgba(0,0,0,0.45),0_0_80px_rgba(212,175,55,0.15)] hover:border-icube-gold/80"
                      : isMostPopularCard
                        ? "bg-white/12 border-icube-gold/45 shadow-[0_0_0_2px_rgba(212,175,55,0.2),0_14px_44px_rgba(0,0,0,0.38)] hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3),0_18px_52px_rgba(0,0,0,0.42)] ring-2 ring-icube-gold/20 hover:ring-icube-gold/30"
                        : isPopular
                          ? "bg-white/10 border-icube-gold/50 shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212,175,55,0.25)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(212,175,55,0.35)]"
                          : "bg-white/[0.06] border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] hover:border-white/25 hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
                  }`}
                >
                  {isPremiumCard && (
                    <div className="absolute top-0 right-0 flex items-center justify-center bg-icube-gold/95 text-icube-dark text-[11px] font-semibold uppercase tracking-[0.2em] py-2 px-5 rounded-bl-xl rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                      Premium
                    </div>
                  )}
                  {isMostPopularCard && (
                    <div className="absolute top-0 right-0 flex items-center justify-center bg-icube-gold/95 text-icube-dark text-[11px] font-semibold uppercase tracking-[0.2em] py-2 px-5 rounded-bl-xl rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                      Most Popular
                    </div>
                  )}
                  {isPopular && !isPremiumCard && !isMostPopularCard ? (
                    <div className="absolute top-0 right-0 flex items-center justify-center bg-icube-gold/95 text-icube-dark text-[11px] font-semibold uppercase tracking-[0.2em] py-2 px-4 rounded-bl-xl rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                      Most Popular
                    </div>
                  ) : null}

                  <div className="p-8 flex flex-col">
                    {/* Header: title + subtitle */}
                    <div className="mb-5">
                      <h3 className={`text-2xl font-display font-bold tracking-tight pr-20 ${isPremiumCard ? "text-white drop-shadow-sm" : "text-white"}`}>
                        {pkg.name}
                      </h3>
                      {subtitle && (
                        <p className={`mt-2 text-sm leading-relaxed max-w-sm ${isPremiumCard ? "text-icube-gold/90" : isMostPopularCard ? "text-gray-300" : "text-gray-400"}`}>
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {pkg.price_before_aed != null && pkg.price_before_aed > 0 && (
                        <span className="text-gray-500 text-sm line-through">{pkg.price_before_aed} AED</span>
                      )}
                      <span className="inline-flex items-baseline gap-1.5">
                        <span className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                          {pkg.price_aed > 0 ? pkg.price_aed : (pkg.price_after?.trim() || "—")}
                        </span>
                        <span className={`text-sm font-medium uppercase tracking-wider ${isPremiumCard ? "text-icube-gold" : isMostPopularCard ? "text-icube-gold" : "text-icube-gold/90"}`}>
                          AED
                        </span>
                      </span>
                      {pkg.price_aed > 0 && (
                        <span className="text-gray-500 text-sm">{pkg.price_after?.trim() || "/ session"}</span>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
                      className={`w-full py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 ${
                        isPremiumCard
                          ? "bg-icube-gold text-icube-dark hover:bg-icube-gold-light shadow-[0_4px_24px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_32px_rgba(212,175,55,0.5)]"
                          : isMostPopularCard
                            ? "bg-icube-dark text-white hover:bg-icube-dark/90 shadow-lg hover:shadow-xl ring-2 ring-icube-gold/40 hover:ring-icube-gold/60"
                            : isPopular
                              ? "bg-icube-dark text-white hover:bg-icube-dark/90 shadow-lg hover:shadow-xl"
                              : "bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-icube-gold/40 hover:text-icube-gold/90"
                      }`}
                    >
                      Select this package
                    </button>

                    {/* Features */}
                    <ul className={`mt-6 pt-6 space-y-3.5 ${isPremiumCard ? "border-t border-icube-gold/30" : isMostPopularCard ? "border-t border-icube-gold/20" : "border-t border-white/10"}`}>
                      {features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm leading-relaxed">
                          <CheckCircle2 size={18} className="text-icube-gold shrink-0 mt-0.5 flex-shrink-0" />
                          <span className={isPremiumCard ? "text-gray-300" : isMostPopularCard ? "text-gray-300" : "text-gray-400"}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Prices in AED. Contact us for custom or multi-session quotes.
        </p>

        <div
          id="custom-booking-form"
          className="mt-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-8 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
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
