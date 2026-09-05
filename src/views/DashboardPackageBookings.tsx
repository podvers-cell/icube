"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, X } from "lucide-react";
import { api, getBookingPackages } from "../api";
import { BookingFilterTabs, StatusBadge, useFilterTab } from "@/components/dashboard/BookingFilterTabs";
import {
  BOOKING_FILTER_TABS,
  bookingMatchesFilter,
  bookingStatusBadgeClass,
  bookingStatusLabel,
  canAdminConfirm,
  effectiveBookingStatus,
  formatBookingAmount,
  formatPaymentReference,
  getBookingFilterCategory,
  getPackageDisplayName,
  getPackagePrice,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  type BookingFilterTab,
} from "@/lib/dashboardBookingUi";

type BookingPackage = { id: string; name: string; price_aed: number };

type Booking = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  project_details?: string | null;
  package_id?: string | null;
  package_name?: string | null;
  studio_id?: string | null;
  studio_name?: string | null;
  booking_duration_hours?: number | null;
  studio_total_aed?: number | null;
  booking_date?: string | null;
  time_slot?: string | null;
  addon_ids?: string[];
  addons_total_aed?: number;
  discount_code?: string | null;
  discount_percent?: number | null;
  total_amount_aed?: number | null;
  payment_status?: string | null;
  payment_amount_minor?: number | null;
  ziina_intent_id?: string | null;
  status: string;
  created_at: string | { seconds: number; nanoseconds?: number } | { _seconds: number; _nanoseconds?: number };
};

function formatSubmitted(createdAt: Booking["created_at"]): string {
  if (!createdAt) return "—";
  let date: Date;
  if (typeof createdAt === "string") {
    date = new Date(createdAt);
  } else if (typeof createdAt === "object" && createdAt !== null && "seconds" in createdAt) {
    date = new Date((createdAt as { seconds: number }).seconds * 1000);
  } else if (typeof createdAt === "object" && createdAt !== null && "_seconds" in createdAt) {
    date = new Date((createdAt as { _seconds: number })._seconds * 1000);
  } else {
    date = new Date(Number(createdAt));
  }
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-AE", { dateStyle: "short", timeStyle: "short" });
}

function getPackageName(b: Booking, packages: BookingPackage[]): string {
  return getPackageDisplayName(b, packages);
}

