import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Service = { id: number; title: string; description: string; icon: string; sort_order: number };

const ICONS = ["Mic", "MonitorPlay", "Share2", "Video", "Clapperboard"];

export default function DashboardServices() {
  const [list, setList] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);

  function load() {
    api.get<Service[]>("/dashboard/services").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/dashboard/services/${editing.id}`, editing);
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Services</h1>
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
            <button
              onClick={() => setEditing({ ...s })}
              className="px-3 py-1.5 text-sm bg-white/10 rounded-sm hover:bg-icube-gold hover:text-icube-dark"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">Edit Service</h2>
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
