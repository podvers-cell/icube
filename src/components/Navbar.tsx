"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";
import ThemeToggleSwitch from "./ThemeToggleSwitch";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import { AnimatePresence, motion, useDragControls } from "motion/react";

const SHOW_THEME_TOGGLE = false;

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dragControls = useDragControls();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin = false } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /** On nav link click: if on home, scroll to section; if on another page, go to home with hash then home scrolls to section */
  function handleNavLinkClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setIsMobileMenuOpen(false);
    const hash = href.includes("#") ? href.split("#")[1] : null;
    const isHomeSection = href === "/" || hash === "home" || (hash && ["services", "studio", "portfolio", "testimonials", "videos", "benefits"].includes(hash));

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

  const menuRestoreRef = useRef<(() => void) | null>(null);
  const menuRestoreTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (isMobileMenuOpen) {
      if (menuRestoreTimeoutRef.current !== null) {
        window.clearTimeout(menuRestoreTimeoutRef.current);
        menuRestoreTimeoutRef.current = null;
      }
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      const prevOverflow = document.body.style.overflow;
      const prevPaddingRight = document.body.style.paddingRight;
      document.body.style.overflow = "hidden";
      if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
      const restore = () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPaddingRight;
        menuRestoreRef.current = null;
        if (menuRestoreTimeoutRef.current !== null) {
          window.clearTimeout(menuRestoreTimeoutRef.current);
          menuRestoreTimeoutRef.current = null;
        }
      };
      menuRestoreRef.current = restore;
      return () => {
        menuRestoreTimeoutRef.current = window.setTimeout(restore, 380);
      };
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Packages", href: "/packages" },
    { name: "Contact", href: "/contact" },
  ];

  /** Active when pathname matches link path (ignore hash for page-level active state). */
  const isActiveLink = (href: string) => {
    const path = href.split("#")[0] || "/";
    return pathname === path || (path === "/" && pathname === "/");
  };

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

  const isLight = theme === "light";
  const isLightNavBar = isLight && isScrolled;

  const navTextStyle = isLightNavBar ? { color: "#1c1917" } : isLight ? { color: "#ffffff" } : undefined;

  const navBgClass = isLight
    ? isScrolled
      ? "bg-[#f2f0eb]/90 border-b border-stone-300/50 md:backdrop-blur-2xl shadow-lg shadow-black/10"
      : "bg-transparent border-b border-transparent"
    : isScrolled
      ? "bg-black/25 border-b border-white/10 md:backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]"
      : "bg-transparent border-b border-transparent";

  return (
    <nav
      data-scrolled={isScrolled ? "true" : undefined}
      data-home="true"
      data-theme={theme}
      style={navTextStyle}
      className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,box-shadow] duration-200 ease-out ${navBgClass} ${isLightNavBar ? "text-stone-900" : isLight ? "text-white" : ""}`}
    >
      <div className="relative z-[60] w-full px-4 md:px-8 lg:px-10 py-2 flex items-center justify-between gap-4 md:justify-start md:gap-6">
        {/* Logo – left */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/icube-logo.svg"
            alt="ICUBE Vision TV Production"
            className={`h-14 w-auto object-contain ${isLightNavBar ? "invert" : ""}`}
          />
        </Link>

        {/* Desktop Nav – flex-1 so it shifts left when right section grows; scrolls if needed */}
        <div className="hidden md:flex flex-1 min-w-0 justify-center overflow-x-auto overflow-y-visible py-1">
          <nav className="flex items-center gap-5 lg:gap-7 shrink-0 h-full">
            {navLinks.map((link) => {
                const href = (link as { href: string }).href;
                const active = isActiveLink(href);
                return (
                  <motion.span key={link.name} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ type: "tween", duration: 0.2 }}>
                    <Link
                      href={href}
                      onClick={(e) => handleNavLinkClick(e, href)}
                      style={navTextStyle}
                      className={`nav-menu-link relative inline-block py-2 pb-2.5 whitespace-nowrap text-[11px] font-medium tracking-[0.18em] uppercase transition-colors duration-300 ${
                        isLightNavBar ? "text-stone-900 hover:text-stone-900" : isLight ? "text-white hover:text-white" : active ? "text-white" : "text-gray-200/80 hover:text-white"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.name}
                    </Link>
                  </motion.span>
                );
              })}
          </nav>
        </div>

        {/* Desktop auth / CTA + Theme toggle at far right */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {user ? (
            <>
              <span style={navTextStyle} className={`text-[11px] uppercase tracking-[0.18em] ${isLightNavBar ? "text-stone-900" : isLight ? "text-white" : "text-gray-300/90"}`}>
                Welcome <span className="text-icube-gold">{displayName}</span>
              </span>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="nav-cta-link inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-icube-gold/20 border border-icube-gold/50 text-[11px] font-semibold uppercase tracking-[0.18em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors active:scale-[0.98]"
                >
                  <LayoutDashboard size={14} className="shrink-0" />
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                style={navTextStyle}
                className={`nav-logout-btn inline-flex h-7 w-7 items-center justify-center rounded-full hover:text-icube-gold transition-colors ${isLightNavBar ? "bg-stone-200/80 border border-stone-300 text-stone-800 hover:bg-stone-300/80" : "bg-white/5 border border-white/20 hover:bg-white/15 text-gray-200"}`}
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
              <Link
                href="/#studio"
                onClick={(e) => handleNavLinkClick(e, "/#studio")}
                className="nav-cta-link px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors active:scale-[0.98]"
              >
                Book Studio
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={navTextStyle}
                className={`px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-[0.2em] transition-colors active:scale-[0.98] ${isLightNavBar ? "bg-stone-200/80 border border-stone-300 text-stone-800 hover:bg-stone-300/80 hover:text-stone-900" : "bg-white/5 border border-white/20 text-gray-50 hover:bg-white/15"}`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-full bg-icube-gold text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-dark hover:bg-icube-gold-light transition-colors shadow-[0_0_18px_rgba(212,175,55,0.45)] active:scale-[0.98]"
              >
                Sign up
              </Link>
              <Link
                href="/#studio"
                onClick={(e) => handleNavLinkClick(e, "/#studio")}
                className="nav-cta-link px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors active:scale-[0.98]"
              >
                Book Studio
              </Link>
            </>
          )}
          {SHOW_THEME_TOGGLE && (
            <ThemeToggleSwitch theme={theme} onToggle={toggleTheme} size="sm" className="shrink-0 ml-0" />
          )}
        </div>

        {/* Mobile Menu Toggle – min 44px touch target; always visible above content */}
        <button
          className={`relative z-[60] md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-icube-gold focus-visible:ring-offset-2 ${isLightNavBar ? "bg-stone-200/90 text-stone-800 focus-visible:ring-offset-[#f2f0eb] border border-stone-300/80" : "text-white focus-visible:ring-offset-icube-dark"}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
        >
          <span className="relative flex flex-col justify-center items-center w-7 h-7">
            <span
              className={`block h-[2px] w-7 rounded-full ${isLightNavBar ? "bg-stone-800" : "bg-white"} ${
                isMobileMenuOpen ? "translate-y-[3px] -rotate-45" : "-translate-y-[3px]"
              }`}
            />
            <span
              className={`block h-[2px] w-7 rounded-full ${isLightNavBar ? "bg-stone-800" : "bg-white"} ${
                isMobileMenuOpen ? "-translate-y-[3px] rotate-45" : "translate-y-[3px]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile Nav – استعادة body من onExitComplete فقط لتفادي الومضة */}
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          menuRestoreRef.current?.();
        }}
      >
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu-overlay"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="fixed inset-0 z-[50] bg-black/60 flex flex-col items-stretch justify-end pb-6 min-h-[100dvh] min-h-[100vh] md:hidden"
            aria-hidden="false"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_e, { offset, velocity }) => {
                if (offset.y > 60 || velocity.y > 200) setIsMobileMenuOpen(false);
              }}
              className="relative w-full max-h-[80vh] overflow-y-auto bg-icube-dark/70 backdrop-blur-xl border border-white/15 rounded-2xl pt-10 px-6 pb-8 shadow-[0_-8px_40px_rgba(0,0,0,0.4)] flex flex-col items-center gap-6"
            >
              {/* مقبض السحب: ابدأ السحب من هنا ثم اسحب لأسفل للإغلاق */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="absolute top-0 left-0 right-0 flex justify-center py-3 touch-none cursor-grab active:cursor-grabbing"
                aria-hidden
              >
                <span className="w-12 h-1 rounded-full bg-white/30" />
              </div>
              {SHOW_THEME_TOGGLE && (
                <ThemeToggleSwitch
                  theme={theme}
                  onToggle={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  size="md"
                  className="shrink-0"
                />
              )}
              <nav className="w-full space-y-1">
                {navLinks.map((link) => {
                  const href = (link as { href: string }).href;
                  const active = isActiveLink(href);
                  return (
                    <Link
                      key={link.name}
                      href={href}
                      onClick={(e) => {
                        handleNavLinkClick(e, href);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`relative block text-center text-sm font-display font-medium tracking-[0.24em] uppercase py-3.5 px-4 rounded-lg min-h-[44px] flex items-center justify-center transition-colors duration-150 ${
                        active ? "text-white bg-white/5" : "text-gray-200 hover:text-white hover:bg-white/5"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.name}
                    </Link>
                  );
                })}
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
                    className="nav-logout-btn inline-flex mt-1 h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/20 text-gray-200 hover:bg-white/15 hover:text-icube-gold transition-colors"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
