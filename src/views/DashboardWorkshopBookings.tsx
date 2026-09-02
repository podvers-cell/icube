"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { api } from "@/api";
import { BookingFilterTabs, StatusBadge, useFilterTab } from "@/components/dashboard/BookingFilterTabs";
import {
  BOOKING_FILTER_TABS,
  formatPaymentReference,
  normalizePaymentStatus,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  workshopMatchesFilter,
  type BookingFilterTab,
} from "@/lib/dashboardBookingUi";

type WorkshopEnrollment = {
  id: string;
  workshop_id?: string | null;
  workshop_date?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  amount_aed?: number | null;
  payment_status?: string | null;
  ziina_intent_id?: string | null;
  created_at: string | { seconds: number; nanoseconds?: number } | { _seconds: number; _nanoseconds?: number };
};

function formatSubmitted(createdAt: WorkshopEnrollment["created_at"]): string {
  if (!createdAt) return "—";
  let date: Date;
  if (typeof createdAt === "string") date = new Date(createdAt);
  else if (typeof createdAt === "object" && createdAt !== null && "seconds" in createdAt) date = new Date((createdAt as { seconds: number }).seconds * 1000);
  else if (typeof createdAt === "object" && createdAt !== null && "_seconds" in createdAt) date = new Date((createdAt as { _seconds: number })._seconds * 1000);
  else date = new Date(Number(createdAt));
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-AE", { dateStyle: "short", timeStyle: "short" });
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = Array.from(
    rows.reduce((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set<string>())
  );
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getWorkshopFilterCategory(e: WorkshopEnrollment): Exclude<BookingFilterTab, "all"> {
  const payment = normalizePaymentStatus(e.payment_status);
  if (payment === "paid") return "confirmed";
  if (payment === "failed") return "failed";
  return "awaiting";
}

export default function DashboardWorkshopBookings() {
  const [list, setList] = useState<WorkshopEnrollment[]>([]);
  const [filterTab, setFilterTab] = useFilterTab<BookingFilterTab>("confirmed");

  function load() {
    api.get<WorkshopEnrollment[]>("/dashboard/workshop-bookings").then((d) => setList(Array.isArray(d) ? d : [])).catch(() => {});
  }
  useEffect(() => load(), []);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => formatSubmitted(b.created_at).localeCompare(formatSubmitted(a.created_at)));
  }, [list]);

  const filterCounts = useMemo(() => {
    const counts: Record<BookingFilterTab, number> = { confirmed: 0, awaiting: 0, failed: 0, all: sorted.length };
    for (const e of sorted) {
      counts[getWorkshopFilterCategory(e)] += 1;
    }
    return counts;
  }, [sorted]);

  const visibleEnrollments = useMemo(
    () => sorted.filter((e) => workshopMatchesFilter(e, filterTab)),
    [sorted, filterTab]
  );

  function exportData() {
    const rows = sorted.map((e) => ({
      id: e.id,
      submitted_at: formatSubmitted(e.created_at),
      workshop_id: e.workshop_id ?? "",
      workshop_date: e.workshop_date ?? "",
      full_name: e.full_name ?? "",
      email: e.email ?? "",
      phone: e.phone ?? "",
      amount_aed: e.amount_aed ?? "",
      payment_status: paymentStatusLabel(e.payment_status),
      ziina_intent_id: e.ziina_intent_id ?? "",
    }));
    downloadCsv(`workshop_bookings_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  async function clearAll() {
    if (sorted.length === 0) return;
    if (!confirm(`Clear ${sorted.length} workshop bookings? This will permanently delete them.`)) return;
    try {
      for (const e of sorted) {
        await api.delete(`/dashboard/workshop-bookings/${e.id}`);
      }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Workshop Bookings</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportData}
            disabled={sorted.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-icube-gray px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50"
          >
            <Download size={16} />
            Export
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={sorted.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      <BookingFilterTabs tabs={BOOKING_FILTER_TABS} active={filterTab} onChange={setFilterTab} counts={filterCounts} />

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[980px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-3 pr-4">Submitted</th>
              <th className="pb-3 pr-4">Workshop</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">Payment</th>
              <th className="pb-3">Payment ref</th>
            </tr>
          </thead>
          <tbody>
            {visibleEnrollments.map((e) => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4 text-gray-300 text-sm whitespace-nowrap">{formatSubmitted(e.created_at)}</td>
                <td className="py-3 pr-4 text-white text-sm">{e.workshop_id || "—"}</td>
                <td className="py-3 pr-4 text-gray-300 text-sm whitespace-nowrap">{e.workshop_date || "—"}</td>
                <td className="py-3 pr-4 text-gray-300 text-sm">{e.full_name || "—"}</td>
                <td className="py-3 pr-4 text-gray-300 text-sm">{e.email || "—"}</td>
                <td className="py-3 pr-4 text-gray-300 text-sm whitespace-nowrap">{e.phone || "—"}</td>
                <td className="py-3 pr-4 text-icube-gold text-sm font-semibold whitespace-nowrap">
                  {e.amount_aed != null ? `${e.amount_aed} AED` : "—"}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge label={paymentStatusLabel(e.payment_status)} className={paymentStatusBadgeClass(e.payment_status)} />
                </td>
                <td className="py-3 text-xs text-gray-500 font-mono" title={e.ziina_intent_id ?? undefined}>
                  {formatPaymentReference(e.ziina_intent_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && <p className="text-gray-500 mt-4">No workshop bookings yet.</p>}
      {sorted.length > 0 && visibleEnrollments.length === 0 && (
        <p className="text-gray-500 mt-4">No workshop bookings in this filter.</p>
      )}
    </div>
  );
}
