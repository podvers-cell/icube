"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Play, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";

function getYouTubeEmbedUrl(raw: string): string | null {
  try {
    if (!raw) return null;

    // Short URL: https://youtu.be/VIDEOID
    const shortIdx = raw.indexOf("youtu.be/");
    if (shortIdx !== -1) {
      const idPart = raw.slice(shortIdx + "youtu.be/".length).split(/[?&]/)[0];
      if (idPart) {
        return `https://www.youtube.com/embed/${idPart}?autoplay=1&mute=1&controls=0&showinfo=0&loop=1&playlist=${idPart}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1`;
      }
    }

    // Watch URL: https://www.youtube.com/watch?v=VIDEOID
    const watchIdx = raw.indexOf("watch?");
    if (raw.includes("youtube.com") && watchIdx !== -1) {
      const params = new URL(raw).searchParams;
      const v = params.get("v");
      if (v) {
        return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&controls=0&showinfo=0&loop=1&playlist=${v}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1`;
      }
    }

    // Already embed URL
    const embedIdx = raw.indexOf("youtube.com/embed/");
    if (embedIdx !== -1) {
      const idPart = raw.slice(embedIdx + "youtube.com/embed/".length).split(/[?&]/)[0];
      if (idPart) {
        return `https://www.youtube.com/embed/${idPart}?autoplay=1&mute=1&controls=0&showinfo=0&loop=1&playlist=${idPart}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default function Hero() {
  const { settings, loading } = useSiteData();
  const router = useRouter();
  const pathname = usePathname();
  const phrase1 =
    settings.hero_title_1 || "Premium media & podcast studio crafting cinematic stories for modern brands.";
  const phrase2 =
    settings.hero_title_2 || "Dubai‑based production house for creators, podcasts, and brand content.";
  const phrase3 =
    settings.hero_title_3 || "From idea to final cut – we produce, record, and amplify your vision.";
  const phrases = [phrase1, phrase2, phrase3];
  const subtitle =
    settings.hero_subtitle ||
    "ICUBE is a Dubai-based media and podcast studio helping brands, founders, and creators produce cinematic content for the region.";
  const bgType = settings.hero_bg_type || "image";
  const bgImage =
    settings.hero_bg_image_url ||
    "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?q=80&w=2070&auto=format&fit=crop";
  const bgVideo = settings.hero_bg_video_url || "";
  const youtubeEmbed = bgVideo ? getYouTubeEmbedUrl(bgVideo) : null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % phrases.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [phrases.length]);

  useEffect(() => {
    function updateScrollProgress() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll <= 0 ? 0 : Math.min(1, scrollY / maxScroll);
      setScrollProgress(progress);
    }
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  return (
    <section
      id="home"
      className="relative h-[100svh] min-h-[100svh] md:h-screen md:min-h-[100dvh] w-full flex items-center justify-center overflow-hidden pt-20 pb-24 md:pt-0 md:pb-0"
    >
      <div className="absolute inset-0 z-0 w-full h-full min-h-full">
        <div
          className={bgType === "video" && bgVideo ? "absolute inset-0 z-10" : "absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/60"}
          style={
            bgType === "video" && bgVideo
              ? {
                  background: `linear-gradient(to bottom, var(--color-icube-dark) 0%, color-mix(in srgb, var(--color-icube-dark) 85%, transparent) 12%, rgba(0,0,0,0.72) 50%, color-mix(in srgb, var(--color-icube-dark) 85%, transparent) 88%, var(--color-icube-dark) 100%)`,
                }
              : undefined
          }
        />
        {bgType === "video" && bgVideo ? (
          youtubeEmbed ? (
            <div className="absolute inset-0 overflow-hidden w-full h-full min-h-full">
              <iframe
                src={youtubeEmbed}
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{
                  width: "max(100%, 177.78vh)",
                  height: "max(100%, 56.25vw)",
                  minWidth: "100%",
                  minHeight: "100%",
                  transform: "translate(-50%, -50%) scale(1.10)",
                }}
                allow="autoplay; fullscreen; picture-in-picture"
                frameBorder="0"
                title="Hero Background Video"
              />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden w-full h-full min-h-full">
              <video
                className="absolute top-1/2 left-1/2 min-w-full min-h-full w-[130%] h-[130%] object-cover object-center opacity-35"
                style={{
                  transform: "translate(-50%, -50%) scale(1.10)",
                }}
                autoPlay
                muted
                loop
                playsInline
              >
                <source src={bgVideo} />
              </video>
            </div>
          )
        ) : (
          <img
            src={bgImage}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center opacity-60 scale-105"
            referrerPolicy="no-referrer"
            fetchPriority="high"
            decoding="async"
          />
        )}
      </div>

      <motion.div
        className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 md:px-12 w-full flex flex-col items-center text-center gap-6 sm:gap-7 md:gap-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="min-h-[3.5rem] sm:min-h-[4rem] md:mb-4 md:min-h-[7rem] flex items-center justify-center overflow-hidden">
          <h1
            className="text-4xl md:text-7xl lg:text-9xl font-display font-extrabold tracking-tight text-white leading-tight px-1 relative"
            style={{ textShadow: "0 0 32px rgba(212,175,55,0.65)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="block"
              >
                {phrases[activeIndex]}
              </motion.span>
            </AnimatePresence>
          </h1>
        </div>

        <p className="max-w-2xl text-sm md:text-base text-gray-300/90 leading-relaxed mt-1 sm:mt-0">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto mt-8 sm:mt-10 md:mt-1">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Link
              href="/#studio"
              onClick={(e) => {
                const hash = "studio";
                if (pathname === "/") {
                  e.preventDefault();
                  const el = document.getElementById(hash);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  else router.push("/#studio");
                  return;
                }
                e.preventDefault();
                sessionStorage.setItem("scrollToSection", hash);
                router.push("/");
              }}
              className="group relative w-full sm:w-auto text-center px-6 py-3.5 sm:px-8 sm:py-4 bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider rounded-xl overflow-hidden flex items-center justify-center gap-2 hover:bg-icube-gold-light transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_4px_20px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_28px_rgba(212,175,55,0.45)]"
            >
              <span className="relative z-10">Book Studio</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto flex justify-center">
            <Link
              href="/portfolio"
              className="group flex items-center justify-center gap-3 sm:gap-4 text-white hover:text-icube-gold transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] py-2"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/30 flex items-center justify-center group-hover:border-icube-gold group-hover:scale-110 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0">
                <Play size={20} className="ml-1" />
              </div>
              <span className="font-semibold uppercase tracking-wider text-sm">View Portfolio</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-xs text-gray-500 uppercase tracking-widest rotate-90 mb-8">Scroll</span>
        <div className="w-[1px] h-16 bg-white/20 relative overflow-hidden rounded-full">
          <motion.div
            className="absolute top-0 left-0 w-full bg-icube-gold rounded-full"
            initial={{ height: "0%" }}
            animate={{ height: `${scrollProgress * 100}%` }}
            transition={{ type: "tween", duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ willChange: "height" }}
          />
          <motion.div
            className="absolute left-0 top-0 w-full h-4 bg-icube-gold rounded-full"
            animate={{ y: [0, 48, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ willChange: "transform" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
