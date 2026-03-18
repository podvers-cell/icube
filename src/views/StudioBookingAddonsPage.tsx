"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check, ChevronLeft, ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingProgress from "@/components/BookingProgress";
import { useBooking } from "@/BookingContext";
import { getBookingAddons, type BookingAddon } from "@/api";

const FALLBACK_ADDONS: BookingAddon[] = [
  { id: "addon-1", name: "Extra camera operator", description: "Additional camera for multi-angle coverage", price_aed: 350, sort_order: 1 },
  { id: "addon-2", name: "Professional makeup", description: "On-site makeup artist for talent", price_aed: 500, sort_order: 2 },
  { id: "addon-3", name: "Teleprompter", description: "Teleprompter setup and operator", price_aed: 200, sort_order: 3 },
  { id: "addon-4", name: "Rush edit (24h)", description: "Priority editing and delivery within 24 hours", price_aed: 800, sort_order: 4 },
  { id: "addon-5", name: "Green screen", description: "Green screen backdrop and keying", price_aed: 300, sort_order: 5 },
];

function parseIncludedFeatures(raw: string | null | undefined): string[] {
  const s = (raw ?? "").trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    // ignore
  }
  return s
    .split("\n")
    .map((x) => x.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

export default function StudioBookingAddonsPage() {
  const router = useRouter();
  const { selectedStudio, selectedDurationHours, selectedDate, selectedTimeSlot, selectedAddOns, addAddon, removeAddon, totalAddonsAmount } = useBooking();
  const durationHours = selectedDurationHours ?? 2;
  const [addons, setAddons] = useState<BookingAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBookingAddons()
      .then((list) => {
        if (!cancelled) setAddons(Array.isArray(list) && list.length > 0 ? list : FALLBACK_ADDONS);
      })
      .catch(() => {
        if (!cancelled) setAddons(FALLBACK_ADDONS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedStudio || !selectedDate || !selectedTimeSlot || !selectedDurationHours) {
      router.replace("/#studio");
      return;
    }
  }, [selectedStudio, selectedDate, selectedTimeSlot, selectedDurationHours, router]);

  const handleContinue = () => {
    router.push("/studio/booking/checkout");
  };

  const isSelected = (id: string) => selectedAddOns.some((a) => a.id === id);
  const toggle = (a: BookingAddon) => {
    if (isSelected(a.id)) removeAddon(a.id);
    else addAddon({ id: a.id, name: a.name, price_aed: a.price_aed });
  };

  const studioTotal = selectedStudio ? selectedStudio.price_aed_per_hour * durationHours : 0;

  if (!selectedStudio || !selectedDate || !selectedTimeSlot || !selectedDurationHours) return null;

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-12">
          <BookingProgress currentStep={2} steps={["Date & time", "Add-ons", "Checkout"]} />
          <Link
            href="/studio/booking/date-time"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-8 transition-colors"
          >
            <ChevronLeft size={18} />
            Back to date & time
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-2">
              Add extra services
            </h1>
            <p className="text-gray-400 font-light">
              Optional add-ons to enhance your session. You can skip this step if you don’t need any.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-10">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-white font-medium">{selectedStudio.name}</span>
              <span className="text-gray-500">{selectedDate}</span>
              <span className="text-gray-500">{selectedTimeSlot}</span>
              <span className="text-icube-gold">{studioTotal} AED ({durationHours}h)</span>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-400 py-12">Loading add-ons…</div>
          ) : (
            <section className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addons.map((a) => {
                  const selected = isSelected(a.id);
                  const expanded = expandedId === a.id;
                  return (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(a)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(a);
                        }
                      }}
                      className={`rounded-2xl border p-6 text-left transition-all duration-200 flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold focus-visible:ring-offset-2 focus-visible:ring-offset-icube-dark ${
                        selected
                          ? "border-icube-gold bg-icube-gold/10"
                          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {a.image_url && String(a.image_url).trim() ? (
                          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 aspect-square w-24 sm:w-28 flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={String(a.image_url)}
                              alt={a.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3 min-h-[28px]">
                            <h3 className="font-display font-semibold text-white line-clamp-1">{a.name}</h3>
                          </div>

                          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            {a.price_before_aed != null && a.price_before_aed > 0 && (
                              <span className="text-gray-500 text-xs line-through">{a.price_before_aed} AED</span>
                            )}
                            <span className="text-icube-gold font-bold text-lg leading-none">{a.price_aed} AED</span>
                          </div>
                        </div>
                        <div
                          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? "border-icube-gold bg-icube-gold text-icube-dark" : "border-white/20"
                          }`}
                        >
                          {selected ? <Check size={20} /> : <Plus size={20} className="text-gray-400" />}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpandedId((cur) => (cur === a.id ? null : a.id));
                        }}
                        className="mt-4 ml-auto inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-icube-gold transition-colors"
                        aria-expanded={expanded}
                        aria-label={expanded ? "Hide details" : "Show details"}
                      >
                        Details
                        <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Details collapses from bottom */}
                      <div
                        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                          expanded ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-gray-400 text-sm font-light">{a.description?.trim() || "—"}</p>
                          </div>

                          {(() => {
                            const features = parseIncludedFeatures(a.included_features);
                            if (features.length === 0) return null;
                            return (
                              <div className="pt-3 border-t border-white/10">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Included</p>
                                <ul className="text-gray-400 text-sm font-light space-y-1">
                                  {features.slice(0, 4).map((f, idx) => (
                                    <li key={idx} className="flex gap-2">
                                      <span className="text-gray-500">•</span>
                                      <span className="min-w-0">{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })()}

                          {a.ideal_for && a.ideal_for.trim() ? (
                            <div className="pt-3 border-t border-white/10">
                              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Ideal for</p>
                              <p className="text-gray-400 text-sm font-light">{a.ideal_for.trim()}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {selectedAddOns.length > 0 && (
            <div className="rounded-2xl border border-icube-gold/30 bg-icube-gold/5 p-6 mb-10">
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Selected add-ons</p>
              <ul className="space-y-1 mb-3">
                {selectedAddOns.map((a) => (
                  <li key={a.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{a.name}</span>
                    <span className="text-icube-gold">{a.price_aed} AED</span>
                  </li>
                ))}
              </ul>
              <p className="flex justify-between font-semibold text-white border-t border-white/10 pt-3">
                Add-ons total <span className="text-icube-gold">{totalAddonsAmount} AED</span>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <Link
              href="/studio/booking/date-time"
              className="inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 transition-colors"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider hover:bg-icube-gold-light transition-colors"
            >
              Continue to checkout
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
