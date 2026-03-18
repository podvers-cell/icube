"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ChevronLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingDatePicker from "@/components/BookingDatePicker";
import BookingProgress from "@/components/BookingProgress";
import { useBooking } from "@/BookingContext";
import { getBookedSlots } from "@/api";
import { getTodayInRegion, getDateInputMax, isSlotPastInRegion } from "@/utils/bookingTimezone";

// 9:00 AM (9) through 10:00 PM (22) — one slot per hour
const HOURLY_SLOTS: { value: string; label: string }[] = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = 9; h <= 22; h++) {
    const value = `${String(h).padStart(2, "0")}:00`;
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
    out.push({ value, label });
  }
  return out;
})();

export default function BookingDateTimePage() {
  const router = useRouter();
  const { selectedPackage, selectedStudio, selectedDate, selectedTimeSlot, setSelectedDate, setSelectedTimeSlot } = useBooking();
  const dateMin = getTodayInRegion();
  const dateMax = getDateInputMax();

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedPackage) {
      router.replace("/packages");
      return;
    }
  }, [selectedPackage, router]);

  useEffect(() => {
    if (!selectedDate) {
      setBookedSlots([]);
      return;
    }
    setLoadingSlots(true);
    // If a studio is selected (optional), scope availability to that studio; else use global.
    getBookedSlots(selectedDate, selectedStudio?.id)
      .then(setBookedSlots)
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedStudio?.id]);

  useEffect(() => {
    if (!selectedDate || !selectedTimeSlot) return;
    const isPast = isSlotPastInRegion(selectedDate, selectedTimeSlot);
    const isBooked = bookedSlots.includes(selectedTimeSlot);
    if (isPast || isBooked) setSelectedTimeSlot(null);
  }, [selectedDate, selectedTimeSlot, bookedSlots, setSelectedTimeSlot]);

  const handleContinue = () => {
    if (selectedDate && selectedTimeSlot) router.push("/packages/add-ons");
  };

  if (!selectedPackage) return null;

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-12">
          <BookingProgress currentStep={1} steps={["Date & time", "Add-ons", "Checkout"]} />
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-8 transition-colors"
          >
            <ChevronLeft size={18} />
            Back to packages
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-2">
              Choose date & time
            </h1>
            <p className="text-gray-400 font-light">
              Select your preferred day and time slot for <span className="text-icube-gold">{selectedPackage.name}</span>.
            </p>
          </div>

          {/* Step summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-10">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {selectedStudio && (
                <>
                  <span className="text-gray-500 uppercase tracking-wider">Studio</span>
                  <span className="text-white font-medium">{selectedStudio.name}</span>
                </>
              )}
              <span className="text-gray-500 uppercase tracking-wider">Package</span>
              <span className="text-white font-medium">{selectedPackage.name}</span>
              <span className="text-icube-gold">{selectedPackage.price_aed} AED</span>
              <span className="text-gray-500">{selectedPackage.duration}</span>
            </div>
          </div>

          {/* Date selection */}
          <section className="mb-10">
            <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-white mb-4">
              <Calendar size={20} className="text-icube-gold" />
              Date
            </h2>
            <div className="inline-block w-full max-w-sm">
              <BookingDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                min={dateMin}
                max={dateMax}
              />
            </div>
          </section>

          {/* Time slots */}
          <section className="mb-10">
            <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-white mb-4">
              <Clock size={20} className="text-icube-gold" />
              Start time
            </h2>
            <p className="text-gray-500 text-sm mb-3">
              Available from 9:00 AM to 10:00 PM (Dubai time). Past times and booked slots are unavailable.
            </p>
            {loadingSlots && selectedDate && (
              <p className="text-gray-500 text-xs mb-2">Checking availability…</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {HOURLY_SLOTS.map(({ value, label }) => {
                const isPast = selectedDate ? isSlotPastInRegion(selectedDate, value) : false;
                const isBooked = bookedSlots.includes(value);
                const disabled = !selectedDate || isPast || isBooked;
                const reason = selectedDate ? (isPast ? "Past" : isBooked ? "Booked" : "") : "";
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedTimeSlot(value)}
                    disabled={disabled}
                    title={reason ? `${label} – ${reason}` : label}
                    className={`rounded-xl border py-3 text-center text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedTimeSlot === value
                        ? "border-icube-gold bg-icube-gold/15 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <Link
              href="/packages"
              className="inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 transition-colors"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedDate || !selectedTimeSlot}
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider hover:bg-icube-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to add-ons
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
