import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Equipment = { id: number; label: string; description: string; sort_order: number };

export default function DashboardStudio() {
  const [list, setList] = useState<Equipment[]>([]);
  const [editing, setEditing] = useState<Equipment | null>(null);

  function load() {
    api.get<Equipment[]>("/dashboard/studio-equipment").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/dashboard/studio-equipment/${editing.id}`, editing);
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Studio Equipment</h1>
      <div className="space-y-4">
        {list.map((e) => (
          <div key={e.id} className="bg-icube-gray border border-white/10 rounded-sm p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-white">{e.label}</p>
              <p className="text-gray-500 text-sm">{e.description}</p>
            </div>
            <button onClick={() => setEditing({ ...e })} className="px-3 py-1.5 text-sm bg-icube-gold text-icube-dark rounded-sm">Edit</button>
          </div>
        ))}
      </div>
      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">Edit Equipment</h2>
            <input value={editing.label} onChange={(e) => setEditing((x) => (x ? { ...x, label: e.target.value } : null))} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" placeholder="Label" />
            <input value={editing.description} onChange={(e) => setEditing((x) => (x ? { ...x, description: e.target.value } : null))} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" placeholder="Description" />
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
