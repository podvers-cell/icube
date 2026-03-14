"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Booking from "../components/Booking";

export default function PackagesPage() {
  return (
    <div className="site-wrapper relative min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray/95 to-[#0d0f18] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-[15%] left-[10%] w-[min(70vw,500px)] h-[min(70vw,500px)] rounded-full bg-icube-gold/12 blur-[120px] glow-orb-pulse" />
        <div className="absolute top-[50%] right-[5%] w-[min(50vw,380px)] h-[min(50vw,380px)] rounded-full bg-white/[0.05] blur-[100px] glow-orb-pulse-slow" />
        <div className="absolute bottom-[20%] left-[20%] w-[min(40vw,300px)] h-[min(40vw,300px)] rounded-full bg-icube-gold/8 blur-[80px]" />
      </div>
      <Navbar />
      <main id="main-content" className="relative z-10">
        <Booking />
      </main>
      <Footer />
    </div>
  );
}
