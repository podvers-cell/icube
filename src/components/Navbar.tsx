import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Studio", href: "#studio" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Why Us", href: "#why-us" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact", href: "#contact" },
  ];

  const displayName =
    user?.name && user.name.trim().length > 0
      ? user.name
      : user?.email
        ? user.email.split("@")[0]
        : "";

  async function handleLogout() {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch {
      // ignore for now
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/35 border-b border-white/10 backdrop-blur-2xl shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="w-full px-4 md:px-8 lg:px-10 py-2 flex items-center justify-between gap-4 relative">
        {/* Logo – left, links to home */}
        <a href="#home" className="flex items-center gap-2 z-50">
          <img
            src="/icube-logo.svg"
            alt="ICUBE Vision TV Production"
            className="h-14 w-auto object-contain"
          />
        </a>

        {/* Desktop Nav – perfectly centered */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
          <nav className="flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-[11px] font-medium text-gray-200/80 hover:text-white transition-colors tracking-[0.18em] uppercase after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-full after:bg-icube-gold after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>

        {/* Desktop auth / CTA – right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-[11px] uppercase tracking-[0.18em] text-gray-300/90">
                Welcome <span className="text-icube-gold">{displayName}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/20 text-gray-200 hover:bg-white/15 hover:text-icube-gold transition-colors"
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
              <a
                href="#booking"
                className="px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
              >
                Book Studio
              </a>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-50 hover:bg-white/15 transition-colors"
              >
                Sign in
              </a>
              <a
                href="/signup"
                className="px-4 py-1.5 rounded-full bg-icube-gold/90 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-dark hover:bg-icube-gold-light transition-colors shadow-[0_0_18px_rgba(212,175,55,0.45)]"
              >
                Sign up
              </a>
              <a
                href="#booking"
                className="px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
              >
                Book Studio
              </a>
            </>
          )}
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
                className="relative text-xl font-display font-medium text-gray-300 hover:text-white transition-colors tracking-[0.2em] uppercase after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-icube-gold after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
              >
                {link.name}
              </a>
            ))}
            {user ? (
              <>
                <span className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-300">
                  Welcome <span className="text-icube-gold">{displayName}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex mt-2 h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/20 text-gray-200 hover:bg-white/15 hover:text-icube-gold transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
                <a
                  href="#booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-8 py-3 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-[0.24em] rounded-full hover:bg-icube-gold-light"
                >
                  Book Studio
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-4 px-8 py-3 rounded-full bg-white/5 border border-white/20 text-sm font-medium tracking-[0.24em] uppercase text-gray-100 hover:bg-white/10"
                >
                  Sign in
                </a>
                <a
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-8 py-3 rounded-full bg-icube-gold text-icube-dark text-sm font-semibold tracking-[0.24em] uppercase hover:bg-icube-gold-light"
                >
                  Sign up
                </a>
                <a
                  href="#booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-8 py-3 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-[0.24em] rounded-full hover:bg-icube-gold-light"
                >
                  Book Studio
                </a>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
