"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";

type Pkg = { id: number; name: string; price_aed: number; duration: string; features: string; is_popular: number; sort_order: number };

export default function DashboardPackages() {
  const [list, setList] = useState<Pkg[]>([]);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const isCreating = editing && editing.id === 0;

  function load() {
    api.get<Pkg[]>("/dashboard/packages").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  function parseFeatures(s: string): string[] {
    try {
      const a = JSON.parse(s);
      return Array.isArray(a) ? a : [s];
    } catch {
      return [s];
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id === 0) {
        await api.post("/dashboard/packages", editing);
      } else {
        await api.put(`/dashboard/packages/${editing.id}`, editing);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this package?")) return;
    try {
      await api.delete(`/dashboard/packages/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Booking Packages (AED)</h1>
          <p className="text-gray-500 text-sm mt-1">Session bundles and pricing shown on the booking section.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 0,
              name: "",
              price_aed: 0,
              duration: "",
              features: "[]",
              is_popular: 0,
              sort_order: list.length,
            })
          }
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Package
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No booking packages yet.</p>
          <button
            onClick={() =>
              setEditing({
                id: 0,
                name: "",
                price_aed: 0,
                duration: "",
                features: "[]",
                is_popular: 0,
                sort_order: list.length,
              })
            }
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create first package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {list.map((p) => (
            <div key={p.id} className="bg-icube-gray border border-white/10 rounded-sm p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-icube-gold text-xl font-bold">{p.price_aed} AED</p>
                  <p className="text-gray-500 text-sm">{p.duration}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...p })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                    aria-label="Edit package"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                    aria-label="Delete package"
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
              {isCreating ? "Add Package (AED)" : "Edit Package (AED)"}
            </h2>
            <input
              value={editing.name}
              onChange={(e) => setEditing((x) => (x ? { ...x, name: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Name"
            />
            <input
              type="number"
              value={editing.price_aed}
              onChange={(e) => setEditing((x) => (x ? { ...x, price_aed: Number(e.target.value) } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Price (AED)"
            />
            <input
              value={editing.duration}
              onChange={(e) => setEditing((x) => (x ? { ...x, duration: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Duration"
            />
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={!!editing.is_popular}
                onChange={(e) => setEditing((x) => (x ? { ...x, is_popular: e.target.checked ? 1 : 0 } : null))}
              />
              Most popular
            </label>
            <textarea
              value={parseFeatures(editing.features).join("\n")}
              onChange={(e) =>
                setEditing((x) =>
                  x ? { ...x, features: JSON.stringify(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)) } : null
                )
              }
              rows={5}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white font-mono text-sm"
              placeholder="One feature per line"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
