"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Contact from "../components/Contact";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main id="main-content">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
