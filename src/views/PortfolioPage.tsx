"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Portfolio from "../components/Portfolio";

export default function PortfolioPage() {
  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark transition-colors duration-300">
      <Navbar />
      <main id="main-content" className="pt-20 md:pt-24">
        <Portfolio
          isStandalonePage
          sectionLabel=""
          title="Portfolio"
          subtitle="A selection of our best work across various industries."
          showFullPortfolioLink={false}
        />
      </main>
      <Footer />
    </div>
  );
}
