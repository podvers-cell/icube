import { useEffect, useState } from "react";
import { api } from "../api";

type Booking = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  project_details: string | null;
  package_id: number | null;
  package_name: string | null;
  status: string;
  created_at: string;
};

export default function DashboardBookings() {
  const [list, setList] = useState<Booking[]>([]);

  function load() {
    api.get<Booking[]>("/dashboard/bookings").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function setStatus(id: number, status: string) {
    try {
      await api.patch(`/dashboard/bookings/${id}`, { status });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Bookings</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Package</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id} className="border-b border-white/5">
                <td className="py-3 pr-4 text-gray-300 text-sm">
                  {new Date(b.created_at).toLocaleString("en-AE", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="py-3 pr-4 text-white">{b.first_name} {b.last_name}</td>
                <td className="py-3 pr-4 text-gray-400 text-sm">{b.email}</td>
                <td className="py-3 pr-4 text-gray-400 text-sm">{b.package_name || "Custom"}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-1 rounded ${b.status === "confirmed" ? "bg-green-500/20 text-green-400" : b.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-icube-gold/20 text-icube-gold"}`}>
                    {b.status}
                  </span>
                </td>
                <td className="py-3">
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => setStatus(b.id, "confirmed")} className="text-green-400 text-sm mr-2">Confirm</button>
                      <button onClick={() => setStatus(b.id, "cancelled")} className="text-red-400 text-sm">Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p className="text-gray-500 mt-4">No bookings yet.</p>}
    </div>
  );
}
