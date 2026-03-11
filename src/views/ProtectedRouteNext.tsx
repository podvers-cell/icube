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
      <div className="min-h-screen bg-icube-dark flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
