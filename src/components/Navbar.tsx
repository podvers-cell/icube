"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../AuthContext";
import { AnimatePresence, motion } from "motion/react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin = false } = useAuth();

  /** On nav link click: if on home, scroll to section; if on another page, go to home with hash then home scrolls to section */
  function handleNavLinkClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setIsMobileMenuOpen(false);
    const hash = href.includes("#") ? href.split("#")[1] : null;
    const isHomeSection = href === "/" || hash === "home" || (hash && ["services", "studio", "why-us", "portfolio", "testimonials", "videos", "benefits"].includes(hash));

    if (pathname === "/") {
      if (href === "/" || hash === "home") {
        e.preventDefault();
        document.getElementById("home")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (hash) {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else router.push(href);
      }
      return;
    }

    if (isHomeSection) {
      e.preventDefault();
      if (hash) sessionStorage.setItem("scrollToSection", hash);
      else sessionStorage.removeItem("scrollToSection");
      router.push("/");
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open so menu stays centered in viewport
  useEffect(() => {
    if (isMobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Studio", href: "/#studio" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Packages", href: "/packages" },
    { name: "Contact", href: "/contact" },
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
      router.replace("/");
    } catch {
      // ignore for now
    }
  }

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isScrolled
          ? "bg-black/35 border-b border-white/10 backdrop-blur-2xl shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="w-full px-4 md:px-8 lg:px-10 py-2 flex items-center justify-between gap-4 md:justify-start md:gap-6">
        {/* Logo – left */}
        <Link href="/" className="flex items-center gap-2 z-50 shrink-0">
          <img
            src="/icube-logo.svg"
            alt="ICUBE Vision TV Production"
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav – flex-1 so it shifts left when right section grows; scrolls if needed */}
        <div className="hidden md:flex flex-1 min-w-0 justify-center overflow-x-auto overflow-y-visible py-1">
          <nav className="flex items-center gap-5 lg:gap-7 shrink-0 h-full">
            {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={(link as { href: string }).href}
                  onClick={(e) => handleNavLinkClick(e, (link as { href: string }).href)}
                  className="relative inline-block py-2 pb-2.5 whitespace-nowrap text-[11px] font-medium text-gray-200/80 hover:text-white tracking-[0.18em] uppercase transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-icube-gold after:scale-x-0 after:origin-left after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:after:scale-x-100"
                >
                  {link.name}
                </Link>
              ))}
          </nav>
        </div>

        {/* Desktop auth / CTA – right, never shrinks */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {user ? (
            <>
              <span className="text-[11px] uppercase tracking-[0.18em] text-gray-300/90">
                Welcome <span className="text-icube-gold">{displayName}</span>
              </span>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-icube-gold/20 border border-icube-gold/50 text-[11px] font-semibold uppercase tracking-[0.18em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors active:scale-[0.98]"
                >
                  <LayoutDashboard size={14} className="shrink-0" />
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/20 text-gray-200 hover:bg-white/15 hover:text-icube-gold transition-colors"
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
              <Link
                href="/#studio"
                onClick={(e) => handleNavLinkClick(e, "/#studio")}
                className="px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors active:scale-[0.98]"
              >
                Book Studio
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-50 hover:bg-white/15 transition-colors active:scale-[0.98]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-full bg-icube-gold/90 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-dark hover:bg-icube-gold-light transition-colors shadow-[0_0_18px_rgba(212,175,55,0.45)] active:scale-[0.98]"
              >
                Sign up
              </Link>
              <Link
                href="/#studio"
                onClick={(e) => handleNavLinkClick(e, "/#studio")}
                className="px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors active:scale-[0.98]"
              >
                Book Studio
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden z-50 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
        >
          <span className="relative flex flex-col justify-center items-center w-7 h-7">
            <span
              className={`block h-[2px] w-7 rounded-full bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "translate-y-[3px] -rotate-45" : "-translate-y-[3px]"
              }`}
            />
            <span
              className={`block h-[2px] w-7 rounded-full bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "-translate-y-[3px] rotate-45" : "translate-y-[3px]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile Nav – fixed overlay so menu is always centered in viewport at any scroll position */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ transformOrigin: "center center" }}
            className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-icube-dark/95 backdrop-blur-2xl flex flex-col items-center justify-center px-8 min-h-[100dvh] min-h-[100vh] md:hidden"
          >
            <div className="w-full max-w-sm bg-black/40 border border-white/10 rounded-3xl px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.85)] flex flex-col items-center gap-6">
              <nav className="w-full space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={(link as { href: string }).href}
                    onClick={(e) => {
                      handleNavLinkClick(e, (link as { href: string }).href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="relative block text-center text-sm font-display font-medium text-gray-200 hover:text-white tracking-[0.24em] uppercase py-2 transition-colors after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-10 after:-translate-x-1/2 after:bg-icube-gold after:scale-x-0 hover:after:scale-x-100 after:origin-center after:transition-transform after:duration-300"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="w-full h-px bg-white/10" />

              {user ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-gray-300">
                    Welcome <span className="text-icube-gold">{displayName}</span>
                  </span>
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-icube-gold/20 border border-icube-gold/50 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
                    >
                      <LayoutDashboard size={16} className="shrink-0" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="inline-flex mt-1 h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/20 text-gray-200 hover:bg-white/15 hover:text-icube-gold transition-colors"
                    aria-label="Log out"
                  >
                    <LogOut size={16} />
                  </button>
                  <Link
                    href="/#studio"
                    onClick={(e) => {
                      handleNavLinkClick(e, "/#studio");
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-2 px-8 py-3 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-[0.24em] rounded-full hover:bg-icube-gold-light transition-colors w-full text-center"
                  >
                    Book Studio
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 w-full">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-8 py-3 rounded-full bg-white/5 border border-white/20 text-sm font-medium tracking-[0.24em] uppercase text-gray-100 hover:bg-white/10 text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-8 py-3 rounded-full bg-icube-gold text-icube-dark text-sm font-semibold tracking-[0.24em] uppercase hover:bg-icube-gold-light text-center"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/#studio"
                    onClick={(e) => {
                      handleNavLinkClick(e, "/#studio");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-8 py-3 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-[0.24em] rounded-full hover:bg-icube-gold-light text-center"
                  >
                    Book Studio
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
