"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link?.href) return;
      try {
        const url = new URL(link.href);
        if (url.origin !== window.location.origin) return;
        const path = url.pathname + url.search;
        if (path === window.location.pathname + window.location.search) return;
        if (path.startsWith("/")) setLoading(true);
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isMobile]);

  if (!isMobile || !loading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[2147483646] h-1 bg-white/10 overflow-hidden"
      role="progressbar"
      aria-label="Loading"
      aria-valuetext="Loading page"
    >
      <div
        className="h-full w-1/3 bg-icube-gold rounded-r-full"
        style={{
          boxShadow: "0 0 12px rgba(212,175,55,0.6)",
          animation: "navigation-loading 1.2s ease-in-out infinite",
        }}
      />
    </div>
  );
}
