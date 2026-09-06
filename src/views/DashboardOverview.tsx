"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getPaymentIncidents } from "../api";
import { AlertTriangle, Calendar, ClipboardList, Mail, CalendarRange, Printer } from "lucide-react";

type OverviewBooking = {
  id: string;
  created_at: FirestoreTimestampLike;
  package_id?: string | null;
  package_name?: string | null;
  studio_name?: string | null;
  workshop_title?: string | null;
  name?: string | null;
  email?: string | null;
  payment_status?: string | null;
  status?: string | null;
  total_amount_aed?: number | null;
  booking_date?: string | null;
};

type FirestoreTimestampLike =
  | string
  | { seconds: number; nanoseconds?: number }
  | { _seconds: number; _nanoseconds?: number }
  | { toDate?: () => Date };

function formatCreatedAt(raw: FirestoreTimestampLike): string {
  if (!raw) return "—";
  let date: Date;
  if (typeof raw === "string") {
    date = new Date(raw);
  } else if (typeof raw === "object" && raw !== null && "toDate" in raw && typeof raw.toDate === "function") {
    date = raw.toDate();
  } else if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    date = new Date((raw as { seconds: number }).seconds * 1000);
  } else if (typeof raw === "object" && raw !== null && "_seconds" in raw) {
    date = new Date((raw as { _seconds: number })._seconds * 1000);
  } else {
    date = new Date(Number(raw));
  }
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AE", { dateStyle: "medium" });
}

