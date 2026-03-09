import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "Studio", href: "#studio" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Why Us", href: "#why-us" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-icube-dark/90 backdrop-blur-md py-3 shadow-lg"
          : "bg-transparent py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 z-50">
          <img
            src="/icube-logo.svg"
            alt="ICUBE Vision TV Production"
            className="h-14 w-auto object-contain"
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors tracking-wide uppercase"
            >
              {link.name}
            </a>
          ))}
          <a
            href="/dashboard"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors tracking-wide uppercase"
          >
            Dashboard
          </a>
          <a
            href="#booking"
            className="px-6 py-2.5 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-wider rounded-sm hover:bg-icube-gold-light transition-colors"
          >
            Book Studio
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden z-50 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 h-screen bg-icube-dark/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-display font-medium text-gray-300 hover:text-white transition-colors tracking-wide uppercase"
              >
                {link.name}
              </a>
            ))}
            <a href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-display font-medium text-gray-300 hover:text-white transition-colors tracking-wide uppercase">
              Dashboard
            </a>
            <a
              href="#booking"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-4 px-8 py-4 bg-icube-gold text-icube-dark text-lg font-semibold uppercase tracking-wider rounded-sm hover:bg-icube-gold-light"
            >
              Book Studio
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
