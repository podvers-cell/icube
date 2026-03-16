"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { api } from "../api";

type DiscountCode = {
  id: string;
  code: string;
  percent: number;
  max_uses: number;
  used_count: number;
  valid_until?: string | null;
  active?: boolean;
};

export default function DashboardDiscountCodes() {
  const [list, setList] = useState<DiscountCode[]>([]);
  const [editing, setEditing] = useState<DiscountCode | null>(null);

  const isCreating = editing != null && !editing.id;

  function load() {
    api
      .get<DiscountCode[]>("/dashboard/discount-codes")
      .then(setList)
      .catch(() => {});
  }

  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = {
        code: editing.code.trim().toUpperCase(),
        percent: Number(editing.percent) || 0,
        max_uses: Number(editing.max_uses) || 1,
        used_count: editing.used_count ?? 0,
        valid_until: editing.valid_until || null,
        active: editing.active ?? true,
      };
      if (!payload.code) {
        alert("Code is required.");
        return;
      }
      if (payload.percent <= 0 || payload.percent > 100) {
        alert("Percent must be between 1 and 100.");
        return;
      }
      if (isCreating) {
        await api.post("/dashboard/discount-codes", payload);
      } else {
        await api.put(`/dashboard/discount-codes/${editing.id}`, payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save discount code.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this discount code?")) return;
    try {
      await api.delete(`/dashboard/discount-codes/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  async function toggleActive(dc: DiscountCode) {
    try {
      await api.put(`/dashboard/discount-codes/${dc.id}`, { active: !dc.active });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Discount Codes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage percentage-based promo codes. Codes can be limited by total uses and optional expiry date.
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: "",
              code: "",
              percent: 10,
              max_uses: 1,
              used_count: 0,
              valid_until: "",
              active: true,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          <Plus size={18} /> Add code
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No discount codes yet.</p>
          <button
            onClick={() =>
              setEditing({
                id: "",
                code: "",
                percent: 10,
                max_uses: 1,
                used_count: 0,
                valid_until: "",
                active: true,
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            <Plus size={18} /> Create first code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((dc) => {
            const remaining =
              typeof dc.max_uses === "number" && typeof dc.used_count === "number"
                ? Math.max(dc.max_uses - dc.used_count, 0)
                : undefined;
            const expired =
              dc.valid_until && new Date(dc.valid_until).getTime() < Date.now();
            return (
              <div key={dc.id} className="bg-icube-gray border border-white/10 rounded-sm p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-white text-lg tracking-wide">
                      {dc.code}
                    </p>
                    <p className="text-icube-gold text-sm font-semibold">
                      {dc.percent}% off
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Uses: {dc.used_count ?? 0} / {dc.max_uses ?? 1}
                      {remaining !== undefined && remaining === 0 && " · fully used"}
                    </p>
                    {dc.valid_until && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        Valid until:{" "}
                        {new Date(dc.valid_until).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {expired && " · expired"}
                      </p>
                    )}
                    {!dc.active && (
                      <p className="text-xs text-red-400 mt-1">Inactive</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    <button
                      type="button"
                      onClick={() => toggleActive(dc)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                      aria-label={dc.active ? "Deactivate" : "Activate"}
                    >
                      {dc.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...dc })}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                      aria-label="Edit code"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(dc.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                      aria-label="Delete code"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">
              {isCreating ? "Add discount code" : "Edit discount code"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Code
                </label>
                <input
                  value={editing.code}
                  onChange={(e) =>
                    setEditing((x) => (x ? { ...x, code: e.target.value.toUpperCase() } : null))
                  }
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                  placeholder="ICUBE10"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Percent (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editing.percent}
                  onChange={(e) =>
                    setEditing((x) => (x ? { ...x, percent: Number(e.target.value) } : null))
                  }
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                  placeholder="10"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Max uses
                </label>
                <input
                  type="number"
                  min={1}
                  value={editing.max_uses}
                  onChange={(e) =>
                    setEditing((x) => (x ? { ...x, max_uses: Number(e.target.value) } : null))
                  }
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                  placeholder="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Valid until (optional)
                </label>
                <input
                  type="date"
                  value={editing.valid_until ?? ""}
                  onChange={(e) =>
                    setEditing((x) => (x ? { ...x, valid_until: e.target.value || "" } : null))
                  }
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="dc-active"
                type="checkbox"
                checked={editing.active ?? true}
                onChange={(e) =>
                  setEditing((x) => (x ? { ...x, active: e.target.checked } : null))
                }
                className="h-4 w-4"
              />
              <label htmlFor="dc-active" className="text-xs text-gray-300">
                Active
              </label>
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

