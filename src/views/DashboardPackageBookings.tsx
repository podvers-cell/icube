"use client";

import { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import { api, getBookingPackages, sendBookingConfirmedEmail } from "../api";

type BookingPackage = { id: number; name: string; price_aed: number };

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
  if (!b.package_id) return "—";
  const pkgId = Number(b.package_id);
  const pkg = packages.find((p) => p.id === pkgId);
  return pkg ? pkg.name : (b.package_name || b.package_id);
}

export default function DashboardPackageBookings() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [packages, setPackages] = useState<BookingPackage[]>([]);

  const list = useMemo(() => allBookings.filter((b) => b.package_id), [allBookings]);

  function load() {
    api.get<Booking[]>("/dashboard/bookings").then(setAllBookings).catch(() => {});
  }
  useEffect(() => load(), []);
  useEffect(() => {
    getBookingPackages()
      .then((p) => setPackages((p || []).map((x) => ({ id: Number((x as any).id), name: (x as any).name, price_aed: Number((x as any).price_aed) }))))
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

  async function setStatus(id: string, status: string, booking?: Booking) {
    try {
      await api.patch(`/dashboard/bookings/${id}`, { status });
      if (status === "confirmed" && booking?.email) {
        try {
          await sendBookingConfirmedEmail({
            first_name: booking.first_name,
            last_name: booking.last_name,
            email: booking.email,
            phone: booking.phone ?? undefined,
            studio_name: booking.studio_name ?? undefined,
            package_id: booking.package_id ?? undefined,
            package_name: getPackageName(booking, packages),
            booking_date: booking.booking_date ?? undefined,
            time_slot: booking.time_slot ?? undefined,
            booking_duration_hours: booking.booking_duration_hours ?? undefined,
            studio_total_aed: booking.studio_total_aed ?? undefined,
            addons_total_aed: booking.addons_total_aed,
            project_details: booking.project_details ?? undefined,
          });
        } catch {
          // Status updated; email is best-effort
        }
      }
      load();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Package Bookings</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-3 pr-4">Submitted</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Package</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
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
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-1 rounded ${b.status === "confirmed" ? "bg-green-500/20 text-green-400" : b.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-icube-gold/20 text-icube-gold"}`}>
                    {b.status}
                  </span>
                </td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => setStatus(b.id, "confirmed", b)} className="text-green-400 text-sm mr-2">Confirm</button>
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
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`text-xs px-2 py-1 rounded ${selected.status === "confirmed" ? "bg-green-500/20 text-green-400" : selected.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-icube-gold/20 text-icube-gold"}`}>
                    {selected.status}
                  </span>
                </div>
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
              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => setStatus(selected.id, "confirmed", selected)} className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium">
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
