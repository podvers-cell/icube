"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Camera, MessageCircle, X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { cloudinaryImage } from "@/lib/cloudinaryImage";
import {
  rentalAvailabilityClasses,
  rentalCtaLabel,
  rentalPriceUnitLabel,
  rentalWhatsappUrl,
} from "../lib/rentalPresentation";
import { rentalAvailabilityLabel, rentalImages, type RentalEquipment } from "../types/rentalEquipment";

/**
 * The full record for one rental item.
 *
 * The card can only carry a two-line summary, so everything else — the whole gallery, the long
 * details text, the quantity — lives here. Read-only: this is a catalogue, not a checkout, and the
 * only action is an enquiry.
 *
 * A sheet on a phone and a centred dialog from sm up, matching the dashboard's dialog behaviour:
 * Escape and the backdrop close it, focus is trapped while open and handed back to the button that
 * opened it, and the page behind cannot scroll.
 */

type Props = {
  item: RentalEquipment;
  /** Which gallery image the card was showing, so opening details does not jump back to the cover. */
  initialImage?: number;
  onClose: () => void;
};

export default function EquipmentDetailsDialog({ item, initialImage = 0, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const images = rentalImages(item);
  const [active, setActive] = useState(() => (initialImage < images.length ? initialImage : 0));
  const cover = images[active];
  const quantity = item.quantity_available ?? 0;

  // Declared before the effect below so it captures the trigger as the previously focused element,
  // rather than the panel that effect focuses. It also restores that focus on close.
  useFocusTrap(panelRef, true);

  /**
   * Held in a ref so the Escape listener is registered once. Callers pass an inline arrow, and
   * with onClose in the dependency list the effect would re-run — and re-focus — on every render.
   */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKeyDown);

    // Hold the page still behind the dialog, compensating for the scrollbar it removes.
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
      onPointerDown={(e) => {
        // Pointer rather than mouse: a tap on the backdrop closes on the touch itself instead of
        // waiting for the emulated mouse event a browser sends ~300ms later, and pen works too.
        // Only a press that *starts* on the backdrop closes, so a drag out of the panel does not.
        if (e.target !== e.currentTarget) return;
        /**
         * The browser follows an unprevented pointerdown with a mousedown that focuses whatever
         * was pressed. The backdrop is not focusable, so that lands focus on the body — after the
         * focus trap has already handed it back to the trigger, quietly undoing the restoration.
         * Closing on Escape was unaffected, which is why the two behaved differently.
         */
        e.preventDefault();
        onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-icube-gray text-white shadow-2xl outline-none sm:max-h-[88vh] sm:max-w-4xl sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-icube-gold">
              {item.category}
            </p>
            <h2 id={titleId} className="mt-1 font-display text-lg font-bold sm:text-xl">
              {item.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icube-gold"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {cover ? (
                  <Image
                    src={cloudinaryImage(cover, 900)}
                    unoptimized
                    alt={
                      images.length > 1
                        ? `${item.name} — image ${active + 1} of ${images.length}`
                        : item.name
                    }
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20" aria-hidden>
                    <Camera size={48} />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div
                  className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
                  role="group"
                  aria-label={`${item.name} images`}
                >
                  {images.map((image, index) => (
                    /* Index-based key: the same URL can legitimately appear twice. */
                    <button
                      key={`${index}-${image}`}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`Show image ${index + 1} of ${images.length}`}
                      aria-current={index === active}
                      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icube-gold ${
                        index === active ? "border-icube-gold" : "border-white/10 hover:border-icube-gold/50"
                      }`}
                    >
                      <Image
                        src={cloudinaryImage(image, 160)}
                        unoptimized
                        alt=""
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${rentalAvailabilityClasses(item.availability_status)}`}
                >
                  {rentalAvailabilityLabel(item.availability_status)}
                </span>
                {quantity > 0 && (
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-gray-300">
                    {quantity} available
                  </span>
                )}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="font-display text-2xl font-bold">
                  AED {item.price_aed.toLocaleString("en-AE")}
                </p>
                <p className="text-xs text-gray-500">{rentalPriceUnitLabel(item.price_unit)}</p>
              </div>

              {item.short_description && (
                <p className="mt-4 text-sm font-light leading-relaxed text-gray-300">
                  {item.short_description}
                </p>
              )}

              {item.details && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Details
                  </h3>
                  {/* The dashboard stores this as free text; pre-line keeps the line breaks typed there. */}
                  <p className="whitespace-pre-line text-sm font-light leading-relaxed text-gray-300">
                    {item.details}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-icube-gold/50 hover:text-icube-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icube-gold"
          >
            Close
          </button>
          <a
            href={rentalWhatsappUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-icube-gold px-5 py-2.5 text-sm font-semibold text-icube-dark transition-colors hover:bg-icube-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icube-gold"
          >
            <MessageCircle size={16} aria-hidden />
            {rentalCtaLabel(item)}
          </a>
        </footer>
      </div>
    </div>
  );
}
