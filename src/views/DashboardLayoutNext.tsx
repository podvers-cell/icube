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
  PlusCircle,
  Calendar,
  ClipboardList,
  Mail,
  Sparkles,
  Video,
  LogOut,
  Home,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { api, getSiteSettings } from "../api";
import UserProfile from "../components/UserProfile";

type NavItem = {
  href: string;
  end: boolean;
  label: string;
  icon: typeof LayoutGrid;
  countKey?: "bookings" | "package-bookings" | "messages";
};

const nav: NavItem[] = [
  { href: "/dashboard", end: true, label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/settings", end: false, label: "Site Settings", icon: Settings },
  { href: "/dashboard/hero", end: false, label: "Hero", icon: Image },
  { href: "/dashboard/services", end: false, label: "Services", icon: LayoutGrid },
  { href: "/dashboard/portfolio", end: false, label: "Portfolio", icon: Image },
  { href: "/dashboard/testimonials", end: false, label: "Testimonials", icon: MessageSquare },
  { href: "/dashboard/packages", end: false, label: "Booking Packages", icon: Package },
  { href: "/dashboard/addons", end: false, label: "Add-ons", icon: PlusCircle },
  { href: "/dashboard/bookings", end: false, label: "Bookings", icon: Calendar, countKey: "bookings" },
  { href: "/dashboard/package-bookings", end: false, label: "Package Bookings", icon: ClipboardList, countKey: "package-bookings" },
  { href: "/dashboard/messages", end: false, label: "Contact Messages", icon: Mail, countKey: "messages" },
  { href: "/dashboard/benefits", end: false, label: "Benefits", icon: Sparkles },
  { href: "/dashboard/studios", end: false, label: "Studios", icon: Building2 },
  { href: "/dashboard/studio", end: false, label: "Studio Equipment", icon: Video },
];

type BookingRow = { id: string; status?: string; package_id?: string | null };
type MessageRow = { id: string; read_at?: string | null };

export default function DashboardLayoutNext({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"checking" | "online" | "offline">("checking");
  const [notificationCounts, setNotificationCounts] = useState({
    bookings: 0,
    "package-bookings": 0,
    messages: 0,
  });

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, messages] = await Promise.all([
          api.get<BookingRow[]>("/dashboard/bookings"),
          api.get<MessageRow[]>("/dashboard/messages"),
        ]);
        if (cancelled) return;
        const pendingBookings = Array.isArray(bookings) ? bookings.filter((b) => b.status === "pending") : [];
        const pendingPackageBookings = pendingBookings.filter((b) => b.package_id);
        const studioOrOtherPending = pendingBookings.filter((b) => !b.package_id);
        const unreadMessages = Array.isArray(messages) ? messages.filter((m) => !m.read_at) : [];
        setNotificationCounts({
          bookings: studioOrOtherPending.length,
          "package-bookings": pendingPackageBookings.length,
          messages: unreadMessages.length,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  useEffect(() => {
    if (mobileNavOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181e30] via-[#21283c] to-[#2b3450] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 flex gap-5 lg:gap-8">
        {/* Mobile nav toggle – visible only when sidebar is hidden */}
        <div className="sm:hidden fixed top-4 left-4 z-50 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display text-sm font-semibold text-gray-200">Dashboard</span>
        </div>

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            aria-hidden
            onClick={() => setMobileNavOpen(false)}
          />
        )}
        <aside
          className={`sm:flex w-64 flex-col bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl ${
            mobileNavOpen
              ? "fixed inset-y-0 left-0 z-40 flex mt-0 rounded-none border-r border-white/10"
              : "hidden"
          }`}
          onClick={() => mobileNavOpen && setMobileNavOpen(false)}
        >
          <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
            <img src="/icube-logo.svg" alt="ICUBE" className="h-8 w-auto shrink-0" />
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
            {nav.map(({ href, end, label, icon: Icon, countKey }) => {
              const isActive = end ? pathname === href : pathname.startsWith(href + "/") || pathname === href;
              const count = countKey != null ? notificationCounts[countKey] : 0;
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
                  <span className="truncate flex-1 min-w-0">{label}</span>
                  {count > 0 ? (
                    <span
                      className="shrink-0 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-icube-gold text-icube-dark text-xs font-bold"
                      aria-label={`${count} new`}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
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

        <main className="flex-1 pt-14 sm:pt-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl h-full overflow-hidden">
            <header className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="font-display text-lg font-semibold text-white shrink-0">Dashboard</h1>
                <button
                  type="button"
                  onClick={() => {
                    setCloudStatus("checking");
                    getSiteSettings()
                      .then(() => setCloudStatus("online"))
                      .catch(() => setCloudStatus("offline"));
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-black/30 shrink-0 ${
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
              <UserProfile onLogout={() => router.replace("/")} className="shrink-0" />
            </header>
            <div className="p-4 md:p-6 lg:p-8 overflow-auto h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)]">
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
