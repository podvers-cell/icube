"use client";

import { useEffect, useState } from "react";
import { api } from "../api";
import { Mail, RefreshCw } from "lucide-react";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read_at: string | null;
  created_at: { seconds: number; nanoseconds?: number } | string;
};

function createdAtDisplay(raw: ContactMessage["created_at"]): string {
  if (typeof raw === "string") return new Date(raw).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" });
  if (raw && typeof raw === "object") {
    if ("toDate" in raw && typeof (raw as { toDate: () => Date }).toDate === "function") return (raw as { toDate: () => Date }).toDate().toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" });
    if ("seconds" in raw) return new Date((raw as { seconds: number }).seconds * 1000).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" });
  }
  return "—";
}

export default function DashboardMessages() {
  const [list, setList] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    api
      .get<ContactMessage[]>("/dashboard/messages")
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function markRead(id: string) {
    try {
      await api.patch(`/dashboard/messages/${id}/read`);
      load();
      setSelected((s) => (s?.id === id ? { ...s, read_at: new Date().toISOString() } : s));
    } catch {}
  }

  function select(m: ContactMessage) {
    setSelected(m);
    if (!m.read_at) markRead(m.id);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Contact Messages</h1>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-icube-gray border border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Mail size={32} className="opacity-50" />
          <span className="ml-3">Loading messages…</span>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-icube-gray border border-white/10 rounded-lg p-12 text-center">
          <Mail size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No contact messages yet.</p>
          <p className="text-gray-500 text-sm mt-2">Messages from the site contact form will appear here (saved in Firebase).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            {list.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => select(m)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selected?.id === m.id ? "border-icube-gold bg-icube-gold/10" : "border-white/10 bg-icube-gray hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-white truncate">{m.subject || "No subject"}</span>
                  {!m.read_at && <span className="w-2 h-2 rounded-full bg-icube-gold shrink-0 mt-1.5" />}
                </div>
                <p className="text-gray-500 text-sm mt-1 truncate">{m.name} · {createdAtDisplay(m.created_at)}</p>
              </button>
            ))}
          </div>
          <div className="bg-icube-gray border border-white/10 rounded-lg p-6 min-h-[200px]">
            {selected ? (
              <>
                <h2 className="text-xl font-display font-bold text-white mb-2">{selected.subject || "No subject"}</h2>
                <p className="text-gray-400 text-sm mb-4">
                  {selected.name} &lt;{selected.email}&gt; · {createdAtDisplay(selected.created_at)}
                </p>
                <p className="text-gray-300 whitespace-pre-wrap">{selected.message}</p>
              </>
            ) : (
              <p className="text-gray-500">Select a message</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
