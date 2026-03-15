"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useSiteData, invalidateSiteCache } from "../SiteDataContext";
import CloudinaryUploadField from "../components/CloudinaryUploadField";

type Project = {
  id: number | string;
  title: string;
  category: string;
  /** Client or brand name (shown under title on portfolio page) */
  client?: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  visible?: boolean;
  show_in_selected_work?: boolean;
};

export default function DashboardPortfolio() {
  const { refresh } = useSiteData();
  const [list, setList] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const isCreating = editing && editing.id === 0;

  function load() {
    api.get<Project[]>("/dashboard/portfolio").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id === 0) {
        await api.post("/dashboard/portfolio", {
          title: editing.title,
          category: editing.category,
          client: editing.client || undefined,
          image_url: editing.image_url,
          sort_order: editing.sort_order ?? list.length,
          video_url: editing.video_url || undefined,
          visible: editing.visible !== false,
          show_in_selected_work: !!editing.show_in_selected_work,
        });
      } else {
        await api.put(`/dashboard/portfolio/${editing.id}`, editing);
      }
      invalidateSiteCache();
      await refresh();
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: number | string) {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/dashboard/portfolio/${id}`);
      invalidateSiteCache();
      await refresh();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Portfolio</h1>
          <p className="text-gray-500 text-sm mt-1">Projects and case studies shown on the public site.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: 0,
              title: "",
              category: "",
              client: "",
              image_url: "",
              sort_order: list.length,
              video_url: "",
              visible: true,
              show_in_selected_work: false,
            })
          }
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Project
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No projects yet.</p>
          <button
            onClick={() =>
              setEditing({
                id: 0,
                title: "",
                category: "",
                client: "",
                image_url: "",
                sort_order: list.length,
                video_url: "",
                visible: true,
                show_in_selected_work: false,
              })
            }
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <div key={p.id} className="bg-icube-gray border border-white/10 rounded-sm overflow-hidden">
              <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{p.title}</p>
                  {p.visible === false && (
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Hidden</span>
                  )}
                  {p.show_in_selected_work && (
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-icube-gold/20 text-icube-gold">Selected Work</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{p.client || p.category}</p>
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...p })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                    aria-label="Edit project"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                    aria-label="Delete project"
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
              {isCreating ? "Add Project" : "Edit Project"}
            </h2>
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
              placeholder="Category (e.g. Commercial, Product)"
            />
            <input
              value={editing.client ?? ""}
              onChange={(e) => setEditing((x) => (x ? { ...x, client: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Client / Brand (optional; shown under title on portfolio page)"
            />
            <CloudinaryUploadField
              label="Image URL"
              value={editing.image_url}
              onChange={(url) => setEditing((x) => (x ? { ...x, image_url: url } : null))}
              type="image"
              folder="portfolio"
              placeholder="https://… or click Upload"
            />
            <CloudinaryUploadField
              label="Video URL (optional; YouTube/Vimeo or upload)"
              value={editing.video_url ?? ""}
              onChange={(url) => setEditing((x) => (x ? { ...x, video_url: url } : null))}
              type="video"
              folder="portfolio"
              placeholder="https://… or click Upload"
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.visible !== false}
                onChange={(e) => setEditing((x) => (x ? { ...x, visible: e.target.checked } : null))}
                className="w-4 h-4 rounded border-white/20 bg-black/50 text-icube-gold focus:ring-icube-gold"
              />
              <span className="text-sm text-gray-300">Show work on site</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!editing.show_in_selected_work}
                onChange={(e) => setEditing((x) => (x ? { ...x, show_in_selected_work: e.target.checked } : null))}
                className="w-4 h-4 rounded border-white/20 bg-black/50 text-icube-gold focus:ring-icube-gold"
              />
              <span className="text-sm text-gray-300">Show in Selected Work on homepage</span>
            </label>
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
