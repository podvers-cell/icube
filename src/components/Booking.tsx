"use client";

import { useState, type FormEvent } from "react";
import { Calendar, Clock, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { submitBooking } from "../api";

function parseFeatures(s: string): string[] {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [s];
  } catch {
    return [s];
  }
}

export default function Booking() {
  const { packages: pkgs } = useSiteData();
  const [submitted, setSubmitted] = useState(false);
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customForm, setCustomForm] = useState({ first_name: "", last_name: "", email: "", phone: "", project_details: "" });

  function handlePackageSelect() {
    document.getElementById("custom-booking-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    setCustomSubmitting(true);
    try {
      await submitBooking({
        first_name: customForm.first_name,
        last_name: customForm.last_name,
        email: customForm.email,
        phone: customForm.phone || undefined,
        project_details: customForm.project_details || undefined,
      });
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
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Reserve your spot
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Book a studio session
          </h2>
          <div className="section-header-accent" aria-hidden />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pkgs.map((pkg) => {
            const features = parseFeatures(pkg.features);
            const isPopular = pkg.is_popular;
            return (
              <div
                key={pkg.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isPopular
                    ? "border-icube-gold/40 bg-gradient-to-b from-icube-gold/10 to-transparent shadow-[0_0_0_1px_rgba(212,175,55,0.15),0_16px_48px_rgba(0,0,0,0.35)] hover:border-icube-gold/60 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_24px_64px_rgba(0,0,0,0.4),0_0_40px_rgba(212,175,55,0.08)] hover:-translate-y-1"
                    : "border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_20px_52px_rgba(0,0,0,0.35)] hover:-translate-y-0.5"
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-icube-gold text-icube-dark text-[10px] font-bold uppercase tracking-wider py-2.5 pl-4 pr-5 rounded-bl-2xl shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
                    <Sparkles size={12} className="shrink-0" />
                    Most Popular
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  {/* Card header */}
                  <div className="mb-6">
                    <h3 className="text-xl font-display font-semibold tracking-tight text-white pr-24">{pkg.name}</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-display font-bold text-white">{pkg.price_aed}</span>
                      <span className="text-icube-gold font-semibold">AED</span>
                      <span className="text-gray-500 text-sm">/ session</span>
                    </div>
                  </div>

                  {/* Duration pill */}
                  <div className="inline-flex items-center gap-2 text-gray-300 text-sm mb-6 w-fit bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                    <Clock size={16} className="text-icube-gold shrink-0" />
                    <span>{pkg.duration}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3.5 mb-8 flex-1">
                    {features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-gray-300 font-light text-sm leading-relaxed">
                        <CheckCircle2 size={18} className="text-icube-gold shrink-0 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                <button
                  type="button"
                  onClick={() => handlePackageSelect()}
                    className={`mt-auto w-full inline-flex items-center justify-center gap-2 py-4 font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                      isPopular
                        ? "bg-icube-gold text-icube-dark hover:bg-icube-gold-light shadow-[0_4px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_28px_rgba(212,175,55,0.4)]"
                        : "bg-white/10 text-white border border-white/15 hover:bg-white/15 hover:border-icube-gold/40 hover:text-icube-gold/90"
                    }`}
                  >
                    Select Package
                    <ArrowRight size={18} className="shrink-0 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
