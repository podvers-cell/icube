"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../api";
import { Calendar, Mail, Package, Image, CalendarRange, Printer } from "lucide-react";

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
  const [bookings, setBookings] = useState<{ id: string; created_at: FirestoreTimestampLike; package_id?: string | null }[]>([]);
  const [messages, setMessages] = useState<{ id: string; created_at: FirestoreTimestampLike; read_at?: string | null }[]>([]);
  const [period, setPeriod] = useState<"7d" | "15d" | "month" | "quarter" | "year">("15d");

  useEffect(() => {
    api.get<{ id: string; created_at: string; package_id?: string | null }[]>("/dashboard/bookings").then(setBookings).catch(() => {});
    api.get<{ id: string; created_at: FirestoreTimestampLike; read_at?: string | null }[]>("/dashboard/messages").then(setMessages).catch(() => {});
  }, []);

  const unreadMessages = messages.filter((m) => !m.read_at).length;
  const recentBookings = bookings.slice(0, 5);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-icube-gray border border-white/10 rounded-sm p-6">
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <Calendar size={24} />
            <span className="font-semibold">Bookings</span>
          </div>
          <p className="text-3xl font-bold text-white">{bookings.length}</p>
          <p className="text-gray-500 text-sm">Total requests</p>
        </div>
        <Link
          href="/dashboard/messages"
          className="bg-icube-gray border border-white/10 rounded-sm p-6 block hover:border-icube-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <Mail size={24} />
            <span className="font-semibold">Messages</span>
          </div>
          <p className="text-3xl font-bold text-white">{messages.length}</p>
          <p className="text-gray-500 text-sm">{unreadMessages} unread</p>
        </Link>
        <div className="bg-icube-gray border border-white/10 rounded-sm p-6">
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <Package size={24} />
            <span className="font-semibold">Packages</span>
          </div>
          <p className="text-gray-400 text-sm">Manage in Booking Packages</p>
        </div>
        <div className="bg-icube-gray border border-white/10 rounded-sm p-6">
          <div className="flex items-center gap-3 text-icube-gold mb-2">
            <Image size={24} />
            <span className="font-semibold">Portfolio</span>
          </div>
          <p className="text-gray-400 text-sm">Manage in Portfolio</p>
        </div>
      </div>
      <div className="bg-icube-gray border border-white/10 rounded-sm p-6">
        <h2 className="text-xl font-display font-semibold text-white mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500">No bookings yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentBookings.map((b) => (
              <li key={b.id} className="text-gray-300 text-sm flex justify-between">
                <span>Booking #{b.id}</span>
                <span className="text-gray-500">{formatCreatedAt(b.created_at)}</span>
              </li>
            ))}
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
