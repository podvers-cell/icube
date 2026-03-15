"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Booking from "../components/Booking";

export default function PackagesPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark/95 via-icube-gray/90 to-[#0f1219] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300 relative">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/4 w-[80vmax] h-[80vmax] -translate-x-1/2 -translate-y-1/3 rounded-full bg-icube-gold/12 blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[70vmax] h-[70vmax] -translate-x-1/4 translate-y-1/4 rounded-full bg-purple-500/10 blur-[110px]" />
        <div className="absolute bottom-0 right-1/3 w-[50vmax] h-[50vmax] translate-y-1/3 rounded-full bg-blue-500/10 blur-[90px]" />
      </div>
      <Navbar />
      <main id="main-content" className="relative z-10">
        <Booking />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
