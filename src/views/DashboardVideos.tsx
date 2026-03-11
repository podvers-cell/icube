"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { isValidVideoUrl } from "../lib/videoEmbed";

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
      alert("أدخل عنوان الفيديو");
      return;
    }
    if (!isValidVideoUrl(editing.url.trim())) {
      alert("رابط غير مدعوم. استخدم رابط YouTube أو Vimeo فقط.");
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
      alert(err instanceof Error ? err.message : "فشل الحفظ");
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
    if (!confirm("حذف هذا الفيديو؟")) return;
    try {
      await api.delete(`/dashboard/videos/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل الحذف");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">الفيديوهات</h1>
          <p className="text-gray-500 text-sm mt-1">أضف فيديوهات عبر روابط YouTube أو Vimeo تظهر في قسم الفيديوهات بالموقع.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          إضافة فيديو
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">لا توجد فيديوهات بعد.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            إضافة أول فيديو
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((v) => (
            <div
              key={v.id}
              className="bg-icube-gray border border-white/10 rounded-sm p-4 flex items-center justify-between"
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
                  aria-label="تعديل"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                  aria-label="حذف"
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
              {creating ? "إضافة فيديو" : "تعديل الفيديو"}
            </h2>
            <input
              value={editing.title}
              onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="عنوان الفيديو"
            />
            <input
              value={editing.url}
              onChange={(e) => setEditing((x) => (x ? { ...x, url: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="رابط YouTube أو Vimeo"
            />
            <p className="text-xs text-gray-500">مثال: https://www.youtube.com/watch?v=... أو https://vimeo.com/...</p>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
                حفظ
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-sm">
                إلغاء
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
