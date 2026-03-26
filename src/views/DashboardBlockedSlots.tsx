"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, CalendarDays, Check, Clock, Trash2 } from "lucide-react";
import { api } from "@/api";
import BookingDatePicker from "@/components/BookingDatePicker";
import { getDateInputMax, getTodayInRegion } from "@/utils/bookingTimezone";

type Studio = { id: string; name: string };

type BlockedSlotDoc = {
  id: string;
  booking_date?: string | null;
  time_slot?: string | null;
  studio_id?: string | null;
  reason?: string | null;
  created_at?: unknown;
};

// 8:00 AM through 10:00 PM — one slot per hour (matches studio booking range)
const HOURLY_SLOTS: { value: string; label: string }[] = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = 8; h <= 22; h++) {
    const value = `${String(h).padStart(2, "0")}:00`;
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
    out.push({ value, label });
  }
  return out;
})();

function keyFor(date: string, slot: string, studioId: string | null) {
  return `${date}__${slot}__${studioId ?? "all"}`;
}

export default function DashboardBlockedSlots() {
  const dateMin = getTodayInRegion();
  const dateMax = getDateInputMax();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [allBlocked, setAllBlocked] = useState<BlockedSlotDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(dateMin);
  const [selectedStudioId, setSelectedStudioId] = useState<string>(""); // "" = all studios
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [pendingSlots, setPendingSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get<Studio[]>("/dashboard/studios").catch(() => [] as Studio[]),
      api.get<BlockedSlotDoc[]>("/dashboard/blocked-slots").catch(() => [] as BlockedSlotDoc[]),
    ])
      .then(([studioList, blocks]) => {
        if (cancelled) return;
        setStudios(Array.isArray(studioList) ? studioList : []);
        setAllBlocked(Array.isArray(blocks) ? blocks : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStudioIdOrNull = selectedStudioId ? selectedStudioId : null;

  const blocksForDateAndStudio = useMemo(() => {
    return allBlocked.filter((b) => {
      if (!b.booking_date || !b.time_slot) return false;
      if (b.booking_date !== selectedDate) return false;
      const studio = (b.studio_id ?? null) as string | null;
      // On this screen we show only blocks that match the selected studio scope
      return studio === selectedStudioIdOrNull;
    });
  }, [allBlocked, selectedDate, selectedStudioIdOrNull]);

  const blockByKey = useMemo(() => {
    const m = new Map<string, BlockedSlotDoc>();
    for (const b of blocksForDateAndStudio) {
      if (!b.booking_date || !b.time_slot) continue;
      m.set(keyFor(b.booking_date, b.time_slot, (b.studio_id ?? null) as string | null), b);
    }
    return m;
  }, [blocksForDateAndStudio]);

  const existingSlotSet = useMemo(() => {
    return new Set(blocksForDateAndStudio.map((b) => String(b.time_slot ?? "")).filter(Boolean));
  }, [blocksForDateAndStudio]);

  useEffect(() => {
    // When changing date/scope or refreshing, reset the pending selection to what's currently saved.
    setPendingSlots(new Set(existingSlotSet));
  }, [selectedDate, selectedStudioIdOrNull, existingSlotSet]);

  async function refreshBlocks() {
    const blocks = await api.get<BlockedSlotDoc[]>("/dashboard/blocked-slots").catch(() => [] as BlockedSlotDoc[]);
    setAllBlocked(Array.isArray(blocks) ? blocks : []);
  }

  function toggleSlot(slotValue: string) {
    setPendingSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotValue)) next.delete(slotValue);
      else next.add(slotValue);
      return next;
    });
  }

  function clearAllForSelection() {
    setPendingSlots(new Set());
  }

  const selectedCount = pendingSlots.size;
  const isDirty = useMemo(() => {
    if (pendingSlots.size !== existingSlotSet.size) return true;
    for (const s of pendingSlots) if (!existingSlotSet.has(s)) return true;
    return false;
  }, [pendingSlots, existingSlotSet]);

  async function saveChanges() {
    if (!selectedDate) return;
    if (!isDirty) return;
    setSaving(true);
    try {
      const toCreate = Array.from(pendingSlots).filter((s) => !existingSlotSet.has(s));
      const toDelete = Array.from(existingSlotSet).filter((s) => !pendingSlots.has(s));

      // delete first
      for (const slotValue of toDelete) {
        const k = keyFor(selectedDate, slotValue, selectedStudioIdOrNull);
        const existing = blockByKey.get(k);
        if (existing?.id) await api.delete(`/dashboard/blocked-slots/${existing.id}`);
      }
      // then create
      for (const slotValue of toCreate) {
        await api.post("/dashboard/blocked-slots", {
          booking_date: selectedDate,
          time_slot: slotValue,
          studio_id: selectedStudioIdOrNull,
          reason: reason.trim() ? reason.trim() : null,
        });
      }

      await refreshBlocks();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white">
            Blocked time slots
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Disable specific hours for bookings (maintenance, private sessions, setup time, etc.).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearAllForSelection}
            disabled={saving || selectedCount === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} className="text-gray-300" />
            Clear ({selectedCount})
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-xl border border-icube-gold/35 bg-icube-gold/15 px-4 py-2.5 text-sm font-semibold text-icube-gold hover:bg-icube-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            Save
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">
              <CalendarDays size={14} className="text-icube-gold" />
              Date
            </label>
            <div className="mt-2 max-w-sm">
              <BookingDatePicker
                value={selectedDate}
                onChange={(d) => setSelectedDate(d ?? dateMin)}
                min={dateMin}
                max={dateMax}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">
              <Ban size={14} className="text-icube-gold" />
              Scope
            </label>
            <select
              value={selectedStudioId}
              onChange={(e) => setSelectedStudioId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
            >
              <option value="">All studios</option>
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              “All studios” blocks packages too. Selecting a studio blocks only that studio.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">
              <Clock size={14} className="text-icube-gold" />
              Reason (optional)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. maintenance, private booking, equipment setup…"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-icube-gold/50"
            />
            <p className="mt-2 text-xs text-gray-500">Used for new blocks when you press Save.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-white">Select hours to block</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click an hour to toggle block/unblock for {selectedDate}.
            </p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="h-4 w-4 rounded-full border-2 border-icube-gold border-t-transparent animate-spin" />
              Loading…
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {HOURLY_SLOTS.map((s) => {
            const isBlocked = pendingSlots.has(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSlot(s.value)}
                disabled={saving || !selectedDate}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  isBlocked
                    ? "border-red-500/40 bg-red-500/10 text-red-200 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                    : "border-white/12 bg-black/25 text-gray-200 hover:bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{s.label}</span>
                  <span className={`text-[10px] uppercase tracking-wider ${isBlocked ? "text-red-300" : "text-gray-500"}`}>
                    {isBlocked ? "Blocked" : "Open"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedCount > 0 ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-white">Blocked summary</p>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
              {Array.from(pendingSlots)
                .slice()
                .sort((a, b) => String(a).localeCompare(String(b)))
                .map((slot) => {
                  const k = keyFor(selectedDate, slot, selectedStudioIdOrNull);
                  const existing = blockByKey.get(k);
                  return (
                    <li key={k} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className="font-medium">{slot}</span>
                      <span className="text-gray-500 truncate">{existing?.reason || "—"}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

