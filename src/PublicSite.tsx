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
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark/95 via-icube-gray/90 to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      {/* Glowing background orbs – desktop only; blur is very expensive on mobile GPU */}
      <div
        className="site-glows pointer-events-none fixed inset-0 z-0 overflow-hidden hidden md:block"
        aria-hidden
      >
        <div className="absolute top-0 left-1/4 w-[80vmax] h-[80vmax] -translate-x-1/2 -translate-y-1/3 rounded-full bg-icube-gold/12 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[60vmax] h-[60vmax] translate-x-1/3 -translate-y-1/4 rounded-full bg-icube-gold/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[70vmax] h-[70vmax] -translate-x-1/4 translate-y-1/4 rounded-full bg-icube-gray/10 blur-[110px]" />
        <div className="absolute bottom-0 right-1/3 w-[50vmax] h-[50vmax] translate-y-1/3 rounded-full bg-icube-gray/10 blur-[90px]" />
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