export default function DashboardOverview() {
  const [bookings, setBookings] = useState<OverviewBooking[]>([]);
  const [messages, setMessages] = useState<{ id: string; created_at: FirestoreTimestampLike; read_at?: string | null }[]>([]);
  const [openIssues, setOpenIssues] = useState<number | null>(null);
  const [period, setPeriod] = useState<"7d" | "15d" | "month" | "quarter" | "year">("15d");

  useEffect(() => {
    api.get<OverviewBooking[]>("/dashboard/bookings").then(setBookings).catch(() => {});
    // Payments that arrived but could not be honoured. Surfaced here because nothing else tells
    // the owner a customer is waiting on a refund.
    getPaymentIncidents()
      .then((items) => setOpenIssues(items.filter((i) => i.status !== "resolved").length))
      .catch(() => setOpenIssues(null));
    api.get<{ id: string; created_at: FirestoreTimestampLike; read_at?: string | null }[]>("/dashboard/messages").then(setMessages).catch(() => {});
  }, []);

  const unreadMessages = messages.filter((m) => !m.read_at).length;
  const recentBookings = bookings.slice(0, 5);
  // The Studio Bookings page filters the same way, so the figures agree.
  const studioBookings = bookings.filter((b) => !b.package_id);
  const packageBookings = bookings.filter((b) => b.package_id);
  const awaitingPayment = studioBookings.filter((b) => b.payment_status !== "paid").length;

  function getPeriodDays(p: typeof period): number {
    // Use rolling windows based on days, to keep logic simple & consistent.
    switch (p) {
      case "7d":
        return 7;
      case "15d":
        return 15;
      case "month":
        return 30;
      case "quarter":
        return 90;
      case "year":
        return 365;
      default:
        return 15;
    }
  }

  function getPeriodLabel(p: typeof period): string {
    switch (p) {
      case "7d":
        return "Last 7 Days";
      case "15d":
        return "Last 15 Days";
      case "month":
        return "Month";
      case "quarter":
        return "Quarter";
      case "year":
        return "Yearly";
      default:
        return "Last 15 Days";
    }
  }

  function extractDate(raw: FirestoreTimestampLike): Date | null {
    if (!raw) return null;
    if (typeof raw === "string") {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === "object" && raw !== null && "toDate" in raw && typeof (raw as any).toDate === "function") {
      const d = (raw as any).toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === "object" && raw !== null && "seconds" in raw) {
      const d = new Date((raw as { seconds: number }).seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === "object" && raw !== null && "_seconds" in raw) {
      const d = new Date((raw as { _seconds: number })._seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(Number(raw));
    return isNaN(d.getTime()) ? null : d;
  }

  function dateKey(d: Date): string {
    // Local date key so chart matches user expectation.
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const chart = (() => {
    const days = getPeriodDays(period);
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const keys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      keys.push(dateKey(d));
    }

    const bookingsByDay: Record<string, number> = {};
    const packageBookingsByDay: Record<string, number> = {};
    const messagesByDay: Record<string, number> = {};

    for (const b of bookings) {
      const d = extractDate(b.created_at);
      if (!d) continue;
      const k = dateKey(d);
      if (!keys.includes(k)) continue;
      bookingsByDay[k] = (bookingsByDay[k] ?? 0) + 1;
      if (b.package_id) packageBookingsByDay[k] = (packageBookingsByDay[k] ?? 0) + 1;
    }

    for (const m of messages) {
      const d = extractDate(m.created_at);
      if (!d) continue;
      const k = dateKey(d);
      if (!keys.includes(k)) continue;
      messagesByDay[k] = (messagesByDay[k] ?? 0) + 1;
    }

    const bookingsSeries = keys.map((k) => bookingsByDay[k] ?? 0);
    const packageBookingsSeries = keys.map((k) => packageBookingsByDay[k] ?? 0);
    const messagesSeries = keys.map((k) => messagesByDay[k] ?? 0);

    const maxV = Math.max(1, ...bookingsSeries, ...packageBookingsSeries, ...messagesSeries);

    const pointEvery = Math.max(1, Math.ceil(keys.length / 50));
    return { keys, bookingsSeries, packageBookingsSeries, messagesSeries, maxV, pointEvery };
  })();

  const chartColors = {
    bookings: "#D4AF37", // icube-gold
    packages: "#FFFFFF", // keep it neutral and readable
    messages: "rgba(255,255,255,0.5)",
  };

  const totals = {
    bookingsInPeriod: chart.bookingsSeries.reduce((a, b) => a + b, 0),
    packageBookingsInPeriod: chart.packageBookingsSeries.reduce((a, b) => a + b, 0),
    messagesInPeriod: chart.messagesSeries.reduce((a, b) => a + b, 0),
  };

  return (
    <div className="print-report">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-report, .print-report * { visibility: visible; }
          .no-print { display: none !important; }
          .print-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Dashboard</h1>
      {openIssues != null && openIssues > 0 && (
        <Link
          href="/dashboard/payment-issues"
          className="no-print mb-6 flex items-start gap-3 rounded-sm border border-red-400/40 bg-red-500/10 p-4 transition-colors hover:border-red-400/70"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-300" aria-hidden />
          <div>
            <p className="font-semibold text-red-200">
              {openIssues} {openIssues === 1 ? "payment needs" : "payments need"} your attention
            </p>
            <p className="mt-0.5 text-sm text-red-200/70">
              Money arrived but the booking could not be honoured. Review and refund.
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Link
          href="/dashboard/bookings"
          className="bg-icube-gray border border-white/10 rounded-sm p-6 block hover:border-icube-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <Calendar size={24} />
            <span className="font-semibold">Studio Bookings</span>
          </div>
          <p className="text-3xl font-bold text-white">{studioBookings.length}</p>
          <p className="text-gray-500 text-sm">
            {awaitingPayment > 0 ? `${awaitingPayment} awaiting payment` : "All settled"}
          </p>
        </Link>

        <Link
          href="/dashboard/package-bookings"
          className="bg-icube-gray border border-white/10 rounded-sm p-6 block hover:border-icube-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <ClipboardList size={24} />
            <span className="font-semibold">Package Bookings</span>
          </div>
          <p className="text-3xl font-bold text-white">{packageBookings.length}</p>
          <p className="text-gray-500 text-sm">Total requests</p>
        </Link>

        <Link
          href="/dashboard/messages"
          className="bg-icube-gray border border-white/10 rounded-sm p-6 block hover:border-icube-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <Mail size={24} />
            <span className="font-semibold">Messages</span>
          </div>
          <p className="text-3xl font-bold text-white">{messages.length}</p>
          <p className="text-gray-500 text-sm">
            {unreadMessages > 0 ? `${unreadMessages} unread` : "All read"}
          </p>
        </Link>

        <Link
          href="/dashboard/payment-issues"
          className={`rounded-sm p-6 block border transition-colors ${
            openIssues && openIssues > 0
              ? "border-red-400/40 bg-red-500/10 hover:border-red-400/70"
              : "bg-icube-gray border-white/10 hover:border-icube-gold/30"
          }`}
        >
          <div
            className={`flex items-center gap-3 mb-2 ${
              openIssues && openIssues > 0 ? "text-red-300" : "text-icube-gold"
            }`}
          >
            <AlertTriangle size={24} />
            <span className="font-semibold">Payment Issues</span>
          </div>
          <p className="text-3xl font-bold text-white">{openIssues ?? "—"}</p>
          <p className="text-gray-500 text-sm">
            {openIssues === 0 ? "Nothing to handle" : "Open, needs a refund or a decision"}
          </p>
        </Link>
      </div>

      <div className="bg-icube-gray border border-white/10 rounded-sm p-6">
        <h2 className="text-xl font-display font-semibold text-white mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {recentBookings.map((b) => {
              const paid = b.payment_status === "paid";
              const failed = b.payment_status === "failed";
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {b.name?.trim() || b.email?.trim() || "Unnamed customer"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {b.package_name || b.studio_name || b.workshop_title || "Booking"}
                      {b.booking_date ? ` · ${b.booking_date}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {b.total_amount_aed != null && (
                      <span className="text-sm text-gray-300">
                        AED {Number(b.total_amount_aed).toLocaleString("en-AE")}
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        paid
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                          : failed
                            ? "border-red-400/40 bg-red-500/15 text-red-300"
                            : "border-icube-gold/40 bg-icube-gold/10 text-icube-gold"
                      }`}
                    >
                      {paid ? "Paid" : failed ? "Failed" : "Awaiting payment"}
                    </span>
                    <span className="w-24 text-right text-xs text-gray-500">{formatCreatedAt(b.created_at)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Trend chart */}
      <div className="bg-icube-gray border border-white/10 rounded-sm p-6 mt-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="lg:max-w-[55%]">
            <h2 className="text-xl font-display font-semibold text-white">Activity ({getPeriodLabel(period)})</h2>
            <p className="text-gray-500 text-sm mt-1">Bookings, package bookings, and contact messages.</p>
            <div className="mt-3 text-sm text-gray-300 flex flex-wrap gap-x-6 gap-y-2">
              <span>
                <span className="text-white font-semibold">{totals.bookingsInPeriod}</span> bookings
              </span>
              <span>
                <span className="text-white font-semibold">{totals.packageBookingsInPeriod}</span> package bookings
              </span>
              <span>
                <span className="text-white font-semibold">{totals.messagesInPeriod}</span> messages
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Period
            </label>
            <div className="flex items-center justify-end gap-3">
              <div className="relative">
                <CalendarRange
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-icube-gold/80 pointer-events-none"
                  aria-hidden
                />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as typeof period)}
                  className="appearance-none bg-transparent border border-white/30 text-white rounded-full pl-10 pr-10 h-10 py-0 px-4 text-xs md:text-sm font-medium uppercase tracking-wider transition-all duration-200 hover:border-white/50 focus:outline-none focus:border-icube-gold min-w-[180px]"
                  aria-label="Choose graph period"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="15d">Last 15 Days</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Yearly</option>
                </select>
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"
                >
                  ▾
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/30 text-white hover:border-white/50 hover:bg-white/5 transition-colors"
                aria-label="Print report"
                title="Print report"
              >
                <Printer size={18} className="text-icube-gold/80" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.bookings }} aria-hidden />
                <span>Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.packages }} aria-hidden />
                <span>Package bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.messages }} aria-hidden />
                <span>Messages</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 700 220"
            className="w-full h-[220px]"
            role="img"
            aria-label="Dashboard activity trend chart"
          >
            {/* Grid + y labels */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const t = idx / 3; // 0..1
              const v = Math.round(chart.maxV - t * chart.maxV);
              const y = 28 + (1 - v / chart.maxV) * 140;
              return (
                <g key={idx}>
                  <line x1={56} x2={684} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                  <text x={44} y={y + 4} fontSize={11} fill="rgba(255,255,255,0.35)">
                    {v}
                  </text>
                </g>
              );
            })}

            {/* Axis line */}
            <line x1={56} x2={684} y1={168} y2={168} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

            {(() => {
              const chartLeft = 56;
              const chartRight = 684;
              const chartTop = 28;
              const chartBottom = 168;
              const innerW = chartRight - chartLeft;
              const innerH = chartBottom - chartTop;
              const n = chart.keys.length;
              const x = (i: number) => chartLeft + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
              const y = (val: number) => chartTop + (1 - val / chart.maxV) * innerH;

              const poly = (series: number[]) => series.map((v, i) => `${x(i)},${y(v)}`).join(" ");

              return (
                <>
                  <polyline points={poly(chart.bookingsSeries)} fill="none" stroke={chartColors.bookings} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                  <polyline points={poly(chart.packageBookingsSeries)} fill="none" stroke={chartColors.packages} strokeOpacity={0.9} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  <polyline points={poly(chart.messagesSeries)} fill="none" stroke={chartColors.messages} strokeOpacity={0.9} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

                  {/* Points (circles) */}
                  {chart.keys.map((_, i) => {
                    const shouldShow = i === 0 || i === chart.keys.length - 1 || i % chart.pointEvery === 0;
                    if (!shouldShow) return null;
                    return (
                      <g key={i}>
                        <circle cx={x(i)} cy={y(chart.bookingsSeries[i])} r={3} fill={chartColors.bookings} opacity={0.95} />
                        <circle cx={x(i)} cy={y(chart.packageBookingsSeries[i])} r={2.7} fill={chartColors.packages} opacity={0.8} />
                        <circle cx={x(i)} cy={y(chart.messagesSeries[i])} r={2.6} fill={chartColors.messages} opacity={0.9} />
                      </g>
                    );
                  })}

                  {/* X labels: first, mid, last */}
                  {(() => {
                    const labelAt = (idx: number) => {
                      const [yyyy, mm, dd] = chart.keys[idx].split("-").map((s) => Number(s));
                      const d = new Date(yyyy, (mm ?? 1) - 1, dd ?? 1);
                      return d.toLocaleDateString("en-AE", { month: "short", day: "2-digit" });
                    };
                    const indices = new Set<number>([0, Math.floor(n / 2), n - 1]);
                    return Array.from(indices).map((idx) => (
                      <text key={idx} x={x(idx)} y={206} fontSize={11} fill="rgba(255,255,255,0.35)" textAnchor="middle">
                        {labelAt(idx)}
                      </text>
                    ));
                  })()}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}
