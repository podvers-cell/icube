import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Booking from "../components/Booking";
import { ContactModalProvider } from "../ContactModalContext";

export default function PackagesPage() {
  return (
    <ContactModalProvider>
      <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
        <Navbar />
        <main id="main-content">
          <Booking />
        </main>
        <Footer />
      </div>
    </ContactModalProvider>
  );
}
