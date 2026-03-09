import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Studio from "./components/Studio";
import Portfolio from "./components/Portfolio";
import WhyIcube from "./components/WhyIcube";
import Booking from "./components/Booking";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function PublicSite() {
  return (
    <div className="min-h-screen bg-icube-dark text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Studio />
        <Portfolio />
        <WhyIcube />
        <Booking />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
