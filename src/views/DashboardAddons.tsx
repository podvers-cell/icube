"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { api } from "../api";
import type { BookingAddon } from "../api";

type AddonForm = BookingAddon & { id: string };

export default function DashboardAddons() {
  const [list, setList] = useState<AddonForm[]>([]);
  const [editing, setEditing] = useState<AddonForm | null>(null);
  const isCreating = editing && !editing.id;

  function load() {
    api.get<AddonForm[]>("/dashboard/addons").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      if (isCreating) {
        const { id: _id, ...payload } = editing;
        await api.post("/dashboard/addons", { ...payload, sort_order: payload.sort_order ?? list.length });
      } else {
        await api.put(`/dashboard/addons/${editing.id}`, editing);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this add-on?")) return;
    try {
      await api.delete(`/dashboard/addons/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Booking Add-ons (AED)</h1>
          <p className="text-gray-500 text-sm mt-1">Optional extras shown during studio and package checkout.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: "",
              name: "",
              description: "",
              price_aed: 0,
              sort_order: list.length,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          <Plus size={18} /> Add Add-on
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No add-ons yet.</p>
          <button
            onClick={() =>
              setEditing({
                id: "",
                name: "",
                description: "",
                price_aed: 0,
                sort_order: 0,
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            <Plus size={18} /> Create first add-on
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => (
            <div key={a.id} className="bg-icube-gray border border-white/10 rounded-sm p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{a.name}</p>
                  <p className="text-icube-gold text-xl font-bold">{a.price_aed} AED</p>
                  {a.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{a.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...a })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                    aria-label="Edit add-on"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                    aria-label="Delete add-on"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">
              {isCreating ? "Add Add-on (AED)" : "Edit Add-on (AED)"}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                value={editing.name}
                onChange={(e) => setEditing((x) => (x ? { ...x, name: e.target.value } : null))}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                placeholder="e.g. Extra camera operator"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing((x) => (x ? { ...x, description: e.target.value } : null))}
                rows={3}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                placeholder="Short description for the booking page"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Price (AED)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={editing.price_aed}
                onChange={(e) => setEditing((x) => (x ? { ...x, price_aed: Number(e.target.value) } : null))}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Sort order
              </label>
              <input
                type="number"
                min={0}
                value={editing.sort_order ?? 0}
                onChange={(e) => setEditing((x) => (x ? { ...x, sort_order: Number(e.target.value) } : null))}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                placeholder="0 = first"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
