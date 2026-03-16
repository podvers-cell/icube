"use client";

import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "motion/react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Studio from "./components/Studio";
import Portfolio from "./components/Portfolio";
import Testimonials from "./components/Testimonials";
import Videos from "./components/Videos";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BenefitsSection from "./components/BenefitsSection";
import SectionDivider from "./components/SectionDivider";
import AnimatedSection from "./components/AnimatedSection";
import ScrollReveal from "./components/ScrollReveal";
import { useSiteData } from "./SiteDataContext";

const WHATSAPP_URL = "https://wa.me/971589965005";
const SPLASH_STORAGE_KEY = "icube-splash-shown";

/** Only show splash on the very first visit (persisted in localStorage). */
function getInitialShowSplash(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SPLASH_STORAGE_KEY) !== "1";
}

/** Hash from URL (works in both Vite and Next.js; no react-router dependency). */
function useHash() {
  const [hash, setHash] = useState(
    typeof window !== "undefined" ? window.location.hash : ""
  );
  useEffect(() => {
    setHash(window.location.hash);
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
}

export default function PublicSite() {
  const { loading, error, refresh } = useSiteData();
  const hash = useHash();
  const [showSplash, setShowSplash] = useState(true);
  const [splashChecked, setSplashChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const onHeroReady = useCallback(() => setHeroReady(true), []);

  // Before paint: if user already saw splash in a previous visit, don't show it (navigation/return)
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!getInitialShowSplash()) setShowSplash(false);
    }
    setSplashChecked(true);
  }, []);

  // Animate progress bar while data is loading (only when splash is actually shown)
  useEffect(() => {
    if (!showSplash || !splashChecked) return;
    let timer: number | undefined;
    if (loading) {
      const tick = () => {
        setProgress((prev) => {
          if (prev >= 88) return prev;
          const next = prev + (88 - prev) * 0.08;
          return next;
        });
        timer = window.setTimeout(tick, 120);
      };
      tick();
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loading, showSplash, splashChecked]);

  // When data and hero (including video) are ready, finish bar and hide splash (first visit only)
  useEffect(() => {
    if (!showSplash || !splashChecked) return;
    if (!loading && heroReady) {
      setProgress(100);
      const timeout = window.setTimeout(() => {
        setShowSplash(false);
        try {
          localStorage.setItem(SPLASH_STORAGE_KEY, "1");
        } catch {
          // ignore
        }
      }, 400);
      return () => window.clearTimeout(timeout);
    }
  }, [loading, heroReady, showSplash, splashChecked]);

  // When coming from another page (e.g. portfolio) and clicking studio: scroll to section after home loads
  useEffect(() => {
    const fromStorage = typeof window !== "undefined" ? sessionStorage.getItem("scrollToSection") : null;
    if (!fromStorage) return;
    sessionStorage.removeItem("scrollToSection");
    const t = setTimeout(() => {
      const el = document.getElementById(fromStorage);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const raw = hash.replace(/^#/, "");
    if (!raw) return;
    const id = raw === "contact" ? "contact" : raw;
    const el = document.getElementById(id);
    if (el) {
      const t = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(t);
    }
  }, [hash]);

  // Back to top visibility – throttled to avoid re-renders on every scroll (mobile performance)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowBackToTop(window.scrollY > 500);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mainContent = (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark/95 via-icube-gray/90 to-[#0f1219] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      {/* Glowing background orbs – desktop only; blur is very expensive on mobile GPU */}
      <div
        className="site-glows pointer-events-none fixed inset-0 z-0 overflow-hidden hidden md:block"
        aria-hidden
      >
        <div className="absolute top-0 left-1/4 w-[80vmax] h-[80vmax] -translate-x-1/2 -translate-y-1/3 rounded-full bg-icube-gold/12 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[60vmax] h-[60vmax] translate-x-1/3 -translate-y-1/4 rounded-full bg-icube-gold/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[70vmax] h-[70vmax] -translate-x-1/4 translate-y-1/4 rounded-full bg-purple-500/10 blur-[110px]" />
        <div className="absolute bottom-0 right-1/3 w-[50vmax] h-[50vmax] translate-y-1/3 rounded-full bg-blue-500/10 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 w-[40vmax] h-[40vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-icube-gold/06 blur-[80px]" />
      </div>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-icube-gold px-4 py-2 text-sm font-semibold text-icube-dark shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-icube-dark focus:ring-offset-2 focus:ring-offset-icube-dark"
      >
        Skip to main content
      </a>
      <Navbar />
      {error && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-red-900/90 backdrop-blur-sm border-b border-red-500/30 px-4 py-3 text-sm">
          <span className="text-red-100">Failed to load content. {error}</span>
          <button
            type="button"
            onClick={() => refresh()}
            className="shrink-0 px-4 py-2 rounded-lg bg-white/20 text-white font-medium hover:bg-white/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      <main id="main-content" className="relative z-10">
        <AnimatedSection delay={0} y={24}>
          <Hero onHeroReady={onHeroReady} />
        </AnimatedSection>
        <SectionDivider />
        <ScrollReveal variant="fadeUpScale" amount={0.1}>
          <Services />
        </ScrollReveal>
        <SectionDivider />
        <ScrollReveal variant="revealLeft" amount={0.12}>
          <Studio />
        </ScrollReveal>
        <SectionDivider />
        <ScrollReveal variant="fadeUp" amount={0.08}>
          <Portfolio limit={6} showFullPortfolioLink useSelectedWorkOnly />
        </ScrollReveal>
        <SectionDivider />
        <ScrollReveal variant="fadeUp" amount={0.12}>
          <BenefitsSection />
        </ScrollReveal>
        <SectionDivider />
        <ScrollReveal variant="fadeIn" amount={0.15}>
          <Testimonials />
        </ScrollReveal>
        <SectionDivider />
        <ScrollReveal variant="revealRight" amount={0.1}>
          <Videos />
        </ScrollReveal>
        <SectionDivider />
        <ScrollReveal variant="fadeUp" amount={0.12}>
          <Contact />
        </ScrollReveal>
      </main>
      <AnimatedSection className="relative z-10">
        <Footer />
      </AnimatedSection>

      {/* Back to top – above WhatsApp on mobile to avoid overlap */}
      {showBackToTop && (
        <motion.a
          href="#home"
          className="fixed bottom-32 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-icube-gold text-icube-dark shadow-lg hover:bg-icube-gold-light focus:outline-none hover:shadow-[0_6px_24px_rgba(212,175,55,0.5)] sm:bottom-36"
          aria-label="Back to top"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "tween", duration: 0.2 }}
        >
          <ArrowUp size={20} />
        </motion.a>
      )}

      {/* WhatsApp floating widget */}
      <div className="fixed bottom-14 right-4 z-40 flex flex-col items-end">
        <div className="relative inline-block">
          <span className="absolute top-0 right-0 z-10 flex h-5 w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-[#e53935] text-[10px] font-bold text-white shadow-md" aria-hidden>
            1
          </span>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-14 w-14 shrink-0 items-center overflow-hidden rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-[width,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1ebe5d] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] md:hover:w-[280px]"
            aria-label="Any questions? Ask in WhatsApp"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:scale-110">
              <svg
                className="h-6 w-6 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:max-w-[220px] md:group-hover:opacity-100 md:group-hover:pl-2 md:group-hover:pr-4">
              Any questions? Ask in WhatsApp
            </span>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mainContent}
      {showSplash && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-icube-dark text-white overflow-hidden">
          <div className="relative flex flex-col items-center gap-8">
            <div className="absolute inset-0 blur-3xl bg-icube-gold/15 rounded-full scale-150 pointer-events-none" aria-hidden />
            <motion.img
              src="/icube-logo.svg"
              alt="ICUBE Media Studio"
              className="relative h-24 w-auto drop-shadow-[0_0_24px_rgba(201,162,39,0.15)]"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.8 }}
            />
            <div className="relative w-56 h-0.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-icube-gold/80 to-icube-gold"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
                style={{ maxWidth: "100%" }}
              />
            </div>
            <p className="relative text-xs text-gray-500 uppercase tracking-[0.2em] font-medium" aria-live="polite">
              {loading ? "Loading…" : "Preparing…"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
