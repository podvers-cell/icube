import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Testimonial = { id: number; quote: string; author: string; role: string; image_url: string; sort_order: number };

export default function DashboardTestimonials() {
  const [list, setList] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const isCreating = editing && editing.id === 0;

  function load() {
    api.get<Testimonial[]>("/dashboard/testimonials").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id === 0) {
        await api.post("/dashboard/testimonials", {
          quote: editing.quote,
          author: editing.author,
          role: editing.role,
          image_url: editing.image_url,
          sort_order: editing.sort_order ?? list.length,
        });
      } else {
        await api.put(`/dashboard/testimonials/${editing.id}`, editing);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Testimonials</h1>
          <p className="text-gray-500 text-sm mt-1">Client quotes displayed on the landing page.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 0,
              quote: "",
              author: "",
              role: "",
              image_url: "",
              sort_order: list.length,
            })
          }
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Testimonial
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No testimonials yet.</p>
          <button
            onClick={() =>
              setEditing({
                id: 0,
                quote: "",
                author: "",
                role: "",
                image_url: "",
                sort_order: list.length,
              })
            }
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create first testimonial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((t) => (
            <div key={t.id} className="bg-icube-gray border border-white/10 rounded-sm p-4 flex gap-4">
              <img src={t.image_url} alt={t.author} className="w-14 h-14 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm line-clamp-2">{t.quote}</p>
                <p className="font-semibold text-white mt-1">{t.author}</p>
                <p className="text-icube-gold text-xs">{t.role}</p>
              </div>
              <button
                onClick={() => setEditing({ ...t })}
                className="px-3 py-1.5 text-sm bg-icube-gold text-icube-dark rounded-sm shrink-0"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-lg w-full space-y-4">
            <h2 className="text-xl font-display font-bold text-white">
              {isCreating ? "Add Testimonial" : "Edit Testimonial"}
            </h2>
            <textarea
              value={editing.quote}
              onChange={(e) => setEditing((x) => (x ? { ...x, quote: e.target.value } : null))}
              rows={3}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Quote"
            />
            <input
              value={editing.author}
              onChange={(e) => setEditing((x) => (x ? { ...x, author: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Author"
            />
            <input
              value={editing.role}
              onChange={(e) => setEditing((x) => (x ? { ...x, role: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Role"
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
