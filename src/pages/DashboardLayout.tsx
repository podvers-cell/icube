import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
} from "lucide-react";

const nav = [
  { to: "/dashboard", end: true, label: "Overview", icon: LayoutGrid },
  { to: "/dashboard/settings", end: false, label: "Site Settings", icon: Settings },
  { to: "/dashboard/services", end: false, label: "Services", icon: LayoutGrid },
  { to: "/dashboard/portfolio", end: false, label: "Portfolio", icon: Image },
  { to: "/dashboard/testimonials", end: false, label: "Testimonials", icon: MessageSquare },
  { to: "/dashboard/packages", end: false, label: "Booking Packages", icon: Package },
  { to: "/dashboard/bookings", end: false, label: "Bookings", icon: Calendar },
  { to: "/dashboard/messages", end: false, label: "Contact Messages", icon: Mail },
  { to: "/dashboard/why-us", end: false, label: "Why Us", icon: Sparkles },
  { to: "/dashboard/studio", end: false, label: "Studio Equipment", icon: Video },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-icube-dark flex">
      <aside className="w-64 bg-icube-gray border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <img src="/icube-logo.svg" alt="ICUBE" className="h-8 w-auto" />
          <span className="font-display font-bold text-white uppercase text-sm">Dashboard</span>
        </div>
        <nav className="p-2 flex-1 overflow-y-auto">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                  isActive ? "bg-icube-gold/20 text-icube-gold" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-gray-500 text-xs truncate mb-2">{user?.email}</p>
          <a href="/" className="flex items-center gap-2 text-gray-400 text-sm hover:text-white mb-2">
            <Home size={16} /> Site
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 text-sm hover:text-red-400"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
