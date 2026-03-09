import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Users, Maximize2, BadgeDollarSign } from "lucide-react";
import { useSiteData } from "../SiteDataContext";

export default function Studio() {
  const { studios, loading } = useSiteData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const selected = useMemo(() => studios.find((s) => s.id === openId) || null, [studios, openId]);
  const images = selected?.images?.length ? selected.images : selected ? [{ image_url: selected.cover_image_url, caption: null, sort_order: 0 }] : [];

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
      className="py-32 bg-gradient-to-b from-icube-gray via-icube-dark/90 to-icube-gray/80 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 flex flex-col items-center text-center gap-4"
        >
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Studio spaces
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Our Dubai studios
          </h2>
          <p className="text-gray-400 max-w-2xl font-light">
            Explore our studio spaces, then tap a card to see photos, capacity, size, and pricing details.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studios.map((s, idx) => (
            <motion.button
              key={s.id}
              type="button"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              onClick={() => setOpenId(s.id)}
              className="text-left group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-icube-gold/40 shadow-[0_18px_45px_rgba(0,0,0,0.4)] transition-colors"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={s.cover_image_url}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-icube-gold text-xs uppercase tracking-[0.2em] mb-2">Dubai</p>
                  <h3 className="text-2xl font-display font-bold text-white">{s.name}</h3>
                  <p className="text-gray-300 text-sm mt-2 max-w-sm">{s.short_description}</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <BadgeDollarSign size={16} className="text-icube-gold" />
                  <span>{s.price_aed_per_hour} AED/hr</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users size={16} className="text-icube-gold" />
                  <span>{s.capacity} ppl</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 justify-end">
                  <Maximize2 size={16} className="text-icube-gold" />
                  <span>{s.size_sqm} m²</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
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
                    href="#booking"
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
