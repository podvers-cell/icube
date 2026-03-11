"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin = false } = useAuth();

  /** عند الضغط على رابط: إن كنا على الهوم نمرّر للقسم مباشرة؛ وإن كنا على صفحة أخرى نروح للهوم مع الهاش (بدون إعادة تحميل) ثم الصفحة الرئيسية تتمرّر للقسم */
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
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-icube-gold/20 border border-icube-gold/50 text-[11px] font-semibold uppercase tracking-[0.18em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
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
                className="px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
              >
                Book Studio
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-50 hover:bg-white/15 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-full bg-icube-gold/90 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-dark hover:bg-icube-gold-light transition-colors shadow-[0_0_18px_rgba(212,175,55,0.45)]"
              >
                Sign up
              </Link>
              <Link
                href="/#studio"
                className="px-4 py-1.5 rounded-full border border-icube-gold/70 text-[11px] font-semibold uppercase tracking-[0.22em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
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
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
          <div className="absolute top-0 left-0 right-0 h-screen bg-icube-dark/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
            {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={(link as { href: string }).href}
                  onClick={(e) => handleNavLinkClick(e, (link as { href: string }).href)}
                  className="relative text-xl font-display font-medium text-gray-300 hover:text-white transition-colors tracking-[0.2em] uppercase after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-icube-gold after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
                >
                  {link.name}
                </Link>
              ))}
            {user ? (
              <>
                <span className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-300">
                  Welcome <span className="text-icube-gold">{displayName}</span>
                </span>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-icube-gold/20 border border-icube-gold/50 text-xs font-semibold uppercase tracking-[0.2em] text-icube-gold hover:bg-icube-gold hover:text-icube-dark transition-colors"
                  >
                    <LayoutDashboard size={16} className="shrink-0" />
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex mt-2 h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/20 text-gray-200 hover:bg-white/15 hover:text-icube-gold transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
                <Link
                  href="/#studio"
                  onClick={(e) => { handleNavLinkClick(e, "/#studio"); setIsMobileMenuOpen(false); }}
                  className="px-8 py-3 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-[0.24em] rounded-full hover:bg-icube-gold-light"
                >
                  Book Studio
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-4 px-8 py-3 rounded-full bg-white/5 border border-white/20 text-sm font-medium tracking-[0.24em] uppercase text-gray-100 hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-8 py-3 rounded-full bg-icube-gold text-icube-dark text-sm font-semibold tracking-[0.24em] uppercase hover:bg-icube-gold-light"
                >
                  Sign up
                </Link>
                <Link
                  href="/#studio"
                  onClick={(e) => { handleNavLinkClick(e, "/#studio"); setIsMobileMenuOpen(false); }}
                  className="px-8 py-3 bg-icube-gold text-icube-dark text-sm font-semibold uppercase tracking-[0.24em] rounded-full hover:bg-icube-gold-light"
                >
                  Book Studio
                </Link>
              </>
            )}
          </div>
        )}
    </nav>
  );
}
