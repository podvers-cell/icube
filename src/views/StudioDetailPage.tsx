"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useBooking } from "../BookingContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ProjectDetailModal } from "../components/ProjectDetailModal";
import { PlayPulseOverlay } from "../components/PlayPulseOverlay";
import type { ProjectDetail } from "../components/ProjectDetailModal";
import { useSwipeCarousel } from "../hooks/useSwipeCarousel";

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
  const [playingProject, setPlayingProject] = useState<ProjectDetail | null>(null);
  const studio = id ? (studios.find((s) => s.id === id) ?? null) : null;
  const images = studio
    ? [{ image_url: studio.cover_image_url, caption: null, sort_order: 0 }, ...(studio.images || [])]
    : [];

  useEffect(() => {
    if (!studio) return;
    setActiveImage(0);
    setImageLoading(true);
  }, [studio?.id]);

  // تحميل مسبق للصورة التالية والسابقة لتسريع التصفح
  useEffect(() => {
    if (!images.length) return;
    const len = images.length;
    const nextIndex = (activeImage + 1) % len;
    const prevIndex = (activeImage - 1 + len) % len;
    [nextIndex, prevIndex].forEach((idx) => {
      if (idx === activeImage) return;
      const url = images[idx]?.image_url;
      if (!url) return;
      const img = new window.Image();
      img.referrerPolicy = "no-referrer";
      img.src = url;
    });
  }, [studio?.id, activeImage, images.length]);

  const goPrevImage = useCallback(() => {
    setImageLoading(true);
    setActiveImage((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const goNextImage = useCallback(() => {
    setImageLoading(true);
    setActiveImage((i) => (i + 1) % images.length);
  }, [images.length]);

  const handleImageChange = useCallback((index: number) => {
    if (index === activeImage) return;
    setImageLoading(true);
    setActiveImage(index);
  }, [activeImage]);

  const swipeGallery = useSwipeCarousel(goPrevImage, goNextImage);

  const works = portfolio.filter((p) => p.visible !== false).slice(0, 8);
  const worksPerSlide = 2;
  const worksSlidesCount = Math.ceil(works.length / worksPerSlide) || 1;
  const [worksMarqueePaused, setWorksMarqueePaused] = useState(false);

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

        <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight mb-6">{studio.name}</h1>

        {/* Gallery — يتغيّر مع حجم الصورة؛ المسافة لبطاقة التعريف 50px */}
        <section className="mb-[50px] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-start gap-4">
            {/* المصغّرات عمودياً على اليسار — ثابتة */}
            {images.length > 1 && (
              <div className="shrink-0 p-2 flex flex-row sm:flex-col gap-2 pt-4 sm:pt-6 self-start">
                {images.map((img, i) => (
                  <button
                    key={`${img.image_url}-${i}`}
                    type="button"
                    onClick={() => handleImageChange(i)}
                    className={`relative shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                      i === activeImage
                        ? "ring-2 ring-icube-gold ring-offset-2 ring-offset-[#0d0f18] shadow-[0_0_16px_rgba(212,175,55,0.3)]"
                        : "opacity-70 hover:opacity-100 border border-white/10 hover:border-white/25"
                    }`}
                    aria-label={`Image ${i + 1}`}
                    aria-current={i === activeImage ? "true" : undefined}
                  >
                    {isOptimizedImageUrl(img.image_url) ? (
                      <Image src={img.image_url} alt="" fill sizes="80px" className="object-cover" loading="lazy" />
                    ) : (
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col items-center sm:items-start justify-start flex-1 min-w-0">
              <motion.div
                layout
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 65,
                    damping: 28,
                    mass: 0.8,
                  },
                }}
                className="rounded-2xl overflow-hidden border border-white/15 bg-white/[0.03] shadow-[0_24px_48px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)] w-fit max-w-full relative touch-pan-y"
                {...(images.length > 1 ? { onTouchStart: swipeGallery.onTouchStart, onTouchEnd: swipeGallery.onTouchEnd } : {})}
              >
                {imageLoading && (
                  <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-white/10 overflow-hidden rounded-t-2xl" aria-hidden>
                    <motion.div
                      className="h-full bg-icube-gold rounded-t-xl"
                      initial={{ width: "0%" }}
                      animate={{ width: ["0%", "70%", "95%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                )}
                <AnimatePresence mode="wait" initial={false}>
                  {images[activeImage]?.image_url && (
                    <motion.div
                      key={activeImage}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{
                        duration: 0.7,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="relative block origin-center"
                    >
                      <img
                        src={images[activeImage].image_url}
                        alt={studio.name}
                        className="max-w-full max-h-[85vh] w-auto h-auto block object-contain"
                        referrerPolicy="no-referrer"
                        loading={activeImage === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={activeImage === 0 ? "high" : "auto"}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2" role="tablist" aria-label="صورة المعرض">
                    {images.map((_, i) => (
                      <button
                      key={i}
                      type="button"
                      onClick={() => handleImageChange(i)}
                      role="tab"
                        aria-selected={i === activeImage}
                        aria-label={`Image ${i + 1}`}
                        className={`rounded-full transition-all duration-200 ${
                          i === activeImage
                            ? "w-2.5 h-2.5 bg-icube-gold"
                            : "w-2 h-2 bg-white/40 hover:bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* بطاقة بيانات الاستوديو — المسافة من الصورة الكبيرة دائماً 50px */}
        <header className="relative mb-10 md:mb-14 rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 overflow-hidden">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Studio
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white tracking-tight mb-3">
            {studio.name}
          </h2>
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">About this studio</h3>
            <p className="text-gray-300 font-light text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {studio.details}
            </p>
          </div>
          <p className="text-gray-400 font-light text-sm md:text-base leading-relaxed max-w-2xl pl-4 border-l-2 border-white/15 mb-6">
            {studio.short_description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-8">
            <div className="flex items-center gap-3 text-gray-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0">
                <Check size={14} className="text-white" strokeWidth={2.5} />
              </span>
              <span>Up to {studio.capacity} people</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0">
                <Check size={14} className="text-white" strokeWidth={2.5} />
              </span>
              <span>{studio.size_sqm} m² space</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0">
                <Check size={14} className="text-white" strokeWidth={2.5} />
              </span>
              <span>Hourly rate</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0">
                <Check size={14} className="text-white" strokeWidth={2.5} />
              </span>
              <span>Professional setup</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Starting from</p>
              {studio.price_aed_per_hour_before != null && studio.price_aed_per_hour_before > 0 && (
                <span className="text-gray-500 text-sm line-through block">{studio.price_aed_per_hour_before} AED/hr</span>
              )}
              <p className="text-white font-display font-bold text-2xl md:text-3xl">
                {studio.price_aed_per_hour.toLocaleString()} AED
                <span className="text-gray-400 font-normal text-lg ml-1">/hr</span>
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
              className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-white/25 bg-transparent text-white font-semibold hover:bg-white/10 hover:border-white/40 transition-colors shrink-0"
            >
              <Calendar size={20} />
              Book This Studio
            </button>
          </div>
        </header>

        {/* Works shot in this studio — كاروسيل فيديوهين في الصف، بدون rounded */}
        <section className="border-t border-white/10 pt-12 md:pt-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Featured work</h2>
          <p className="text-xl md:text-2xl font-display font-semibold text-white mb-8">
            Projects from our studios
          </p>
          {works.length > 0 ? (
            <div
              className="relative overflow-hidden"
              onMouseEnter={() => setWorksMarqueePaused(true)}
              onMouseLeave={() => setWorksMarqueePaused(false)}
            >
              <div
                className="flex works-marquee-track"
                style={{
                  width: "200%",
                  animationPlayState: worksMarqueePaused ? "paused" : "running",
                }}
              >
                {[0, 1].map((copy) =>
                  Array.from({ length: worksSlidesCount }, (_, slideIndex) => (
                    <div
                      key={`${copy}-${slideIndex}`}
                      className="shrink-0 grid grid-cols-2 gap-4 md:gap-6 px-1"
                      style={{ width: `${100 / (2 * worksSlidesCount)}%`, minWidth: `${100 / (2 * worksSlidesCount)}%` }}
                    >
                      {works.slice(slideIndex * worksPerSlide, slideIndex * worksPerSlide + worksPerSlide).map((project) => {
                        const embed = project.video_url && getVideoEmbed(project.video_url);
                        const projDetail = project as ProjectDetail;
                        return (
                          <div key={project.id} className="group">
                            <div
                              role={embed ? "button" : undefined}
                              tabIndex={embed ? 0 : undefined}
                              onClick={() => embed && setPlayingProject(projDetail)}
                              onKeyDown={(e) => embed && (e.key === "Enter" || e.key === " ") && setPlayingProject(projDetail)}
                              className="aspect-[4/3] overflow-hidden border border-white/10 bg-white/5 relative cursor-pointer hover:border-icube-gold/40 transition-colors"
                            >
                              <Image
                                src={project.image_url}
                                alt={project.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:blur-[2px]"
                                style={{ transformOrigin: "center center" }}
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                              {embed ? <PlayPulseOverlay className="z-10" /> : null}
                            </div>
                            <p className="text-white font-medium text-sm mt-2 truncate">{project.title}</p>
                            {project.category ? <p className="text-gray-500 text-xs truncate">{project.category}</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  )),
                )}
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
          <ProjectDetailModal
            key={playingProject.id}
            project={playingProject}
            embed={embed}
            onClose={() => setPlayingProject(null)}
          />
        );
      })()}
    </div>
  );
}
