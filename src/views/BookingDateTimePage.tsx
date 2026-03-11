"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ChevronLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBooking } from "@/BookingContext";

const TIME_SLOTS = [
  "09:00 - 11:00",
  "11:00 - 13:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

function getNextDays(count: number): { date: string; label: string; dayName: string }[] {
  const out: { date: string; label: string; dayName: string }[] = [];
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push({
      date: `${y}-${m}-${day}`,
      label: d.toLocaleDateString("en-AE", options),
      dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-AE", { weekday: "short" }),
    });
  }
  return out;
}

export default function BookingDateTimePage() {
  const router = useRouter();
  const { selectedPackage, selectedStudio, selectedDate, selectedTimeSlot, setSelectedDate, setSelectedTimeSlot } = useBooking();
  const [days] = useState(() => getNextDays(14));

  useEffect(() => {
    if (!selectedPackage) {
      router.replace("/packages");
      return;
    }
  }, [selectedPackage, router]);

  const handleContinue = () => {
    if (selectedDate && selectedTimeSlot) router.push("/packages/add-ons");
  };

  if (!selectedPackage) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-12">
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
              Select date
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    selectedDate === d.date
                      ? "border-icube-gold bg-icube-gold/15 text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span className="block text-xs text-gray-500 uppercase tracking-wider">{d.dayName}</span>
                  <span className="block font-medium">{d.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Time slots */}
          <section className="mb-10">
            <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-white mb-4">
              <Clock size={20} className="text-icube-gold" />
              Select time
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  disabled={!selectedDate}
                  className={`rounded-xl border p-4 text-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedTimeSlot === slot
                      ? "border-icube-gold bg-icube-gold/15 text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {slot}
                </button>
              ))}
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
