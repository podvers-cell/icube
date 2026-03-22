"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Booking from "../components/Booking";

export default function PackagesPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main id="main-content" className="pt-20 md:pt-24">
        <Booking />
      </main>
      <Footer />
    </div>
  );
}
