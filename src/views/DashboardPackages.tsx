"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";

type Pkg = {
  id: number | string;
  name: string;
  price_before_aed?: number; // optional strikethrough/original price
  price_aed: number;
  price_after?: string; // optional suffix e.g. "/ session"
  duration: string;
  features: string;
  is_popular: number;
  sort_order: number;
  description?: string;
  best_for_label?: string;
  category?: string;
};

export default function DashboardPackages() {
  const [list, setList] = useState<Pkg[]>([]);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const isCreating = editing && editing.id === 0;
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  async function remove(id: number | string) {
    if (!confirm("Delete this package?")) return;
    try {
      await api.delete(`/dashboard/packages/${String(id)}`);
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
              price_before_aed: 0,
              price_aed: 0,
              price_after: "",
              duration: "",
              features: "[]",
              is_popular: 0,
              sort_order: list.length,
              description: "",
              best_for_label: "",
              category: "uncategorized",
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
                price_before_aed: 0,
                price_aed: 0,
                price_after: "",
                duration: "",
                features: "[]",
                is_popular: 0,
                sort_order: 0,
                description: "",
                best_for_label: "",
                category: "uncategorized",
              })
            }
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create first package
          </button>
        </div>
      ) : (
        null
      )}

      {list.length > 0 && (() => {
        const categories = Array.from(
          new Set(list.map((p) => (p.category?.trim() ? p.category.trim() : "uncategorized")).filter(Boolean))
        ).sort();
        const filteredList =
          categoryFilter === "all"
            ? list
            : list.filter((p) => (p.category?.trim() ? p.category.trim() : "uncategorized") === categoryFilter);
        return (
          <>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-semibold text-gray-300">Filter by category:</label>
              <select
                className="bg-black/50 border border-white/10 text-white rounded-sm px-3 py-2"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            {filteredList.length === 0 ? (
              <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-6 text-center text-gray-400">
                No packages for this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...filteredList]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((p) => (
                    <div key={p.id} className="bg-icube-gray border border-white/10 rounded-sm p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs uppercase tracking-wider text-gray-400">
                              {(p.category?.trim() ? p.category.trim() : "uncategorized").replace(/-/g, " ")}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2 flex-wrap mt-2">
                            {p.price_before_aed != null && p.price_before_aed > 0 && (
                              <span className="text-gray-500 text-sm line-through">{p.price_before_aed} AED</span>
                            )}
                            {p.price_aed > 0 ? (
                              <span className="text-icube-gold font-bold">{p.price_aed} AED</span>
                            ) : p.price_after?.trim() ? (
                              <span className="text-icube-gold font-bold">{p.price_after.trim()} AED</span>
                            ) : null}
                            {p.price_after && p.price_aed > 0 && <span className="text-gray-500 text-sm">{p.price_after}</span>}
                          </div>
                          <p className="text-gray-600 text-xs mt-1">Order: {p.sort_order}</p>
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
          </>
        );
      })()}

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">
              {isCreating ? "Add Package (AED)" : "Edit Package (AED)"}
            </h2>
            {/* 0. Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Category</label>
              <input
                value={editing.category ?? ""}
                onChange={(e) => setEditing((x) => (x ? { ...x, category: e.target.value } : null))}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                placeholder="e.g. studio-rental-packages"
                list="package-category-suggestions"
              />
              <datalist id="package-category-suggestions">
                <option value="social-media-packages" />
                <option value="studio-rental-packages" />
                <option value="corporate-packages" />
                <option value="podcast-packages" />
                <option value="video-production-packages" />
                <option value="photography-packages" />
                <option value="uncategorized" />
              </datalist>
            </div>
            {/* 1. Package name */}
            <input
              value={editing.name}
              onChange={(e) => setEditing((x) => (x ? { ...x, name: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Package name"
            />
            {/* 2. Before price (optional) */}
            <input
              type="number"
              min={0}
              value={editing.price_before_aed == null || editing.price_before_aed === 0 ? "" : editing.price_before_aed}
              onChange={(e) =>
                setEditing((x) =>
                  x ? { ...x, price_before_aed: e.target.value === "" ? 0 : Number(e.target.value) } : null
                )
              }
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Before price (AED) – optional, e.g. original price"
            />
            {/* 3. After price (suffix) */}
            <input
              value={editing.price_after ?? ""}
              onChange={(e) => setEditing((x) => (x ? { ...x, price_after: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="After price (e.g. / session, per hour)"
            />
            {/* 4. Features */}
            <textarea
              value={parseFeatures(editing.features).join("\n")}
              onChange={(e) =>
                setEditing((x) =>
                  x ? { ...x, features: JSON.stringify(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)) } : null
                )
              }
              rows={4}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white font-mono text-sm"
              placeholder="One feature per line"
            />
            {/* 5. Most popular choice */}
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={!!editing.is_popular}
                onChange={(e) => setEditing((x) => (x ? { ...x, is_popular: e.target.checked ? 1 : 0 } : null))}
              />
              Most popular choice
            </label>
            {/* 6. Description */}
            <textarea
              value={editing.description ?? ""}
              onChange={(e) => setEditing((x) => (x ? { ...x, description: e.target.value } : null))}
              rows={3}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Description"
            />
            {/* 7. Best for label */}
            <input
              value={editing.best_for_label ?? ""}
              onChange={(e) => setEditing((x) => (x ? { ...x, best_for_label: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Best for (e.g. Podcasters, Brands)"
            />
            {/* 8. Display order */}
            <input
              type="number"
              min={0}
              value={editing.sort_order === 0 ? "" : editing.sort_order}
              onChange={(e) =>
                setEditing((x) => (x ? { ...x, sort_order: Math.max(0, Number(e.target.value) || 0) } : null))
              }
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Display order (0 = first)"
            />
            {/* 9. CTA */}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
                {isCreating ? "Add Package" : "Save Package"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-sm">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
