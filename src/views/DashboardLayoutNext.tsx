"use client";

import { useEffect, useState } from "react";
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
  GraduationCap,
  Ban,
  LogOut,
  Home,
  Building2,
  Percent,
  Camera,
  LayoutDashboard,
  AlertTriangle,
  CalendarCheck,
  FolderOpen,
  Award,
  Mic,
  Menu,
} from "lucide-react";
import { api, getSiteSettings } from "../api";
import { needsSidebarAttention } from "@/lib/dashboardBookingUi";

type NavItem = {
  href: string;
  end: boolean;
  label: string;
  icon: typeof LayoutGrid;
  countKey?: "bookings" | "package-bookings" | "messages";
};

type NavGroup = { title: string; items: NavItem[] };

/**
 * Grouped by what the owner is trying to do, not by which collection the data lives in.
 *
 * "Today" is the queue you work through each morning and sits first. "Selling" is what customers
 * can buy. "Website" is what visitors read. Settings last.
 *
 * Every entry has a distinct icon: a repeated one makes the list harder to scan than no icon.
 */
export const navGroups: NavGroup[] = [
  {
    title: "Today",
    items: [
      { href: "/dashboard", end: true, label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/payment-issues", end: false, label: "Payment Issues", icon: AlertTriangle },
      // This page filters to bookings without a package, so the old "Bookings" label was wrong.
      { href: "/dashboard/bookings", end: false, label: "Studio Bookings", icon: Calendar, countKey: "bookings" },
      { href: "/dashboard/package-bookings", end: false, label: "Package Bookings", icon: ClipboardList, countKey: "package-bookings" },
      { href: "/dashboard/workshop-bookings", end: false, label: "Workshop Bookings", icon: CalendarCheck },
      { href: "/dashboard/messages", end: false, label: "Contact Messages", icon: Mail, countKey: "messages" },
      { href: "/dashboard/blocked-slots", end: false, label: "Blocked Slots", icon: Ban },
    ],
  },
  {
    title: "Selling",
    items: [
      { href: "/dashboard/packages", end: false, label: "Booking Packages", icon: Package },
      { href: "/dashboard/addons", end: false, label: "Add-ons", icon: PlusCircle },
      { href: "/dashboard/rental-equipment", end: false, label: "Rental Equipment", icon: Camera },
      { href: "/dashboard/workshops", end: false, label: "Workshops", icon: GraduationCap },
      { href: "/dashboard/studios", end: false, label: "Studios Gallery", icon: Building2 },
      { href: "/dashboard/discount-codes", end: false, label: "Discount Codes", icon: Percent },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/dashboard/hero", end: false, label: "Hero", icon: Image },
      { href: "/dashboard/services", end: false, label: "Services", icon: LayoutGrid },
      { href: "/dashboard/portfolio", end: false, label: "Portfolio", icon: FolderOpen },
      { href: "/dashboard/videos", end: false, label: "Showreel Videos", icon: Video },
      { href: "/dashboard/testimonials", end: false, label: "Testimonials", icon: MessageSquare },
      { href: "/dashboard/benefits", end: false, label: "Benefits", icon: Sparkles },
      { href: "/dashboard/why-us", end: false, label: "Why Us", icon: Award },
      { href: "/dashboard/studio", end: false, label: "Studio Equipment", icon: Mic },
    ],
  },
  {
    title: "Settings",
    items: [{ href: "/dashboard/settings", end: false, label: "Site Settings", icon: Settings }],
  },
];

type BookingRow = { id: string; status?: string; package_id?: string | null; payment_status?: string | null };
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
        const actionableBookings = Array.isArray(bookings)
          ? bookings.filter((b) => needsSidebarAttention(b))
          : [];
        const packageActionable = actionableBookings.filter((b) => b.package_id);
        const studioActionable = actionableBookings.filter((b) => !b.package_id);
        const unreadMessages = Array.isArray(messages) ? messages.filter((m) => !m.read_at) : [];
        setNotificationCounts({
          bookings: studioActionable.length,
          "package-bookings": packageActionable.length,
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

  const activeLabel =
    navGroups.flatMap((g) => g.items).find((item) =>
      item.end ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label ?? "Dashboard";

  const statusTone =
    cloudStatus === "online"
      ? { dot: "bg-emerald-400", text: "text-emerald-300", border: "border-emerald-500/50" }
      : cloudStatus === "offline"
        ? { dot: "bg-red-400", text: "text-red-300", border: "border-red-500/50" }
        : { dot: "bg-gray-400", text: "text-gray-400", border: "border-white/20" };

  const sidebar = (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
        <img src="/icube-logo.svg" alt="" className="h-8 w-auto shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gray-200">ICUBE</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Admin Console</span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard sections">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? "pt-5" : undefined}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, end, label, icon: Icon, countKey }) => {
                const isActive = end ? pathname === href : pathname === href || pathname.startsWith(href + "/");
                const count = countKey != null ? notificationCounts[countKey] : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-icube-gold/15 text-icube-gold"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {count > 0 && (
                      <span
                        className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-icube-gold px-1.5 text-xs font-bold text-icube-dark"
                        aria-label={`${count} needing attention`}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/10 px-5 py-4">
        <p className="truncate text-xs text-gray-500">{user?.email}</p>
        <div className="flex items-center justify-between text-xs">
          <Link href="/" className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-white">
            <Home size={14} /> <span>View site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-red-400"
          >
            <LogOut size={14} /> <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-icube-dark text-white">
      {/*
        The sidebar used to appear from 640px, where a fixed 256px rail left barely 380px for the
        page and could not be dismissed. It is now a drawer below 1024px and a fixed rail above,
        so phones and tablets get the full width.
      */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col border-r border-white/10 bg-white/[0.03] backdrop-blur-xl lg:flex">
        {sidebar}
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        id="dashboard-nav"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(300px,85vw)] flex-col border-r border-white/10 bg-icube-gray shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        {sidebar}
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-icube-dark/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              aria-controls="dashboard-nav"
              aria-expanded={mobileNavOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 text-gray-300 transition-colors hover:border-icube-gold/50 hover:text-icube-gold lg:hidden"
            >
              <Menu size={18} />
            </button>

            <h2 className="min-w-0 flex-1 truncate font-display text-base font-semibold text-white sm:text-lg">
              {activeLabel}
            </h2>

            <button
              type="button"
              onClick={() => {
                setCloudStatus("checking");
                getSiteSettings()
                  .then(() => setCloudStatus("online"))
                  .catch(() => setCloudStatus("offline"));
              }}
              title={
                cloudStatus === "online"
                  ? "Connected to Firebase"
                  : cloudStatus === "offline"
                    ? "Connection error — check configuration"
                    : "Checking connection…"
              }
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border bg-black/30 px-3 py-1.5 text-xs font-medium ${statusTone.border} ${statusTone.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
              {/* The word is noise on a phone; the dot already carries the state. */}
              <span className="hidden sm:inline">
                {cloudStatus === "online" ? "Connected" : cloudStatus === "offline" ? "Offline" : "Checking…"}
              </span>
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
