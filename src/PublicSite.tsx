"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
const SESSION_LOADED_KEY = "icube-session-loaded";

/** Show splash only on first load in this session; not when navigating between pages. */
function shouldShowSplashOnMount(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_LOADED_KEY) !== "1";
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
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [showWhatsAppBubble, setShowWhatsAppBubble] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const onHeroReady = useCallback(() => setHeroReady(true), []);

  // After client mount: read session so we don't show splash when navigating between pages
  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_LOADED_KEY) === "1") {
      setShowSplash(false);
    }
  }, []);

  // Progress bar: animate only after mount (avoids hydration issues that can freeze at 0%)
  useEffect(() => {
    if (!mounted || !showSplash) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return Math.min(90, prev + (90 - prev) * 0.06);
      });
    }, 80);
    return () => clearInterval(timer);
  }, [mounted, showSplash]);

  // When data and hero are ready: complete bar, mark session as loaded, then hide splash
  useEffect(() => {
    if (!mounted || !showSplash) return;
    if (!loading && heroReady) {
      setProgress(100);
      const timeout = window.setTimeout(() => {
        try {
          sessionStorage.setItem(SESSION_LOADED_KEY, "1");
        } catch {
          // ignore
        }
        setShowSplash(false);
      }, 350);
      return () => window.clearTimeout(timeout);
    }
  }, [mounted, loading, heroReady, showSplash]);

  // Fallback: if data is ready but Hero didn't call onHeroReady within 2s, hide splash anyway
  useEffect(() => {
    if (!mounted || !showSplash || loading) return;
    const fallback = window.setTimeout(() => {
      setProgress(100);
      try {
        sessionStorage.setItem(SESSION_LOADED_KEY, "1");
      } catch {
        // ignore
      }
      setShowSplash(false);
    }, 2000);
    return () => window.clearTimeout(fallback);
  }, [mounted, showSplash, loading]);

  // Fallback: never block more than 8s (e.g. network error)
  useEffect(() => {
    if (!mounted || !showSplash) return;
    const maxWait = window.setTimeout(() => {
      setProgress(100);
      try {
        sessionStorage.setItem(SESSION_LOADED_KEY, "1");
      } catch {
        // ignore
      }
      setShowSplash(false);
    }, 8000);
    return () => window.clearTimeout(maxWait);
  }, [mounted, showSplash]);

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

  // Back to top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mainContent = (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
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
      <main id="main-content">
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
      <AnimatedSection>
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

      {/* WhatsApp floating widget – compact bubble + pill */}
      <div className="fixed bottom-14 right-4 z-40 flex flex-col items-end gap-0">
        {showWhatsAppBubble && (
          <div className="relative mb-4 opacity-100 transition-all duration-300">
            <div className="w-56 rounded-xl bg-white text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] p-3 relative">
              <button
                type="button"
                onClick={() => setShowWhatsAppBubble(false)}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
                aria-label="Close"
              >
                ×
              </button>
              <div className="flex gap-2 pr-5">
                <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                  <img
                    src="/icube-logo.svg"
                    alt=""
                    className="w-6 h-6 object-contain"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm">Adam</p>
                  <p className="text-xs text-gray-600">Client Assets</p>
                  <p className="text-xs text-gray-700 mt-1">Hi there, I'm Adam. How can I help with your assets? 😊</p>
                </div>
              </div>
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"
                aria-hidden
              />
            </div>
          </div>
        )}
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
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center text-white overflow-hidden"
          initial={false}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }}
        >
          {/* Dark gradient background with subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-icube-dark to-[#050506]" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.08)_0%,transparent_50%)]" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_100%,rgba(0,0,0,0.6)_0%,transparent_50%)]" aria-hidden />

          {/* Animated gold orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-icube-gold/10 blur-[80px]"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-icube-gold/8 blur-[60px]"
              animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center gap-12 w-full max-w-md px-8">
            {/* Logo with cinematic reveal */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.img
                src="/icube-logo.svg"
                alt="ICUBE Media Studio"
                className="relative h-32 w-auto drop-shadow-[0_0_40px_rgba(212,175,55,0.25)]"
                animate={{
                  filter: [
                    "drop-shadow(0 0 40px rgba(212,175,55,0.25))",
                    "drop-shadow(0 0 56px rgba(212,175,55,0.35))",
                    "drop-shadow(0 0 40px rgba(212,175,55,0.25))",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute -inset-4 bg-icube-gold/5 rounded-full blur-2xl -z-10" aria-hidden />
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="relative text-xs uppercase tracking-[0.35em] text-gray-500 font-medium"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Premium Media & Production
            </motion.p>

            {/* Creative progress: line that "draws" with glow */}
            <div className="relative w-full max-w-xs">
              <div className="h-px w-full rounded-full bg-white/5 overflow-visible" aria-hidden />
              <motion.div
                className="absolute left-0 top-0 h-[2px] rounded-full bg-gradient-to-r from-icube-gold/70 via-icube-gold to-icube-gold/70 shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
                style={{ maxWidth: "100%", boxShadow: "0 0 20px rgba(212,175,55,0.4)" }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-icube-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                style={{ left: `${Math.min(progress, 100)}%`, marginLeft: -3 }}
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <p className="mt-4 text-center text-[11px] text-gray-500 uppercase tracking-[0.2em] font-medium" aria-live="polite">
                {loading ? "Loading experience…" : heroReady ? "Ready" : "Preparing…"} <span className="text-icube-gold/90">{Math.round(progress)}%</span>
              </p>
            </div>

            {/* Minimal film strip accent */}
            <motion.div
              className="absolute bottom-8 left-0 right-0 flex justify-center gap-1 opacity-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.6 }}
              aria-hidden
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-8 rounded-sm bg-icube-gold/40"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