export default function DashboardPackageBookings() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [packages, setPackages] = useState<BookingPackage[]>([]);
  const [filterTab, setFilterTab] = useFilterTab<BookingFilterTab>("confirmed");

  const list = useMemo(() => allBookings.filter((b) => b.package_id), [allBookings]);

  const filterCounts = useMemo(() => {
    const counts: Record<BookingFilterTab, number> = { confirmed: 0, awaiting: 0, failed: 0, all: list.length };
    for (const b of list) {
      counts[getBookingFilterCategory(b)] += 1;
    }
    return counts;
  }, [list]);

  const visibleBookings = useMemo(
    () => list.filter((b) => bookingMatchesFilter(b, filterTab)),
    [list, filterTab]
  );

  function load() {
    api.get<Booking[]>("/dashboard/bookings").then(setAllBookings).catch(() => {});
  }
  useEffect(() => load(), []);
  useEffect(() => {
    getBookingPackages()
      .then((p) =>
        setPackages(
          (p || []).map((x) => ({
            id: String((x as any).id),
            name: (x as any).name,
            price_aed: Number((x as any).price_aed),
          }))
        )
      )
      .catch(() => {});
  }, []);

  async function removeBooking(id: string) {
    if (!confirm("Remove this package booking?")) return;
    try {
      await api.delete(`/dashboard/bookings/${id}`);
      load();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function setStatus(id: string, status: string, _booking?: Booking) {
    try {
      await api.patch(`/dashboard/bookings/${id}`, { status });
      load();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
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

  function exportData() {
    const rows = list.map((b) => ({
      id: b.id,
      submitted_at: formatSubmitted(b.created_at),
      first_name: b.first_name,
      last_name: b.last_name,
      email: b.email,
      phone: b.phone ?? "",
      package_id: b.package_id ?? "",
      package_name: getPackageName(b, packages),
      booking_status: bookingStatusLabel(effectiveBookingStatus(b)),
      payment_status: paymentStatusLabel(b.payment_status),
      total_amount_aed: formatBookingAmount(b, getPackagePrice(b, packages)),
      ziina_intent_id: b.ziina_intent_id ?? "",
      status: b.status,
      project_details: b.project_details ?? "",
    }));
    downloadCsv(`package_bookings_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  async function clearData() {
    if (list.length === 0) return;
    if (!confirm(`Clear ${list.length} package bookings? This will permanently delete them.`)) return;
    try {
      for (const b of list) {
        await api.delete(`/dashboard/bookings/${b.id}`);
      }
      load();
      setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Package Bookings</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportData}
            disabled={list.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-icube-gray px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50"
          >
            <Download size={16} />
            Export
          </button>
          <button
            type="button"
            onClick={clearData}
            disabled={list.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      <BookingFilterTabs tabs={BOOKING_FILTER_TABS} active={filterTab} onChange={setFilterTab} counts={filterCounts} />

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1100px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-3 pr-4">Submitted</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Package</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">Payment</th>
              <th className="pb-3 pr-4">Booking</th>
              <th className="pb-3 pr-4">Payment ref</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleBookings.map((b) => (
              <tr
                key={b.id}
                onClick={() => setSelected(b)}
                className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <td className="py-3 pr-4 text-gray-300 text-sm whitespace-nowrap">
                  {formatSubmitted(b.created_at)}
                </td>
                <td className="py-3 pr-4 text-white whitespace-nowrap">
                  {[b.first_name, b.last_name].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="py-3 pr-4 text-gray-400 text-sm whitespace-nowrap">
                  {b.phone || "—"}
                </td>
                <td className="py-3 pr-4 text-gray-400 text-sm">
                  <a href={`mailto:${b.email}`} className="hover:text-icube-gold truncate block max-w-[180px]" title={b.email} onClick={(e) => e.stopPropagation()}>
                    {b.email}
                  </a>
                </td>
                <td className="py-3 pr-4 text-gray-300 text-sm max-w-[180px]">
                  {getPackageName(b, packages)}
                </td>
                <td className="py-3 pr-4 text-icube-gold text-sm whitespace-nowrap">
                  {formatBookingAmount(b, getPackagePrice(b, packages))}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge label={paymentStatusLabel(b.payment_status)} className={paymentStatusBadgeClass(b.payment_status)} />
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge label={bookingStatusLabel(effectiveBookingStatus(b))} className={bookingStatusBadgeClass(effectiveBookingStatus(b))} />
                </td>
                <td className="py-3 pr-4 text-gray-500 text-xs font-mono" title={b.ziina_intent_id ?? undefined}>
                  {formatPaymentReference(b.ziina_intent_id)}
                </td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  {b.status !== "confirmed" && b.status !== "cancelled" && (
                    <>
                      <button
                        onClick={() => canAdminConfirm(b) && setStatus(b.id, "confirmed", b)}
                        disabled={!canAdminConfirm(b)}
                        title={canAdminConfirm(b) ? "Confirm booking" : "Payment must be completed before confirming"}
                        className="text-green-400 text-sm mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Confirm
                      </button>
                      <button onClick={() => setStatus(b.id, "cancelled")} className="text-red-400 text-sm">Cancel</button>
                    </>
                  )}
                  <button
                    onClick={() => removeBooking(b.id)}
                    className="text-red-400 text-sm ml-2"
                    title="Remove package booking"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p className="text-gray-500 mt-4">No package bookings yet.</p>}
      {list.length > 0 && visibleBookings.length === 0 && (
        <p className="text-gray-500 mt-4">No package bookings in this filter.</p>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-icube-gray border border-white/10 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-display font-bold text-white">Package booking details</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Submitted</p>
                  <p className="text-white">{formatSubmitted(selected.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Booking status</p>
                  <StatusBadge label={bookingStatusLabel(effectiveBookingStatus(selected))} className={bookingStatusBadgeClass(effectiveBookingStatus(selected))} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment status</p>
                  <StatusBadge label={paymentStatusLabel(selected.payment_status)} className={paymentStatusBadgeClass(selected.payment_status)} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total amount</p>
                  <p className="text-icube-gold font-medium">
                    {formatBookingAmount(selected, getPackagePrice(selected, packages))}
                  </p>
                </div>
                {selected.ziina_intent_id && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ziina payment reference</p>
                    <p className="text-gray-300 text-sm font-mono break-all">{selected.ziina_intent_id}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</p>
                <p className="text-white font-medium">{[selected.first_name, selected.last_name].filter(Boolean).join(" ") || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-white">
                  {selected.phone ? (
                    <a href={`tel:${selected.phone}`} className="hover:text-icube-gold">{selected.phone}</a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-white">
                  <a href={`mailto:${selected.email}`} className="hover:text-icube-gold">{selected.email}</a>
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Package</p>
                <p className="text-white">{getPackageName(selected, packages)}</p>
              </div>

              {selected.project_details && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Project details</p>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-4">{selected.project_details}</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between gap-4 bg-white/[0.02]">
              {selected.status !== "confirmed" && selected.status !== "cancelled" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => canAdminConfirm(selected) && setStatus(selected.id, "confirmed", selected)}
                    disabled={!canAdminConfirm(selected)}
                    title={canAdminConfirm(selected) ? "Confirm booking" : "Payment must be completed before confirming"}
                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm
                  </button>
                  <button onClick={() => setStatus(selected.id, "cancelled")} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium">
                    Cancel
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeBooking(selected.id)}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium"
              >
                Remove booking
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
