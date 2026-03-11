import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";

type Studio = {
  id: number;
  name: string;
  short_description: string;
  details: string;
  price_aed_per_hour: number;
  capacity: number;
  size_sqm: number;
  cover_image_url: string;
  sort_order: number;
  images: { image_url: string; caption: string | null; sort_order: number }[];
};

const emptyStudio: Omit<Studio, "id" | "images"> & { imagesText: string } = {
  name: "",
  short_description: "",
  details: "",
  price_aed_per_hour: 350,
  capacity: 4,
  size_sqm: 25,
  cover_image_url: "",
  sort_order: 0,
  imagesText: "",
};

function imagesToText(images: Studio["images"]) {
  return images.map((i) => i.image_url).join("\n");
}

function textToImages(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((image_url) => ({ image_url }));
}

export default function DashboardStudios() {
  const [list, setList] = useState<Studio[]>([]);
  const [editing, setEditing] = useState<(Studio & { imagesText: string }) | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Studio[]>("/dashboard/studios").then(setList).catch(() => {});
  }

  useEffect(() => load(), []);

  const sorted = useMemo(() => [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [list]);

  function openCreate() {
    setCreating(true);
    setEditing({ ...(emptyStudio as any), id: -1, images: [], imagesText: "" });
  }

  function openEdit(s: Studio) {
    setCreating(false);
    setEditing({ ...s, imagesText: imagesToText(s.images) });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      name: editing.name,
      short_description: editing.short_description,
      details: editing.details,
      price_aed_per_hour: Number(editing.price_aed_per_hour),
      capacity: Number(editing.capacity),
      size_sqm: Number(editing.size_sqm),
      cover_image_url: editing.cover_image_url,
      sort_order: Number(editing.sort_order ?? 0),
      images: textToImages(editing.imagesText),
    };
    try {
      if (creating) {
        await api.post("/dashboard/studios", payload);
      } else {
        await api.put(`/dashboard/studios/${editing.id}`, payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this studio?")) return;
    try {
      await api.delete(`/dashboard/studios/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Studios Gallery</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
          Add Studio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((s) => (
          <div key={s.id} className="bg-icube-gray border border-white/10 rounded-sm overflow-hidden">
            <img src={s.cover_image_url} alt={s.name} className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
              <div className="p-4">
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-gray-500 text-sm line-clamp-2">{s.short_description}</p>
                <p className="text-icube-gold text-sm mt-2">{s.price_aed_per_hour} AED/hr</p>
                <div className="flex gap-2 mt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                    aria-label="Edit studio"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                    aria-label="Delete studio"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-2xl w-full space-y-4 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-display font-bold text-white">{creating ? "Add Studio" : "Edit Studio"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing((x) => (x ? { ...x, name: e.target.value } : null))}
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cover Image URL</label>
                <input
                  value={editing.cover_image_url}
                  onChange={(e) => setEditing((x) => (x ? { ...x, cover_image_url: e.target.value } : null))}
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Price (AED/hr)</label>
                <input
                  type="number"
                  value={editing.price_aed_per_hour}
                  onChange={(e) => setEditing((x) => (x ? { ...x, price_aed_per_hour: Number(e.target.value) } : null))}
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Capacity</label>
                <input
                  type="number"
                  value={editing.capacity}
                  onChange={(e) => setEditing((x) => (x ? { ...x, capacity: Number(e.target.value) } : null))}
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Size (m²)</label>
                <input
                  type="number"
                  value={editing.size_sqm}
                  onChange={(e) => setEditing((x) => (x ? { ...x, size_sqm: Number(e.target.value) } : null))}
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sort order</label>
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) => setEditing((x) => (x ? { ...x, sort_order: Number(e.target.value) } : null))}
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Short description</label>
              <textarea
                value={editing.short_description}
                onChange={(e) => setEditing((x) => (x ? { ...x, short_description: e.target.value } : null))}
                rows={2}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Details (shown in popup)</label>
              <textarea
                value={editing.details}
                onChange={(e) => setEditing((x) => (x ? { ...x, details: e.target.value } : null))}
                rows={4}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Gallery images (one URL per line)</label>
              <textarea
                value={editing.imagesText}
                onChange={(e) => setEditing((x) => (x ? { ...x, imagesText: e.target.value } : null))}
                rows={6}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white font-mono text-sm"
                placeholder="https://...\nhttps://..."
              />
            </div>

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

