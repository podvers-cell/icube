import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Studio from "./components/Studio";
import Portfolio from "./components/Portfolio";
import WhyIcube from "./components/WhyIcube";
import Booking from "./components/Booking";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { useSiteData } from "./SiteDataContext";

export default function PublicSite() {
  const { loading } = useSiteData();
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);

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

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-icube-dark text-white">
        <div className="relative flex flex-col items-center gap-6">
          <div className="absolute inset-0 blur-3xl bg-icube-gold/20 rounded-full scale-125" />
          <div className="relative flex items-center justify-center rounded-2xl bg-black/40 border border-white/10 p-6">
            <img
              src="/icube-logo.svg"
              alt="ICUBE Media Studio"
              className="h-20 w-auto animate-pulse"
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
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Studio />
        <Portfolio />
        <WhyIcube />
        <Booking />
        <Testimonials />
        <Contact />
      </main>
      <Footer />

      {/* WhatsApp floating icon */}
      <a
        href="https://wa.me/971548886318"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:bg-[#1ebe5d] transition-colors"
        aria-label="Chat on WhatsApp"
      >
        <img
          src="/whatsapp-icon.png"
          alt="WhatsApp"
          className="h-9 w-9 rounded-full"
        />
      </a>
    </div>
  );
}
