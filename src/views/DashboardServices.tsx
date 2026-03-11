"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";

type Service = { id: number; title: string; description: string; icon: string; sort_order: number };

const ICONS = ["Mic", "MonitorPlay", "Share2", "Video", "Clapperboard"];

export default function DashboardServices() {
  const [list, setList] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Service[]>("/dashboard/services").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      if (creating) {
        await api.post("/dashboard/services", {
          title: editing.title,
          description: editing.description,
          icon: editing.icon,
          sort_order: editing.sort_order ?? list.length,
        });
      } else {
        await api.put(`/dashboard/services/${editing.id}`, editing);
      }
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  function openCreate() {
    setCreating(true);
    setEditing({
      id: 0,
      title: "",
      description: "",
      icon: ICONS[0],
      sort_order: list.length,
    });
  }

  async function remove(id: number) {
    if (!confirm("Delete this service?")) return;
    try {
      await api.delete(`/dashboard/services/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Services</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage the production services shown on the public website.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Service
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No services yet.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create the first service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((s) => (
            <div
              key={s.id}
              className="bg-icube-gray border border-white/10 rounded-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="text-gray-500 text-sm line-clamp-1">{s.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing({ ...s });
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                  aria-label="Edit service"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                  aria-label="Delete service"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">
              {creating ? "Add Service" : "Edit Service"}
            </h2>
            <input
              value={editing.title}
              onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Title"
            />
            <textarea
              value={editing.description}
              onChange={(e) => setEditing((x) => (x ? { ...x, description: e.target.value } : null))}
              rows={3}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Description"
            />
            <select
              value={editing.icon}
              onChange={(e) => setEditing((x) => (x ? { ...x, icon: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
            >
              {ICONS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
                Save
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
