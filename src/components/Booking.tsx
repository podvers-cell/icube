import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { submitBooking } from "../api";
import { viewportTransition, hoverTransition } from "../lib/motion";
import WavySectionDivider from "./WavySectionDivider";

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
  const [customForm, setCustomForm] = useState({ first_name: "", last_name: "", email: "", project_details: "" });

  async function handlePackageSelect(packageId: number) {
    // Optional: open modal or redirect to form with package pre-selected
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
        project_details: customForm.project_details || undefined,
      });
      setSubmitted(true);
      setCustomForm({ first_name: "", last_name: "", email: "", project_details: "" });
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
      <WavySectionDivider />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-icube-gold/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={viewportTransition} className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Reserve your spot
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...viewportTransition, delay: 0.05 }}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight"
          >
            Book a studio session
          </motion.h2>
          <div className="section-header-accent" aria-hidden />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {pkgs.map((pkg, i) => {
            const features = parseFeatures(pkg.features);
            return (
              <div key={pkg.id} className="card-flip-wrap">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...viewportTransition, delay: i * 0.06 }}
                  whileHover={{
                    y: -6,
                    rotateY: 6,
                    rotateX: -3,
                    transition: hoverTransition,
                  }}
                  className={`card-flip relative overflow-hidden rounded-2xl border ${
                    pkg.is_popular ? "border-icube-gold/70 bg-icube-gold/5" : "border-white/10 bg-white/[0.06]"
                  } backdrop-blur-sm p-8 hover:border-icube-gold/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_24px_56px_rgba(0,0,0,0.4)] transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                >
                {pkg.is_popular && (
                  <div className="absolute top-0 right-0 bg-icube-gold text-icube-dark text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-bl-2xl rounded-tr-2xl shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className={pkg.is_popular ? "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-icube-gold/50 via-icube-gold to-icube-gold/50" : ""} />
                <h3 className="text-xl font-display font-semibold mb-2 tracking-tight text-white pt-1">{pkg.name}</h3>
                <div className="flex items-end gap-2 mb-5">
                  <span className="text-3xl md:text-4xl font-display font-bold text-white">{pkg.price_aed} AED</span>
                  <span className="text-gray-500 text-sm mb-1">/ session</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-6 bg-black/30 border border-white/5 p-3 rounded-xl">
                  <Clock size={16} className="text-icube-gold shrink-0" />
                  <span>{pkg.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-gray-300 font-light text-sm">
                      <CheckCircle2 size={18} className="text-icube-gold shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handlePackageSelect(pkg.id)}
                  className={`w-full py-4 font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 ${pkg.is_popular ? "bg-icube-gold text-icube-dark hover:bg-icube-gold-light shadow-[0_4px_20px_rgba(212,175,55,0.3)]" : "bg-white/10 text-white border border-white/10 hover:bg-white/15 hover:border-icube-gold/30"}`}
                >
                  Select Package
                </button>
              </motion.div>
              </div>
            );
          })}
        </div>

        <motion.div
          id="custom-booking-form"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...viewportTransition, delay: 0.1 }}
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
              {submitted && <p className="text-icube-gold text-sm">Request received. We'll contact you shortly.</p>}
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
        </motion.div>
      </div>
    </section>
  );
}
