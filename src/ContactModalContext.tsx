"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useSiteData } from "./SiteDataContext";
import { submitContact } from "./api";
import type { FormEvent } from "react";

const AREAS_OF_INTEREST = [
  "Studio Booking",
  "Video Production",
  "Podcast Production",
  "Branded Content",
  "Social Media",
  "Photography",
  "Commercial / TVC",
  "Post-Production & Editing",
  "General Inquiry",
];

const COUNTRY_OPTIONS = [
  { value: "+971", label: "United Arab Emirates (الإمارات)" },
  { value: "+966", label: "Saudi Arabia (السعودية)" },
  { value: "+965", label: "Kuwait (الكويت)" },
  { value: "+973", label: "Bahrain (البحرين)" },
  { value: "+974", label: "Qatar (قطر)" },
  { value: "+968", label: "Oman (عُمان)" },
  { value: "+20", label: "Egypt (مصر)" },
  { value: "+44", label: "United Kingdom" },
  { value: "+1", label: "USA / Canada" },
  { value: "other", label: "Other" },
];

type ContactModalContextValue = {
  openContact: () => void;
  closeContact: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export function useContactModal() {
  const ctx = useContext(ContactModalContext);
  if (!ctx) return { openContact: () => {}, closeContact: () => {} };
  return ctx;
}

function ContactModalInner() {
  const { closeContact } = useContactModal();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company_name: "",
    country: "",
    phone: "",
    area_of_interest: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [areaError, setAreaError] = useState(false);

  const showAreaError = areaError && !form.area_of_interest;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.area_of_interest) {
      setAreaError(true);
      return;
    }
    setAreaError(false);
    setSending(true);
    try {
      const message = [
        form.company_name && `Company: ${form.company_name}`,
        form.country && `Country/Code: ${form.country}`,
        form.phone && `Phone: ${form.phone}`,
        form.area_of_interest && `Area of interest: ${form.area_of_interest}`,
      ]
        .filter(Boolean)
        .join("\n");
      await submitContact({
        name: [form.first_name, form.last_name].filter(Boolean).join(" ") || "—",
        email: form.email,
        subject: form.area_of_interest,
        message: message || "No additional details.",
      });
      setSubmitted(true);
      setForm({ first_name: "", last_name: "", email: "", company_name: "", country: "", phone: "", area_of_interest: "" });
      setAreaError(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-icube-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10">
        <h2 className="text-xl font-display font-bold text-white">Request a quotation</h2>
        <button
          type="button"
          onClick={closeContact}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <div className="p-5 md:p-6">
        {submitted ? (
          <p className="text-icube-gold text-center py-6">Thank you. We&apos;ll get back to you shortly.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row: First Name | Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="First Name"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full bg-white text-icube-dark placeholder-gray-500 border-0 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold"
              />
              <input
                type="text"
                required
                placeholder="Last Name"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full bg-white text-icube-dark placeholder-gray-500 border-0 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold"
              />
            </div>

            {/* Row: Email | Company Name */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-white text-icube-dark placeholder-gray-500 border-0 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-white text-icube-dark placeholder-gray-500 border-0 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold"
              />
            </div>

            {/* Row: Country + Phone */}
            <div className="grid grid-cols-[minmax(120px,140px),1fr] gap-3">
              <select
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full bg-white text-icube-dark rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23191e2e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
              >
                <option value="">Country</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full min-w-0 bg-white text-icube-dark placeholder-gray-500 border-0 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold"
              />
            </div>

            {/* Select area of interest */}
            <div>
              <select
                value={form.area_of_interest}
                onChange={(e) => {
                  setForm((f) => ({ ...f, area_of_interest: e.target.value }));
                  setAreaError(false);
                }}
                className={`w-full bg-white text-icube-dark rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-icube-gold appearance-none cursor-pointer ${!form.area_of_interest ? "text-gray-500" : ""}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23191e2e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
              >
                <option value="">Select area of interest</option>
                {AREAS_OF_INTEREST.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {showAreaError && (
                <p className="text-red-400 text-xs mt-1.5">Please complete this required field.</p>
              )}
            </div>

            {/* Privacy */}
            <p className="text-gray-400 text-xs leading-relaxed">
              We&apos;re committed to your privacy. ICUBE uses the information you provide to contact you about our relevant content, products, and services. You may unsubscribe at any time. For more information, see our{" "}
              <Link href="/#contact" onClick={closeContact} className="text-icube-gold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider rounded-xl hover:bg-icube-gold-light transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-icube-gold focus:ring-offset-2 focus:ring-offset-icube-dark"
            >
              {sending ? "Sending…" : "Send Enquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value: ContactModalContextValue = {
    openContact: () => setIsOpen(true),
    closeContact: () => setIsOpen(false),
  };

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ContactModalInner />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ContactModalContext.Provider>
  );
}
