"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";
import { useSiteData } from "@/SiteDataContext";
import { useAuth } from "@/AuthContext";

function isMaintenanceEnabled(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { settings } = useSiteData();
  const { isAdmin, loading } = useAuth();

  const enabled = useMemo(() => isMaintenanceEnabled(settings?.maintenance_mode), [settings]);
  const message =
    (typeof settings?.maintenance_message === "string" && settings.maintenance_message.trim()) ||
    "We’re currently performing scheduled maintenance. Please check back shortly.";

  const allow =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    (!loading && isAdmin);

  if (!enabled || allow) return children;

  return (
    <div className="min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray/90 to-icube-dark text-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <style>{`
        @keyframes move-left-to-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(180px); }
        }
        @keyframes move-right-to-left {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-180px); }
        }
        .bg-ball-1 { animation: move-left-to-right 24s ease-in-out infinite; }
        .bg-ball-2 { animation: move-right-to-left 22s ease-in-out infinite; }
      `}</style>

      {/* Two yellow balls moving inside the screen, under the glass */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[35%] left-[20%] w-40 h-40 md:w-52 md:h-52 rounded-full bg-icube-gold/35 blur-3xl bg-ball-1" aria-hidden />
        <div className="absolute top-[55%] right-[22%] w-32 h-32 md:w-44 md:h-44 rounded-full bg-icube-gold/30 blur-3xl bg-ball-2" aria-hidden />
      </div>

      {/* Glass overlay - frosted layer so balls look behind glass */}
      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[2px] pointer-events-none" aria-hidden />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(212,175,55,0.06),transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-lg flex flex-col items-center text-center z-10">
        <div className="w-20 h-20 rounded-full bg-icube-gold/15 border border-icube-gold/30 flex items-center justify-center mb-8 shadow-[0_0_32px_rgba(212,175,55,0.2)]">
          <Wrench className="text-icube-gold" size={36} strokeWidth={1.8} aria-hidden />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-3">
          Website under maintenance
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <Link
        href="/login?from=/dashboard"
        className="fixed bottom-6 right-6 inline-flex items-center justify-center px-5 py-3 rounded-full bg-white/10 border border-white/20 text-gray-100 text-sm font-medium backdrop-blur-md hover:bg-white/15 hover:border-icube-gold/50 hover:text-icube-gold transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      >
        Admin login
      </Link>
    </div>
  );
}

