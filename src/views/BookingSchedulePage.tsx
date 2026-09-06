"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, ChevronLeft, CircleSlash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingProgress from "@/components/BookingProgress";
import { useBooking, type PackageSchedulePreference } from "@/BookingContext";

export default function BookingSchedulePage() {
  const router = useRouter();
  const {
    selectedPackage,
    packageSchedulePreference,
    setPackageSchedulePreference,
    setSelectedDate,
    setSelectedTimeSlot,
  } = useBooking();

  useEffect(() => {
    if (!selectedPackage) {
      router.replace("/packages");
      return;
    }
    if (selectedPackage.requires_schedule === false) {
      setPackageSchedulePreference("unscheduled");
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      router.replace("/packages/add-ons");
    }
  }, [selectedPackage, router, setPackageSchedulePreference, setSelectedDate, setSelectedTimeSlot]);

  if (!selectedPackage || selectedPackage.requires_schedule === false) return null;

  function choose(preference: PackageSchedulePreference) {
    setPackageSchedulePreference(preference);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    router.push(preference === "scheduled" ? "/packages/date-time" : "/packages/add-ons");
  }

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-12">
          <BookingProgress currentStep={1} steps={["Schedule", "Date & time", "Add-ons", "Checkout"]} />
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-8 transition-colors"
          >
            <ChevronLeft size={18} />
            Back to packages
          </Link>

          <div className="mb-10 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-icube-gold mb-3">{selectedPackage.name}</p>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-3">
              Do you need to book a date and time?
            </h1>
            <p className="text-gray-400 font-light max-w-2xl">
              Choose a studio slot when your package needs an on-site session, or continue without a schedule for work that does not reserve studio time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => choose("scheduled")}
              className={`group text-left rounded-2xl border p-6 transition-all ${
                packageSchedulePreference === "scheduled"
                  ? "border-icube-gold bg-icube-gold/10"
                  : "border-white/10 bg-white/[0.04] hover:border-icube-gold/60 hover:bg-white/[0.06]"
              }`}
            >
              <CalendarClock size={28} className="text-icube-gold mb-5" />
              <span className="block text-xl font-display font-semibold text-white mb-2">Yes, choose a date and time</span>
              <span className="block text-sm leading-6 text-gray-400 mb-5">Check availability and reserve a studio slot after successful payment.</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-icube-gold">
                Choose schedule <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => choose("unscheduled")}
              className={`group text-left rounded-2xl border p-6 transition-all ${
                packageSchedulePreference === "unscheduled"
                  ? "border-icube-gold bg-icube-gold/10"
                  : "border-white/10 bg-white/[0.04] hover:border-icube-gold/60 hover:bg-white/[0.06]"
              }`}
            >
              <CircleSlash2 size={28} className="text-icube-gold mb-5" />
              <span className="block text-xl font-display font-semibold text-white mb-2">No, continue without a schedule</span>
              <span className="block text-sm leading-6 text-gray-400 mb-5">Continue to add-ons and checkout without reserving a date, time, or studio slot.</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-icube-gold">
                Continue <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
