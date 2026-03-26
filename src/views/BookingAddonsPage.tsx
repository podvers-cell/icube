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
  { id: "addon-1", name: "Extra camera operator", description: "Additional camera for multi-angle coverage", price_aed: 350, sort_order: 1, is_popular: 1 },
  { id: "addon-2", name: "Professional makeup", description: "On-site makeup artist for talent", price_aed: 500, sort_order: 2, is_popular: 0 },
  { id: "addon-3", name: "Teleprompter", description: "Teleprompter setup and operator", price_aed: 200, sort_order: 3, is_popular: 0 },
  { id: "addon-4", name: "Rush edit (24h)", description: "Priority editing and delivery within 24 hours", price_aed: 800, sort_order: 4, is_popular: 0 },
  { id: "addon-5", name: "Green screen", description: "Green screen backdrop and keying", price_aed: 300, sort_order: 5, is_popular: 0 },
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

export default function BookingAddonsPage() {
  const router = useRouter();
  const { selectedPackage, selectedStudio, selectedDate, selectedTimeSlot, selectedAddOns, addAddon, removeAddon, totalAddonsAmount } = useBooking();
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

  const sortedAddons = [...addons].sort((a, b) => {
    const ap = Number((a as any).is_popular ?? 0);
    const bp = Number((b as any).is_popular ?? 0);
    if (bp !== ap) return bp - ap;
    return Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
  });

  useEffect(() => {
    if (!selectedPackage || !selectedDate || !selectedTimeSlot) {
      router.replace("/packages");
      return;
    }
  }, [selectedPackage, selectedDate, selectedTimeSlot, router]);

  const handleContinue = () => {
    router.push("/packages/checkout");
  };
  const baseTotal = selectedPackage ? selectedPackage.price_aed : 0;
  const grandTotal = baseTotal + totalAddonsAmount;

  const isSelected = (id: string) => selectedAddOns.some((a) => a.id === id);
  const toggle = (a: BookingAddon) => {
    if (isSelected(a.id)) removeAddon(a.id);
    else addAddon({ id: a.id, name: a.name, price_aed: a.price_aed });
  };

  if (!selectedPackage || !selectedDate || !selectedTimeSlot) return null;

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-12">
          <BookingProgress currentStep={2} steps={["Date & time", "Add-ons", "Checkout"]} />
          <Link
            href="/packages/date-time"
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

          {/* Booking summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-10">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {selectedStudio && (
                <span className="text-gray-400">Studio: <span className="text-white">{selectedStudio.name}</span></span>
              )}
              <span className="text-white font-medium">{selectedPackage.name}</span>
              <span className="text-gray-500">{selectedDate}</span>
              <span className="text-gray-500">{selectedTimeSlot}</span>
              <span className="text-icube-gold">{selectedPackage.price_aed} AED</span>
            </div>
          </div>

          {/* Top totals + checkout (keep bottom CTA too) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
                <span className="text-white font-semibold">
                  {grandTotal.toLocaleString()} <span className="text-gray-500 text-sm font-normal">AED</span>
                </span>
                {totalAddonsAmount > 0 ? (
                  <span className="text-gray-500 text-sm">
                    (Base {baseTotal.toLocaleString()} + Add-ons {totalAddonsAmount.toLocaleString()})
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">(Base {baseTotal.toLocaleString()})</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-icube-gold px-6 py-3.5 font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors"
              >
                Checkout
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-400 py-12">Loading add-ons…</div>
          ) : (
            <section className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedAddons.map((a) => {
                  const selected = isSelected(a.id);
                  const expanded = expandedId === a.id;
                  const isPopular = !!a.is_popular;
                  return (
                    <div
                      key={a.id}
                      className={`group relative overflow-visible rounded-2xl border transition-all duration-300 ${
                        selected
                          ? "border-icube-gold/70 bg-icube-gold/10 shadow-[0_20px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(212,175,55,0.15)]"
                          : isPopular
                            ? "border-icube-gold/35 bg-white/[0.05] shadow-[0_18px_56px_rgba(0,0,0,0.28)] hover:border-icube-gold/55 hover:bg-white/[0.06]"
                            : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* Accent glow for Most Popular */}
                      {isPopular ? (
                        <div
                          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-icube-gold/12 blur-[80px]"
                          aria-hidden
                        />
                      ) : null}

                      {/* Card header area */}
                      <div className="relative p-6">
                        {isPopular ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                            <span className="inline-flex items-center justify-center bg-white text-icube-dark text-[10px] font-semibold uppercase tracking-[0.2em] py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                              style={{ backgroundColor: "#F6EBD8", color: "#7B5A2A" }}
                            >
                              Most Popular
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-4">
                          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30 aspect-square w-24 sm:w-28 shrink-0">
                            {a.image_url && String(a.image_url).trim() ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={String(a.image_url)}
                                alt={a.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[11px] uppercase tracking-widest text-gray-500">
                                Add-on
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/55 to-transparent" aria-hidden />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="min-w-0 font-display font-semibold text-white leading-tight line-clamp-1">
                                {a.name}
                              </h3>
                            </div>
                            {a.description?.trim() ? (
                              <p className="mt-2 text-sm text-gray-400 font-light line-clamp-3">
                                {a.description.trim()}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              {a.price_before_aed != null && a.price_before_aed > 0 ? (
                                <span className="text-sm font-semibold line-through text-gray-500">
                                  {a.price_before_aed} AED
                                </span>
                              ) : null}
                              <span className="text-icube-gold font-display font-bold text-lg leading-none">
                                {a.price_aed} <span className="text-gray-400 text-xs font-sans">AED</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {a.ideal_for?.trim() ? (
                          <div className="mt-4 w-full border-t border-white/10 pt-4 text-xs text-gray-400">
                            <span className="text-gray-500 font-semibold uppercase tracking-wider mr-1">Ideal for:</span>
                            <span className="text-gray-300 whitespace-normal break-words">{a.ideal_for.trim()}</span>
                          </div>
                        ) : null}

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedId((cur) => (cur === a.id ? null : a.id));
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-icube-gold transition-colors"
                            aria-expanded={expanded}
                            aria-label={expanded ? "Hide details" : "Show details"}
                          >
                            Details
                            <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggle(a);
                            }}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                              selected
                                ? "bg-icube-gold text-icube-dark hover:bg-icube-gold-light"
                                : "border border-white/15 bg-white/5 text-white hover:border-icube-gold/40 hover:bg-icube-gold/10"
                            }`}
                          >
                            {selected ? (
                              <>
                                <Check size={16} />
                                Selected
                              </>
                            ) : (
                              <>
                                <Plus size={16} />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Details collapses from bottom */}
                      <div
                        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                          expanded ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-6 pb-6 pt-0 border-t border-white/10 space-y-3">
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

          {/* Selected add-ons total */}
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
              href="/packages/date-time"
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
