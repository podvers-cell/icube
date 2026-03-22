"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactPageContent from "../components/ContactPageContent";

export default function ContactPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main id="main-content" className="pt-20 md:pt-24">
        <ContactPageContent />
      </main>
      <Footer />
    </div>
  );
}
