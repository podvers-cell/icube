"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import {
  Settings,
  LayoutGrid,
  Image,
  MessageSquare,
  Package,
  Calendar,
  Mail,
  Sparkles,
  Video,
  LogOut,
  Home,
  Building2,
} from "lucide-react";
import { getSiteSettings } from "../api";

const nav = [
  { href: "/dashboard", end: true, label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/settings", end: false, label: "Site Settings", icon: Settings },
  { href: "/dashboard/hero", end: false, label: "Hero", icon: Image },
  { href: "/dashboard/services", end: false, label: "Services", icon: LayoutGrid },
  { href: "/dashboard/portfolio", end: false, label: "Portfolio", icon: Image },
  { href: "/dashboard/testimonials", end: false, label: "Testimonials", icon: MessageSquare },
  { href: "/dashboard/packages", end: false, label: "Booking Packages", icon: Package },
  { href: "/dashboard/bookings", end: false, label: "Bookings", icon: Calendar },
  { href: "/dashboard/messages", end: false, label: "Contact Messages", icon: Mail },
  { href: "/dashboard/why-us", end: false, label: "Why Us", icon: Sparkles },
  { href: "/dashboard/studios", end: false, label: "Studios", icon: Building2 },
  { href: "/dashboard/studio", end: false, label: "Studio Equipment", icon: Video },
];

export default function DashboardLayoutNext({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [cloudStatus, setCloudStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getSiteSettings();
        if (!cancelled) setCloudStatus("online");
      } catch {
        if (!cancelled) setCloudStatus("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181e30] via-[#21283c] to-[#2b3450] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 flex gap-5 lg:gap-8">
        <aside className="hidden sm:flex w-64 flex-col bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
          <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-icube-gold flex items-center justify-center">
              <img src="/icube-logo.svg" alt="ICUBE" className="h-6 w-auto" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm tracking-[0.2em] uppercase text-gray-200">
                ICUBE
              </span>
              <span className="text-[11px] text-gray-500 uppercase tracking-[0.18em]">
                Admin Console
              </span>
            </div>
          </div>
          <nav className="px-3 py-3 flex-1 overflow-y-auto space-y-1">
            {nav.map(({ href, end, label, icon: Icon }) => {
              const isActive = end ? pathname === href : pathname.startsWith(href + "/") || pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-icube-gold/15 text-icube-gold border border-icube-gold/40 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-white/10 text-xs space-y-2">
            <div>
              <p className="text-gray-400 truncate">{user?.email}</p>
              <p
                className={`mt-1 flex items-center gap-1 ${
                  cloudStatus === "online"
                    ? "text-emerald-400"
                    : cloudStatus === "offline"
                      ? "text-red-400"
                      : "text-gray-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    cloudStatus === "online"
                      ? "bg-emerald-400"
                      : cloudStatus === "offline"
                        ? "bg-red-400"
                        : "bg-gray-500"
                  }`}
                />
                {cloudStatus === "online"
                  ? "Cloud sync: Firebase connected"
                  : cloudStatus === "offline"
                    ? "Cloud sync: error – check config"
                    : "Cloud sync: checking…"}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white">
                <Home size={14} /> <span>View site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-400 hover:text-red-400"
              >
                <LogOut size={14} /> <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl h-full overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between sm:hidden">
              <div>
                <h1 className="font-display text-lg font-semibold">Dashboard</h1>
                <p className="text-xs text-gray-400">
                  Signed in as <span className="font-medium">{user?.email}</span>
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
            <div className="p-4 md:p-6 lg:p-8 overflow-auto h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)]">
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCloudStatus("checking");
                    getSiteSettings()
                      .then(() => setCloudStatus("online"))
                      .catch(() => setCloudStatus("offline"));
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-black/30 ${
                    cloudStatus === "online"
                      ? "border-emerald-500/60 text-emerald-300"
                      : cloudStatus === "offline"
                        ? "border-red-500/60 text-red-300"
                        : "border-gray-500/60 text-gray-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      cloudStatus === "online"
                        ? "bg-emerald-400"
                        : cloudStatus === "offline"
                          ? "bg-red-400"
                          : "bg-gray-400"
                    }`}
                  />
                  {cloudStatus === "online"
                    ? "Cloud sync: Firebase"
                    : cloudStatus === "offline"
                      ? "Cloud sync: Error"
                      : "Cloud sync: Checking…"}
                </button>
              </div>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="w-8 h-8 border-2 border-icube-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
