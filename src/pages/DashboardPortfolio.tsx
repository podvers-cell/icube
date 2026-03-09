import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Project = { id: number; title: string; category: string; image_url: string; sort_order: number };

export default function DashboardPortfolio() {
  const [list, setList] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);

  function load() {
    api.get<Project[]>("/dashboard/portfolio").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/dashboard/portfolio/${editing.id}`, editing);
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/dashboard/portfolio/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Portfolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
          <div key={p.id} className="bg-icube-gray border border-white/10 rounded-sm overflow-hidden">
            <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <p className="font-semibold text-white">{p.title}</p>
              <p className="text-gray-500 text-sm">{p.category}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditing({ ...p })}
                  className="px-3 py-1.5 text-sm bg-icube-gold text-icube-dark rounded-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">Edit Project</h2>
            <input
              value={editing.title}
              onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Title"
            />
            <input
              value={editing.category}
              onChange={(e) => setEditing((x) => (x ? { ...x, category: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Category"
            />
            <input
              value={editing.image_url}
              onChange={(e) => setEditing((x) => (x ? { ...x, image_url: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Image URL"
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
