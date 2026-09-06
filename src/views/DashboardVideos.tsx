"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { isValidVideoUrl } from "../lib/videoEmbed";
import DashboardModal from "../components/dashboard/DashboardModal";
import { Button, Field, inputClass } from "../components/dashboard/ui";

type Video = { id: string; title: string; url: string; sort_order: number };

export default function DashboardVideos() {
  const [list, setList] = useState<Video[]>([]);
  const [editing, setEditing] = useState<Video | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Video[]>("/dashboard/videos").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) {
      alert("Enter video title");
      return;
    }
    if (!isValidVideoUrl(editing.url.trim())) {
      alert("Unsupported link. Use YouTube, Vimeo, Instagram, or a direct video URL (mp4/webm/mov).");
      return;
    }
    try {
      if (creating) {
        await api.post("/dashboard/videos", {
          title: editing.title.trim(),
          url: editing.url.trim(),
          sort_order: editing.sort_order ?? list.length,
        });
      } else {
        await api.put(`/dashboard/videos/${editing.id}`, {
          title: editing.title.trim(),
          url: editing.url.trim(),
          sort_order: editing.sort_order,
        });
      }
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  function openCreate() {
    setCreating(true);
    setEditing({
      id: "",
      title: "",
      url: "",
      sort_order: list.length,
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this video?")) return;
    try {
      await api.delete(`/dashboard/videos/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Showreel Videos</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Standalone videos for the Videos strip on the <strong className="text-gray-400">homepage</strong>. Just a
            title and a link each. For videos that belong to a specific project, use{" "}
            <strong className="text-gray-400">Portfolio</strong> instead.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add video
        </button>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-xl p-8 text-center text-gray-400">
          <p className="mb-3">No videos yet.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Add first video
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((v) => (
            <div
              key={v.id}
              className="border border-white/10 bg-white/[0.03] rounded-xl p-4 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{v.title}</p>
                <p className="text-gray-500 text-sm truncate">{v.url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing({ ...v });
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <DashboardModal
          title={creating ? "Add video" : "Edit video"}
          description="Shown in the Videos strip on the homepage."
          size="md"
          onClose={() => setEditing(null)}
          onSubmit={save}
          footer={
            <>
              <Button type="submit" tone="primary" className="max-sm:flex-1">
                Save video
              </Button>
              <Button type="button" tone="secondary" onClick={() => setEditing(null)} className="max-sm:flex-1">
                Cancel
              </Button>
            </>
          }
        >
          <Field label="Title">
            <input
              value={editing.title}
              onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
              className={inputClass}
              placeholder="Behind the scenes — Nike shoot"
            />
          </Field>

          <Field label="Video URL" hint="YouTube, Vimeo, Instagram, or a direct mp4 link such as Cloudinary.">
            <input
              value={editing.url}
              onChange={(e) => setEditing((x) => (x ? { ...x, url: e.target.value } : null))}
              className={inputClass}
              placeholder="https://youtube.com/watch?v=…"
            />
          </Field>
        </DashboardModal>
      )}
    </div>
  );
}
