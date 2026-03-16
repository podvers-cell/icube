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

        {/* Pricing cards – glass style, MOST POPULAR glow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {[...pkgs]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((pkg, index) => {
              const features = parseFeatures(pkg.features);
              const isPopular = !!pkg.is_popular;
              const isPremiumCard = index === 2;
              const subtitle = pkg.description?.trim() || pkg.best_for_label?.trim() || null;
              return (
                <div
                  key={pkg.id}
                  className={`package-card group/card relative flex flex-col rounded-2xl border transition-all duration-300 ease-out ${
                    isPremiumCard
                      ? "glass-card bg-white/[0.08] border-icube-gold/30 shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_0_24px_rgba(212,175,55,0.12)]"
                      : isPopular
                        ? "glass-card bg-white/[0.08] border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_0_24px_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.3)]"
                        : "glass-card bg-white/[0.05] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:border-white/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
                  }`}
                >
                  {isPremiumCard && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center bg-icube-gold text-icube-dark text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] z-10">
                      Premium
                    </div>
                  )}
                  {!isPremiumCard && isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center bg-white text-icube-dark text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.25)] z-10">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-5">
                      <h3 className="text-xl font-display font-bold tracking-tight text-white">
                        {pkg.name}
                      </h3>
                      {subtitle && (
                        <p className="mt-2 text-sm leading-relaxed text-gray-400">
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {pkg.price_before_aed != null && pkg.price_before_aed > 0 && (
                        <span className="flex items-baseline text-gray-400 text-base line-through">
                          <img
                            src="/aed-symbol.svg"
                            alt="AED"
                          className="mr-1 h-3 w-auto inline-block align-baseline invert"
                          />
                          {pkg.price_before_aed.toLocaleString()}
                        </span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <img
                          src="/aed-symbol.svg"
                          alt="AED"
                          className="h-6 w-auto inline-block align-baseline invert"
                        />
                        <span className="text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                          {pkg.price_aed > 0 ? pkg.price_aed.toLocaleString() : (pkg.price_after?.trim() || "—")}
                        </span>
                      </div>
                      <span className="text-base md:text-lg text-gray-400">
                        {pkg.price_aed > 0 ? (pkg.price_after?.trim() || "/ session").replace(/^\s*\/?/, "").trim() : ""}
                      </span>
                    </div>

                    {/* Features – all checkmarks glow when hovering anywhere on card */}
                    <ul className="mt-2 pt-6 space-y-3.5 border-t border-white/10 flex-1">
                      {features.map((feature, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-3 text-sm leading-relaxed cursor-default"
                        >
                          <span className="package-feature-check shrink-0 mt-0.5 inline-flex">
                            <CheckCircle2
                              size={20}
                              className="text-white/90"
                            />
                          </span>
                          <span className="text-gray-300 group-hover/card:text-white/90 transition-colors duration-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA – white + glow, hover: gold + glow */}
                    <button
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
                      className="mt-6 w-full py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 bg-white text-icube-dark shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:bg-icube-gold hover:text-icube-dark hover:shadow-[0_0_24px_rgba(212,175,55,0.5)]"
                    >
                      Choose package
                    </button>
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
