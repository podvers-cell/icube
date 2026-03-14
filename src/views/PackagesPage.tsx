"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Booking from "../components/Booking";

export default function PackagesPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main id="main-content">
        <Booking />
      </main>
      <Footer />
    </div>
  );
}
