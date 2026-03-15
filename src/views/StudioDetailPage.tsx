"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, Play, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useBooking } from "../BookingContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { VideoPlayerModal } from "../components/VideoPlayerModal";

const OPTIMIZED_IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
function isOptimizedImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return OPTIMIZED_IMAGE_HOSTS.some((h) => host === h);
  } catch {
    return false;
  }
}

export default function StudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : null;
  const { studios, portfolio } = useSiteData();
  const { setSelectedStudio, setSelectedPackage } = useBooking();
  const [activeImage, setActiveImage] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselPausedRef = useRef(false);
  const [playingProject, setPlayingProject] = useState<{ id: number | string; title: string; video_url?: string } | null>(null);

  const studio = id ? (studios.find((s) => s.id === id) ?? null) : null;
  const images = studio
    ? [{ image_url: studio.cover_image_url, caption: null, sort_order: 0 }, ...(studio.images || [])]
    : [];

  useEffect(() => {
    if (studio) {
      setActiveImage(0);
      setImageLoading(!!images.length);
    }
  }, [studio?.id, images.length]);

  const handleMainImageLoad = useCallback(() => {
    setImageLoading(false);
    const wrapper = imageWrapRef.current;
    const img = wrapper?.querySelector("img");
    if (img?.naturalWidth && img.naturalHeight && wrapper) {
      const wrapW = wrapper.getBoundingClientRect().width;
      const maxH = typeof window !== "undefined" ? window.innerHeight * 0.7 : 600;
      const aspect = img.naturalHeight / img.naturalWidth;
      const h = Math.min(wrapW * aspect, maxH);
      if (h > 0) setContainerHeight(Math.round(h));
    } else if (wrapper) {
      const h = wrapper.getBoundingClientRect().height;
      if (h > 0) setContainerHeight(Math.round(h));
    }
  }, []);

  const handleThumbClick = useCallback((index: number) => {
    if (index === activeImage) return;
    setImageLoading(true);
    setActiveImage(index);
  }, [activeImage]);

  const works = portfolio.filter((p) => p.visible !== false).slice(0, 8);

  useEffect(() => {
    if (works.length === 0) return;
    const el = carouselRef.current;
    if (!el) return;
    const speed = 0.6;
    let rafId: number;
    const tick = () => {
      if (!carouselPausedRef.current && el) {
        el.scrollLeft += speed;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [works.length]);

  if (id && !studio) {
    return (
      <div className="site-wrapper min-h-screen bg-icube-dark text-white">
        <Navbar />
        <main className="pt-20 md:pt-24 flex items-center justify-center flex-1 px-6 py-24">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Studio not found.</p>
            <Link href="/#studio" className="text-icube-gold hover:underline">
              Back to studios
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="site-wrapper min-h-screen bg-icube-dark text-white">
        <Navbar />
        <main className="pt-20 md:pt-24 flex items-center justify-center flex-1">
          <div className="h-12 w-12 animate-pulse rounded-full border-2 border-icube-gold/30 border-t-icube-gold" aria-hidden />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray/40 to-icube-dark text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main id="main-content" className="pt-20 md:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link
          href="/#studio"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold transition-colors text-sm mb-8"
        >
          <ArrowLeft size={18} />
          Back to studios
        </Link>

        {/* Gallery – thumbnails on the left, main image container sizes to image */}
        <section className="mb-12 md:mb-16 flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Thumbnails – separate column on the left */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 order-2 md:order-1 md:w-24 shrink-0 overflow-x-auto md:overflow-x-visible md:overflow-y-auto pb-2 md:pb-0">
              {images.map((img, i) => (
                <button
                  key={`${img.image_url}-${i}`}
                  type="button"
                  onClick={() => handleThumbClick(i)}
                  className={`relative shrink-0 w-16 h-12 md:w-24 md:h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-icube-gold ring-2 ring-icube-gold/30" : "border-white/10 hover:border-white/20"
                  }`}
                  aria-label={`Thumbnail ${i + 1}`}
                >
                  {isOptimizedImageUrl(img.image_url) ? (
                    <Image src={img.image_url} alt="" fill sizes="96px" className="object-cover" loading="lazy" />
                  ) : (
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main image – container height transitions smoothly; loading bar while image loads */}
          <div
            className="order-1 md:order-2 flex-1 min-w-0 relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 transition-[height] duration-500 ease-out"
            style={{ height: containerHeight ?? "auto", minHeight: imageLoading ? (containerHeight ?? 280) : undefined }}
          >
            {/* Loading bar – top of container */}
            {imageLoading && (
              <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/10 overflow-hidden rounded-t-2xl">
                <motion.div
                  className="h-full bg-icube-gold"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: "40%" }}
                />
              </div>
            )}
            <div className="relative flex justify-center items-start bg-icube-gray/30">
              <AnimatePresence mode="wait" initial={false}>
                {images[activeImage]?.image_url && (
                  <motion.div
                    key={`${activeImage}-${images[activeImage].image_url}`}
                    ref={imageWrapRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-full"
                  >
                    {isOptimizedImageUrl(images[activeImage].image_url) ? (
                      <Image
                        src={images[activeImage].image_url}
                        alt={studio.name}
                        width={1200}
                        height={800}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 900px"
                        className="w-full h-auto max-h-[70vh] object-contain block"
                        priority={activeImage === 0}
                        onLoad={handleMainImageLoad}
                      />
                    ) : (
                      <img
                        src={images[activeImage].image_url}
                        alt={studio.name}
                        className="w-full h-auto max-h-[70vh] object-contain block"
                        referrerPolicy="no-referrer"
                        onLoad={handleMainImageLoad}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setImageLoading(true);
                      setActiveImage((i) => (i - 1 + images.length) % images.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageLoading(true);
                      setActiveImage((i) => (i + 1) % images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Details + Book CTA – reference style: pill, title, description with border, features, price + CTA */}
        <section className="mb-16 md:mb-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-10 w-full">
            <div className="mb-6">
              <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider text-white/90 bg-white/5 border border-white/10">
                Studio
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-6">
              {studio.name}
            </h1>
            {studio.details && (
              <div className="mb-8">
                <h2 className="text-lg font-display font-semibold text-white mb-3">About this studio</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-white/20">
                  {studio.details}
                </p>
              </div>
            )}
            <div className="pl-4 border-l-2 border-white/20 mb-8">
              <p className="text-gray-300 leading-relaxed max-w-xl">
                {studio.short_description}
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                studio.capacity != null ? `Up to ${studio.capacity} people` : null,
                studio.size_sqm != null ? `${studio.size_sqm} m² space` : null,
                "Professional equipment",
                "Flexible booking",
              ]
                .filter(Boolean)
                .map((label) => (
                  <li key={label as string} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-white font-medium">{label}</span>
                  </li>
                ))}
            </ul>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Starting from</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-white">
                  {studio.price_aed_per_hour_before != null && studio.price_aed_per_hour_before > 0 && (
                    <span className="text-gray-500 text-lg font-normal line-through mr-2">{studio.price_aed_per_hour_before} AED/hr</span>
                  )}
                  {studio.price_aed_per_hour} AED/hr
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudio({
                    id: studio.id,
                    name: studio.name,
                    price_aed_per_hour: studio.price_aed_per_hour,
                  });
                  setSelectedPackage(null);
                  router.push("/studio/booking/date-time");
                }}
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/5 border border-white/20 text-white font-semibold hover:bg-white/10 hover:border-white/30 transition-colors shrink-0"
              >
                <Calendar className="w-4 h-4" />
                Book this studio
              </button>
            </div>
          </div>
        </section>

        {/* Works shot in this studio */}
        <section className="border-t border-white/10 pt-12 md:pt-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Featured work</h2>
          <p className="text-xl md:text-2xl font-display font-semibold text-white mb-8">
            Projects from our studios
          </p>
          {works.length > 0 ? (
            <div className="relative">
              <div
                ref={carouselRef}
                onMouseEnter={() => { carouselPausedRef.current = true; }}
                onMouseLeave={() => { carouselPausedRef.current = false; }}
                className="flex gap-4 md:gap-6 overflow-x-auto pb-2 -mx-1 scrollbar-hide"
              >
                {[...works, ...works].map((project, i) => {
                  const embed = project.video_url && getVideoEmbed(project.video_url);
                  return (
                    <div
                      key={`${project.id}-${i}`}
                      className="group flex-[0_0_calc(50%-0.5rem)] md:flex-[0_0_calc(50%-0.75rem)] min-w-0 shrink-0"
                    >
                      <div className="aspect-[4/3] overflow-hidden border border-white/10 bg-white/5 relative">
                        <Image
                          src={project.image_url}
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:blur-[3px]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          {embed ? (
                            <button
                              type="button"
                              onClick={() => setPlayingProject(project)}
                              className="play-btn-glass-wrap rounded-full w-12 h-12 flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                              aria-label={`Play ${project.title}`}
                            >
                              <span className="play-btn-ring" aria-hidden />
                              <span className="play-btn-ring" aria-hidden />
                              <span className="play-btn-ring" aria-hidden />
                              <div className="play-btn-glass rounded-full w-12 h-12 flex items-center justify-center absolute inset-0">
                                <Play size={22} className="text-white ml-0.5" fill="currentColor" />
                              </div>
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-white font-medium text-sm mt-2 truncate">{project.title}</p>
                      {project.category ? <p className="text-gray-500 text-xs truncate">{project.category}</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No featured projects yet.</p>
          )}
        </section>
      </div>
      </main>
      <Footer />

      {playingProject?.video_url && (() => {
        const embed = getVideoEmbed(playingProject.video_url);
        if (!embed) return null;
        return (
          <VideoPlayerModal
            key={playingProject.id}
            embed={embed}
            title={playingProject.title}
            onClose={() => setPlayingProject(null)}
          />
        );
      })()}
    </div>
  );
}
