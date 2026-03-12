"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../AuthContext";

export default function ProtectedRouteNext({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirectTo = pathname && pathname.startsWith("/dashboard") ? pathname : "/dashboard";
      router.replace("/login?from=" + encodeURIComponent(redirectTo));
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-icube-dark flex flex-col items-center justify-center gap-6" aria-busy="true" aria-live="polite" aria-labelledby="dashboard-loading-label">
        <img src="/icube-logo.svg" alt="" className="h-12 w-auto opacity-90" aria-hidden />
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-icube-gold/30 border-t-icube-gold animate-spin" aria-hidden />
          <p className="text-gray-400 text-sm" id="dashboard-loading-label">Loading…</p>
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
