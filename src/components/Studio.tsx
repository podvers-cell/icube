import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { viewportTransition, hoverTransition } from "../lib/motion";
import WavySectionDivider from "./WavySectionDivider";

export default function Studio() {
  const { studios } = useSiteData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selected = useMemo(() => studios.find((s) => s.id === openId) || null, [studios, openId]);
  const images = selected?.images?.length
    ? selected.images
    : selected
      ? [{ image_url: selected.cover_image_url, caption: null, sort_order: 0 }]
      : [];

  useEffect(() => {
    if (!selected) return;
    setActiveImage(0);
  }, [selected?.id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
      if (!selected) return;
      if (e.key === "ArrowLeft") setActiveImage((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setActiveImage((i) => (i + 1) % images.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, images.length]);

  return (
    <section
      id="studio"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-gray via-icube-dark/90 to-icube-gray/80 relative overflow-hidden"
    >
      <WavySectionDivider />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={viewportTransition}
          className="mb-16 flex flex-col items-center text-center gap-4"
        >
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Studio spaces
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white">
            Explore our studios
          </h2>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 max-w-2xl font-light mt-4">
            Professional spaces for podcasts, video, and branded content. Choose your studio and book your slot.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studios.map((s, idx) => (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ ...viewportTransition, delay: idx * 0.06 }}
              className="flex flex-col rounded-2xl bg-white/[0.06] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setOpenId(s.id)}
                className="relative block w-full aspect-[4/3] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold focus-visible:ring-offset-2 focus-visible:ring-offset-icube-dark"
              >
                <img
                  src={s.cover_image_url}
                  alt={s.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                  referrerPolicy="no-referrer"
                />
              </button>
              <div className="flex flex-col flex-1 p-6">
                <h3 className="text-xl font-display font-bold text-white mb-1">{s.name}</h3>
                <p className="text-icube-gold/90 text-sm font-medium mb-3">{s.price_aed_per_hour} AED/hour</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{s.short_description}</p>

                <div className="border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    className="flex items-center justify-between w-full py-2 text-left text-sm font-medium text-white/90 hover:text-icube-gold transition-colors"
                    aria-expanded={expandedId === s.id}
                  >
                    <span>What&apos;s included?</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${expandedId === s.id ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedId === s.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ originY: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="pt-0 pb-3 space-y-2 text-sm text-gray-400">
                          <li><span className="text-white/80">Capacity:</span> {s.capacity} people</li>
                          <li><span className="text-white/80">Size:</span> {s.size_sqm} m²</li>
                          <li className="text-gray-400 leading-relaxed">{s.details}</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <a
                  href="/packages"
                  className="mt-4 inline-flex items-center justify-center w-full py-3 px-4 bg-icube-dark border border-icube-gold/40 text-white font-semibold uppercase tracking-wider text-sm rounded-lg hover:bg-icube-gold hover:text-icube-dark transition-colors duration-200"
                >
                  Book now
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-5xl bg-icube-gray border border-white/10 rounded-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="min-w-0">
                  <p className="text-icube-gold text-xs uppercase tracking-[0.2em]">Studio</p>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white truncate">{selected.name}</h3>
                </div>
                <button
                  onClick={() => setOpenId(null)}
                  className="p-2 rounded-sm hover:bg-white/5 text-gray-300 hover:text-white"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative bg-black">
                  <img
                    src={images[activeImage]?.image_url}
                    alt={selected.name}
                    className="w-full h-[360px] md:h-[520px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  {images.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, i) => (
                          <button
                            key={`${img.image_url}-${i}`}
                            onClick={() => setActiveImage(i)}
                            className={`shrink-0 w-20 h-14 rounded-sm overflow-hidden border ${
                              i === activeImage ? "border-icube-gold" : "border-white/10"
                            }`}
                            aria-label={`Thumbnail ${i + 1}`}
                          >
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  <p className="text-gray-300 font-light leading-relaxed mb-6">{selected.details}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-black/30 border border-white/10 rounded-sm p-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Price</p>
                      <p className="text-white font-semibold">{selected.price_aed_per_hour} AED / hour</p>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-sm p-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Capacity</p>
                      <p className="text-white font-semibold">{selected.capacity} people</p>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-sm p-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Size</p>
                      <p className="text-white font-semibold">{selected.size_sqm} m²</p>
                    </div>
                  </div>

                  <a
                    href="/packages"
                    onClick={() => setOpenId(null)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light transition-colors w-full sm:w-auto"
                  >
                    Book this studio
                  </a>
                  <p className="text-gray-500 text-xs mt-3">Tip: Use ← → to browse images, Esc to close.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
