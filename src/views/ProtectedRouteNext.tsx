"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

export default function ProtectedRouteNext({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?from=" + encodeURIComponent("/dashboard"));
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

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
