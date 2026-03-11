"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "motion/react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Studio from "./components/Studio";
import Portfolio from "./components/Portfolio";
import WhyIcube from "./components/WhyIcube";
import Testimonials from "./components/Testimonials";
import Videos from "./components/Videos";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BenefitsSection from "./components/BenefitsSection";
import SectionDivider from "./components/SectionDivider";
import AnimatedSection from "./components/AnimatedSection";
import { useSiteData } from "./SiteDataContext";

const WHATSAPP_URL = "https://wa.me/971548886318";

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
  const { loading } = useSiteData();
  const hash = useHash();
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showWhatsAppBubble, setShowWhatsAppBubble] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Animate progress bar while data is loading
  useEffect(() => {
    if (!showSplash) return;
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
  }, [loading, showSplash]);

  // When loading completes, finish bar and hide splash
  useEffect(() => {
    if (!loading) {
      setProgress(100);
      const timeout = window.setTimeout(() => setShowSplash(false), 300);
      return () => window.clearTimeout(timeout);
    }
  }, [loading]);

  // عند القدوم من صفحة أخرى (مثل portfolio) والضغط على استديو: التمرير المباشر للقسم بعد تحميل الهوم
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

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-icube-dark text-white">
        <div className="relative flex flex-col items-center gap-6">
          <div className="absolute inset-0 blur-3xl bg-icube-gold/20 rounded-full scale-125" />
          <div className="relative flex items-center justify-center rounded-2xl bg-black/40 border border-white/10 p-6">
            <img
              src="/icube-logo.svg"
              alt="ICUBE Media Studio"
              className="h-20 w-auto"
            />
          </div>
          <div className="relative mt-4 w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-icube-gold transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="relative text-[11px] text-gray-400 uppercase tracking-[0.16em]">
            Loading experience…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-icube-gold px-4 py-2 text-sm font-semibold text-icube-dark shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-icube-dark focus:ring-offset-2 focus:ring-offset-icube-dark"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <AnimatedSection>
          <Hero />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <Services />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <Studio />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <Portfolio limit={6} showFullPortfolioLink />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <WhyIcube />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <BenefitsSection />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <Testimonials />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <Videos />
        </AnimatedSection>
        <SectionDivider />
        <AnimatedSection>
          <Contact />
        </AnimatedSection>
      </main>
      <AnimatedSection>
        <Footer />
      </AnimatedSection>

      {/* Back to top – appears on scroll */}
      {showBackToTop && (
        <motion.a
          href="#home"
          className="fixed bottom-36 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-icube-gold text-icube-dark shadow-lg hover:bg-icube-gold-light focus:outline-none hover:shadow-[0_6px_24px_rgba(212,175,55,0.5)]"
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
            className="group inline-flex h-14 w-14 shrink-0 items-center overflow-hidden rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-[width,background-color] duration-300 ease-out hover:bg-[#1ebe5d] md:hover:w-[280px]"
            aria-label="Any questions? Ask in WhatsApp"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center">
              <svg
                className="h-6 w-6 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-[max-width,opacity] duration-300 ease-out md:group-hover:max-w-[220px] md:group-hover:opacity-100 md:group-hover:pl-2 md:group-hover:pr-4">
              Any questions? Ask in Whatsapp
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
