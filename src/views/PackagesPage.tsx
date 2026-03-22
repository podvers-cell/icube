"use client";

import { Suspense } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Booking from "../components/Booking";

export default function PackagesPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main id="main-content" className="pt-20 md:pt-24">
        {/* useSearchParams in Booking requires Suspense for static generation / build */}
        <Suspense fallback={<div className="min-h-[50vh] animate-pulse rounded-2xl bg-white/[0.03] mx-6 md:mx-12 max-w-7xl" aria-hidden />}>
          <Booking />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
