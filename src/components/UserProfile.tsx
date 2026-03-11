"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, type User } from "../AuthContext";
import { User as UserIcon, Settings, LogOut, ChevronDown } from "lucide-react";

function getDisplayName(user: User): string {
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0];
  return "User";
}

function getInitials(user: User): string {
  const name = getDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

type UserProfileProps = {
  onLogout?: () => void;
  /** Optional class for the trigger button wrapper */
  className?: string;
};

export default function UserProfile({ onLogout, className = "" }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!user) {
    return (
      <div
        className={`flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-2 ${className}`}
        aria-hidden
      >
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-gray-500">
          <UserIcon size={18} />
        </div>
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  async function handleLogout() {
    setOpen(false);
    await logout();
    onLogout?.();
  }

  return (
    <div className={`relative flex items-center justify-end ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-1 pr-2 py-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-icube-gold/50 transition-colors min-w-0"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open user menu"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-icube-gold/20 border border-icube-gold/40 flex items-center justify-center text-icube-gold text-sm font-semibold shrink-0">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-white truncate max-w-[120px] hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#1a2030] border border-white/10 shadow-xl shadow-black/30 py-1 z-50"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
          </div>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            role="menuitem"
          >
            <Settings size={16} className="shrink-0" />
            Account settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            role="menuitem"
          >
            <LogOut size={16} className="shrink-0" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
