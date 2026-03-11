"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBooking } from "@/BookingContext";
import { submitBooking } from "@/api";

function formatTimeSlot(value: string): string {
  const [hStr] = value.split(":");
  const h = parseInt(hStr, 10);
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export default function StudioBookingCheckoutPage() {
  const router = useRouter();
  const {
    selectedStudio,
    selectedDurationHours,
    selectedDate,
    selectedTimeSlot,
    selectedAddOns,
    totalAddonsAmount,
    clearBooking,
  } = useBooking();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", project_details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const durationHours = selectedDurationHours ?? 2;
  useEffect(() => {
    if (!selectedStudio || !selectedDate || !selectedTimeSlot || !selectedDurationHours) {
      router.replace("/#studio");
      return;
    }
  }, [selectedStudio, selectedDate, selectedTimeSlot, selectedDurationHours, router]);

  const studioTotal = selectedStudio ? selectedStudio.price_aed_per_hour * durationHours : 0;
  const totalAmount = studioTotal + totalAddonsAmount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudio || !selectedDate || !selectedTimeSlot || !selectedDurationHours) return;
    setSubmitting(true);
    try {
      await submitBooking({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        project_details: form.project_details || undefined,
        studio_id: selectedStudio.id,
        studio_name: selectedStudio.name,
        booking_duration_hours: durationHours,
        studio_total_aed: studioTotal,
        booking_date: selectedDate,
        time_slot: selectedTimeSlot,
        addon_ids: selectedAddOns.map((a) => a.id),
        addons_total_aed: totalAddonsAmount,
      });
      setSuccess(true);
      clearBooking();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedStudio || !selectedDate || !selectedTimeSlot || !selectedDurationHours) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
        <Navbar />
        <main className="relative py-24 md:py-28 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-lg mx-auto px-5 text-center">
            <div className="w-16 h-16 rounded-full bg-icube-gold/20 border-2 border-icube-gold flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-icube-gold">✓</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-3">We received your booking</h1>
            <p className="text-gray-400 font-light mb-4">
              Thank you for choosing us. We’ve received your request for {selectedStudio.name} on {selectedDate} at {formatTimeSlot(selectedTimeSlot)} for {durationHours} {durationHours === 1 ? "hour" : "hours"}.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              We’ll confirm availability and get back to you shortly.
            </p>
            <Link
              href="/#studio"
              className="inline-flex items-center justify-center py-4 px-8 rounded-xl bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider hover:bg-icube-gold-light transition-colors"
            >
              Back to studios
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 md:px-12">
          <Link
            href="/studio/booking/add-ons"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-8 transition-colors"
          >
            <ChevronLeft size={18} />
            Back to add-ons
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-2">
            Checkout
          </h1>
          <p className="text-gray-400 font-light mb-10">
            Review your studio booking and enter your details to complete the request.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{selectedStudio.name}</span>
                <span className="text-white">{studioTotal} AED ({durationHours}h)</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{selectedDate} · {formatTimeSlot(selectedTimeSlot)} ({durationHours}h)</span>
              </div>
              {selectedAddOns.length > 0 && (
                <>
                  {selectedAddOns.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm text-gray-400">
                      <span>+ {a.name}</span>
                      <span>{a.price_aed} AED</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-medium text-white">
                    <span>Add-ons</span>
                    <span>{totalAddonsAmount} AED</span>
                  </div>
                </>
              )}
              <div className="border-t border-white/10 pt-4 flex justify-between font-display font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-icube-gold">{totalAmount} AED</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  First name
                </label>
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full bg-icube-dark/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30"
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full bg-icube-dark/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-icube-dark/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Phone <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-icube-dark/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30"
                placeholder="+971 50 123 4567"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Project details <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={form.project_details}
                onChange={(e) => setForm((f) => ({ ...f, project_details: e.target.value }))}
                className="w-full bg-icube-dark/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30 resize-none"
                placeholder="Tell us about your project or any special requests..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider hover:bg-icube-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit booking request"
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
