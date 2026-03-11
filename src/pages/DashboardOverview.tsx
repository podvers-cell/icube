import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Calendar, Mail, Package, Image } from "lucide-react";

export default function DashboardOverview() {
  const [bookings, setBookings] = useState<{ id: string; created_at: string }[]>([]);
  const [messages, setMessages] = useState<{ id: string; read_at: string | null }[]>([]);

  useEffect(() => {
    api.get<{ id: string; created_at: string }[]>("/dashboard/bookings").then(setBookings).catch(() => {});
    api.get<{ id: string; read_at: string | null }[]>("/dashboard/messages").then(setMessages).catch(() => {});
  }, []);

  const unreadMessages = messages.filter((m) => !m.read_at).length;
  const recentBookings = bookings.slice(0, 5);

  return (
    <div>
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
          to="/dashboard/messages"
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
                <span className="text-gray-500">{new Date(b.created_at).toLocaleDateString("en-AE")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
