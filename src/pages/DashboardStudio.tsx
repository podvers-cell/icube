import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";

type Equipment = { id: number; label: string; description: string; sort_order: number };

export default function DashboardStudio() {
  const [list, setList] = useState<Equipment[]>([]);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const isCreating = editing && editing.id === 0;

  function load() {
    api.get<Equipment[]>("/dashboard/studio-equipment").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id === 0) {
        await api.post("/dashboard/studio-equipment", editing);
      } else {
        await api.put(`/dashboard/studio-equipment/${editing.id}`, editing);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this equipment item?")) return;
    try {
      await api.delete(`/dashboard/studio-equipment/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Studio Equipment</h1>
          <p className="text-gray-500 text-sm mt-1">Microphones, cameras, and other gear listed on the studio section.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 0,
              label: "",
              description: "",
              sort_order: list.length,
            })
          }
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Equipment
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No equipment items yet.</p>
          <button
            onClick={() =>
              setEditing({
                id: 0,
                label: "",
                description: "",
                sort_order: list.length,
              })
            }
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create first item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((e) => (
            <div key={e.id} className="bg-icube-gray border border-white/10 rounded-sm p-4 flex justify-between items-center gap-3">
              <div>
                <p className="font-semibold text-white">{e.label}</p>
                <p className="text-gray-500 text-sm">{e.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ ...e })}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                  aria-label="Edit equipment"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                  aria-label="Delete equipment"
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
              {isCreating ? "Add Equipment" : "Edit Equipment"}
            </h2>
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
