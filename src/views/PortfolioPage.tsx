import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Portfolio from "../components/Portfolio";
import { ContactModalProvider } from "../ContactModalContext";

export default function PortfolioPage() {
  return (
    <ContactModalProvider>
      <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
        <Navbar />
        <main id="main-content">
          <Portfolio sectionLabel="Our work" title="Our work" showFullPortfolioLink={false} />
        </main>
        <Footer />
      </div>
    </ContactModalProvider>
  );
}
