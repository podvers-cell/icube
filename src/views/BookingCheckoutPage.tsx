"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingProgress from "@/components/BookingProgress";
import { useBooking } from "@/BookingContext";
import { submitBooking, sendBookingConfirmationEmail, validateDiscountCodeOnServer } from "@/api";

export default function BookingCheckoutPage() {
  const router = useRouter();
  const {
    selectedPackage,
    selectedStudio,
    selectedDate,
    selectedTimeSlot,
    selectedAddOns,
    totalAddonsAmount,
    clearBooking,
  } = useBooking();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", project_details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successSummary, setSuccessSummary] = useState<{
    packageName: string;
    bookingDate?: string;
    timeSlot?: string;
  } | null>(null);

  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    if (success) return;
    if (!selectedPackage) {
      router.replace("/packages");
      return;
    }
  }, [selectedPackage, router, success]);

  const subtotal = selectedPackage ? selectedPackage.price_aed + totalAddonsAmount : 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const totalAmount = subtotal - discountAmount;
  const isDirectCheckout = !selectedDate && !selectedTimeSlot;

  async function applyDiscountCode() {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountPercent(0);
      setDiscountError(null);
      return;
    }
    try {
      const res = await validateDiscountCodeOnServer(code);
      if (!res) {
        setDiscountPercent(0);
        setDiscountError("Discount code is invalid or expired.");
        return;
      }
      setDiscountPercent(res.percent);
      setDiscountError(null);
    } catch {
      setDiscountPercent(0);
      setDiscountError("Discount code is invalid or expired.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedPackage) return;
    setSubmitting(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        project_details: form.project_details || undefined,
        package_id: selectedPackage.id,
        studio_id: selectedStudio?.id,
        studio_name: selectedStudio?.name,
        ...(selectedDate && { booking_date: selectedDate }),
        ...(selectedTimeSlot && { time_slot: selectedTimeSlot }),
        ...(selectedAddOns.length > 0 && { addon_ids: selectedAddOns.map((a) => a.id), addons_total_aed: totalAddonsAmount }),
        ...(discountPercent > 0 && { discount_code: discountCode.trim().toUpperCase(), discount_percent: discountPercent }),
      };
      await submitBooking(payload);
      try {
        await sendBookingConfirmationEmail(payload);
      } catch {
        // Booking saved; email is best-effort
      }
      setSuccessSummary({
        packageName: selectedPackage.name,
        ...(selectedDate && { bookingDate: selectedDate }),
        ...(selectedTimeSlot && { timeSlot: selectedTimeSlot }),
      });
      setSuccess(true);
      clearBooking();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    if (!successSummary) return null;
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
        <Navbar />
        <main className="relative py-24 md:py-28 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-lg mx-auto px-5 text-center">
            <div className="w-16 h-16 rounded-full bg-icube-gold/20 border-2 border-icube-gold flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-icube-gold">✓</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-3">Booking made successfully</h1>
            <p className="text-gray-400 font-light mb-4">
              Thank you for choosing us. We’ve received your request for {successSummary.packageName}
              {successSummary.bookingDate && successSummary.timeSlot
                ? ` on ${successSummary.bookingDate} at ${successSummary.timeSlot}`
                : "."}
            </p>
            <p className="text-gray-500 text-sm mb-8">
              We’ll confirm availability and get back to you shortly.
            </p>
            <Link
              href="/packages"
              className="inline-flex items-center justify-center py-4 px-8 rounded-xl bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider hover:bg-icube-gold-light transition-colors"
            >
              Back to packages
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!selectedPackage) return null;

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 md:px-12">
          <BookingProgress currentStep={3} steps={["Date & time", "Add-ons", "Checkout"]} />
          <Link
            href={isDirectCheckout ? "/packages" : "/packages/add-ons"}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-8 transition-colors"
          >
            <ChevronLeft size={18} />
            {isDirectCheckout ? "Back to packages" : "Back to add-ons"}
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-2">
            Checkout
          </h1>
          <p className="text-gray-400 font-light mb-10">
            Review your booking and enter your details to complete the request.
          </p>

          {/* Discount code */}
          <div className="mb-8 space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Discount code
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountError(null);
                }}
                className="flex-1 bg-icube-dark/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30"
                placeholder="Enter discount code (e.g. ICUBE10)"
              />
              <button
                type="button"
                onClick={applyDiscountCode}
                className="px-6 py-3.5 rounded-xl bg-icube-gold text-icube-dark font-semibold text-sm uppercase tracking-wider hover:bg-icube-gold-light transition-colors shrink-0"
              >
                Apply
              </button>
            </div>
            {discountError && <p className="text-xs text-red-400 mt-1">{discountError}</p>}
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order summary</h2>
            <div className="space-y-3">
              {selectedStudio && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Studio</span>
                  <span>{selectedStudio.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{selectedPackage.name}</span>
                <span className="text-white flex items-baseline">
                  <img
                    src="/aed-symbol.svg"
                    alt="AED"
                    className="mr-1 h-3 w-auto inline-block align-baseline invert"
                  />
                  {selectedPackage.price_aed.toLocaleString()}
                </span>
              </div>
              {selectedDate && selectedTimeSlot && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{selectedDate} · {selectedTimeSlot}</span>
                </div>
              )}
              {selectedAddOns.length > 0 && (
                <>
                  {selectedAddOns.map((a) => (
                    <div key={a.id} className="flex justify-between text-sm text-gray-400">
                      <span>+ {a.name}</span>
                      <span className="flex items-baseline">
                        <img
                          src="/aed-symbol.svg"
                          alt="AED"
                          className="mr-1 h-3 w-auto inline-block align-baseline invert"
                        />
                        {a.price_aed.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-medium text-white">
                    <span>Add-ons</span>
                    <span className="flex items-baseline">
                      <img
                        src="/aed-symbol.svg"
                        alt="AED"
                        className="mr-1 h-3 w-auto inline-block align-baseline invert"
                      />
                      {totalAddonsAmount.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              {discountPercent > 0 && (
                <div className="border-t border-white/10 pt-3 flex justify-between text-sm text-icube-gold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-4 flex justify-between font-display font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-icube-gold flex items-baseline">
                  <img
                    src="/aed-symbol.svg"
                    alt="AED"
                    className="mr-1 h-4 w-auto inline-block align-baseline invert"
                  />
                  {totalAmount.toLocaleString()}
                </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
