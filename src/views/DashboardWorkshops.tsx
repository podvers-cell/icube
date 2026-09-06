"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2, GraduationCap } from "lucide-react";
import { api } from "@/api";
import { invalidateSiteCache } from "@/SiteDataContext";
import CloudinaryUploadField from "@/components/CloudinaryUploadField";
import { uploadToCloudinaryWithProgress } from "@/lib/uploadCloudinary";
import MediaSlotList from "../components/dashboard/MediaSlotList";
import DashboardModal from "../components/dashboard/DashboardModal";
import { Button } from "../components/dashboard/ui";

type WorkshopImage = { image_url: string; caption?: string | null; sort_order?: number };

type Workshop = {
  id: string;
  title: string;
  price_aed: number;
  price_before_aed?: number;
  workshop_date?: string;
  short_description?: string;
  description?: string;
  cover_image_url?: string;
  sort_order?: number;
  duration_label?: string;
  group_size_label?: string;
  group_size_max?: number;
  sold_out_override?: boolean;
  level_label?: string;
  highlights?: string[];
  includes?: string[];
  images?: WorkshopImage[];
  video_urls?: string[];
  paid_enrollments_count?: number;
};

const emptyWorkshop: Workshop = {
  id: "",
  title: "",
  price_aed: 0,
  price_before_aed: 0,
  workshop_date: "",
  short_description: "",
  description: "",
  cover_image_url: "",
  sort_order: 0,
  duration_label: "",
  group_size_label: "",
  level_label: "",
  highlights: [],
  includes: [],
  images: [],
  video_urls: [],
};

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function safeParseImages(value: string): WorkshopImage[] {
  const raw = value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => (typeof x === "object" && x ? (x as WorkshopImage) : null))
      .filter(Boolean)
      .map((x) => ({
        image_url: String(x!.image_url ?? ""),
        caption: x!.caption != null ? String(x!.caption) : null,
        sort_order: x!.sort_order != null ? Number(x!.sort_order) : undefined,
      }))
      .filter((x) => Boolean(x.image_url));
  } catch {
    return [];
  }
}

export default function DashboardWorkshops() {
  const [list, setList] = useState<Workshop[]>([]);
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [galleryProgressLabel, setGalleryProgressLabel] = useState("");

  const [highlightsText, setHighlightsText] = useState("");
  const [includesText, setIncludesText] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [imagesJsonText, setImagesJsonText] = useState("");

  function load() {
    api.get<Workshop[]>("/dashboard/workshops").then((d) => setList(Array.isArray(d) ? d : [])).catch(() => {});
  }

  useEffect(() => load(), []);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  }, [list]);

  function openCreate() {
    setCreating(true);
    setEditing({ ...emptyWorkshop, sort_order: list.length });
    setHighlightsText("");
    setIncludesText("");
    setVideoUrls([]);
    setImagesJsonText("[]");
  }

  function openEdit(w: Workshop) {
    setCreating(false);
    setEditing({ ...w });
    setHighlightsText((w.highlights ?? []).join("\n"));
    setIncludesText((w.includes ?? []).join("\n"));
    setVideoUrls(w.video_urls ?? []);
    setImagesJsonText(JSON.stringify(w.images ?? [], null, 2));
  }

  // Open create/edit in a modal window (like Studios)
  const showModal = Boolean(editing);

  async function remove(id: string) {
    if (!confirm("Delete this workshop?")) return;
    try {
      await api.delete(`/dashboard/workshops/${id}`);
      invalidateSiteCache();
      load();
      if (editing?.id === id) setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) return alert("Title is required");
    const price = Number(editing.price_aed ?? 0);
    if (!Number.isFinite(price) || price <= 0) return alert("Price must be > 0");

    const groupSizeLabel = (editing.group_size_label ?? "").trim();
    const groupSizeMax = (() => {
      const nums = groupSizeLabel.match(/\d+/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) ?? [];
      return nums.length ? Math.max(...nums) : null;
    })();

    const payload = {
      title: editing.title.trim(),
      price_before_aed: Number(editing.price_before_aed ?? 0) || null,
      price_aed: price,
      workshop_date: (editing.workshop_date ?? "").trim(),
      short_description: (editing.short_description ?? "").trim(),
      description: (editing.description ?? "").trim(),
      cover_image_url: (editing.cover_image_url ?? "").trim(),
      sort_order: Number(editing.sort_order ?? 0),
      duration_label: (editing.duration_label ?? "").trim(),
      group_size_label: groupSizeLabel,
      group_size_max: groupSizeMax,
      sold_out_override: Boolean(editing.sold_out_override),
      level_label: (editing.level_label ?? "").trim(),
      highlights: parseLines(highlightsText),
      includes: parseLines(includesText),
      video_urls: videoUrls.map((v) => v.trim()).filter(Boolean),
      images: safeParseImages(imagesJsonText),
    };

    try {
      if (creating) await api.post("/dashboard/workshops", payload);
      else await api.put(`/dashboard/workshops/${editing.id}`, payload);
      invalidateSiteCache();
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function seedSample() {
    if (!confirm("Create 3 sample workshops in Firebase? (Only if your list is empty.)")) return;
    if (list.length > 0) {
      alert("Workshops already exist. Delete them first if you want to seed samples.");
      return;
    }
    try {
      const samples = [
        {
          id: "podcast-masterclass",
          title: "Podcast Masterclass",
          price_before_aed: 599,
          price_aed: 499,
          workshop_date: "2026-04-20",
          sort_order: 1,
          duration_label: "2–3 hours",
          group_size_label: "1–10 people",
          level_label: "Beginner → Intermediate",
          short_description: "Plan, record, and publish a professional podcast — fast.",
          description:
            "A practical, studio-based session covering setup, audio basics, framing, and an editing workflow you can repeat weekly.",
          cover_image_url: "",
          highlights: ["Mic technique & vocal clarity", "Lighting + framing basics", "Editing workflow (fast & clean)"],
          includes: ["Studio time", "Checklist + templates", "Q&A"],
          images: [],
          video_urls: [],
        },
        {
          id: "reels-shortform",
          title: "Reels & Short‑Form Content",
          price_before_aed: 499,
          price_aed: 399,
          workshop_date: "2026-04-27",
          sort_order: 2,
          duration_label: "2 hours",
          group_size_label: "1–10 people",
          level_label: "All levels",
          short_description: "Shoot and edit scroll‑stopping short videos with a repeatable formula.",
          description:
            "Learn hooks, filming patterns, and a clean editing pipeline. Ideal for founders and creators who want consistent output.",
          cover_image_url: "",
          highlights: ["Hook frameworks", "Camera settings (phone + camera)", "CapCut / Premiere basics"],
          includes: ["Templates", "Shot list examples", "Export settings"],
          images: [],
          video_urls: [],
        },
        {
          id: "brand-video",
          title: "Brand Video (Brief → Cut)",
          price_before_aed: 699,
          price_aed: 599,
          workshop_date: "2026-05-04",
          sort_order: 3,
          duration_label: "3 hours",
          group_size_label: "1–8 people",
          level_label: "Intermediate",
          short_description: "Understand pre‑production, directing, and how to get a premium look on set.",
          description:
            "We cover planning, shot lists, coverage, and the finishing touches (sound + color) that make content feel premium.",
          cover_image_url: "",
          highlights: ["Storyboard & shot planning", "Directing + B‑roll coverage", "Color + sound basics"],
          includes: ["Demo shoot", "Checklist", "Q&A"],
          images: [],
          video_urls: [],
        },
      ];
      // keep provided ids stable by using PUT with doc id
      for (const s of samples) {
        await api.put(`/dashboard/workshops/${s.id}`, s);
      }
      invalidateSiteCache();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Seeding failed");
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const total = files.length;
    setUploadingGallery(true);
    setGalleryProgress(0);
    setGalleryProgressLabel(`0/${total}`);
    try {
      const urls: string[] = [];
      for (let i = 0; i < total; i++) {
        setGalleryProgressLabel(`${i + 1}/${total}`);
        const url = await uploadToCloudinaryWithProgress(files[i], {
          folder: "workshops/gallery",
          type: "image",
          onProgress: (p) => setGalleryProgress(Math.round(((i + p / 100) / total) * 100)),
        });
        urls.push(url);
        setGalleryProgress(Math.round(((i + 1) / total) * 100));
      }

      const current = safeParseImages(imagesJsonText);
      const startOrder = current.length ? Math.max(...current.map((x) => Number(x.sort_order ?? 0))) + 1 : 1;
      const add = urls.map((u, idx) => ({ image_url: u, caption: null, sort_order: startOrder + idx }));
      setImagesJsonText(JSON.stringify([...current, ...add], null, 2));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingGallery(false);
      setGalleryProgress(0);
      setGalleryProgressLabel("");
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Workshops</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage workshops shown on the Home page. “Enroll now” will charge the workshop price via Ziina.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-icube-gold px-4 py-2.5 text-sm font-semibold text-icube-dark hover:bg-icube-gold-light transition-colors"
        >
          <GraduationCap size={16} />
          Add workshop
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center text-gray-400">
              No workshops yet.
            </div>
          ) : (
            sorted.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{w.title}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    AED {Number(w.price_aed ?? 0)} · Sort {Number(w.sort_order ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(w)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(w.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 border border-red-500/25 text-red-200 hover:border-red-400/60 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal ? (
        <DashboardModal
          title={creating ? "Add workshop" : "Edit workshop"}
          description="Workshops customers can enrol in and pay for."
          size="xl"
          onClose={() => {
                setEditing(null);
                setCreating(false);
              }}
          onSubmit={save}
          footer={
            <>
              <Button type="submit" tone="primary" className="max-sm:flex-1">
                Save workshop
              </Button>
              <Button type="button" tone="secondary" onClick={() => {
                setEditing(null);
                setCreating(false);
              }} className="max-sm:flex-1">
                Cancel
              </Button>
            </>
          }
        >
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Workshop card</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Title</label>
                      <input
                        value={editing?.title ?? ""}
                        onChange={(e) => setEditing((s) => (s ? { ...s, title: e.target.value } : s))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                        placeholder="e.g. Podcast Masterclass"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Workshop date (YYYY-MM-DD)</label>
                      <input
                        value={editing?.workshop_date ?? ""}
                        onChange={(e) => setEditing((s) => (s ? { ...s, workshop_date: e.target.value } : s))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                        placeholder="2026-04-20"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <CloudinaryUploadField
                      label="Cover image URL (workshop card)"
                      value={editing?.cover_image_url ?? ""}
                      onChange={(url) => setEditing((s) => (s ? { ...s, cover_image_url: url } : s))}
                      type="image"
                      folder="workshops"
                      placeholder="https://… or click Upload"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Before price (AED)</label>
                      <input
                        value={String(editing?.price_before_aed ?? "")}
                        onChange={(e) => setEditing((s) => (s ? { ...s, price_before_aed: Number(e.target.value) } : s))}
                        type="number"
                        min={0}
                        step="1"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional (shows as strikethrough).</p>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">After price (AED)</label>
                      <input
                        value={String(editing?.price_aed ?? "")}
                        onChange={(e) => setEditing((s) => (s ? { ...s, price_aed: Number(e.target.value) } : s))}
                        type="number"
                        min={0}
                        step="1"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Duration label</label>
                      <input
                        value={editing?.duration_label ?? ""}
                        onChange={(e) => setEditing((s) => (s ? { ...s, duration_label: e.target.value } : s))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                        placeholder="e.g. 2–3 hours"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Group size label</label>
                      <input
                        value={editing?.group_size_label ?? ""}
                        onChange={(e) => setEditing((s) => (s ? { ...s, group_size_label: e.target.value } : s))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                        placeholder="e.g. 1–10 people"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Level label</label>
                      <input
                        value={editing?.level_label ?? ""}
                        onChange={(e) => setEditing((s) => (s ? { ...s, level_label: e.target.value } : s))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                        placeholder="e.g. Beginner → Intermediate"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Sort order</label>
                      <input
                        value={String(editing?.sort_order ?? 0)}
                        onChange={(e) => setEditing((s) => (s ? { ...s, sort_order: Number(e.target.value) } : s))}
                        type="number"
                        step="1"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Sold out</p>
                      <p className="text-xs text-gray-500">Manually disable enrollment for this workshop.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(editing?.sold_out_override)}
                        onChange={(e) => setEditing((s) => (s ? { ...s, sold_out_override: e.target.checked } : s))}
                        className="h-4 w-4 accent-icube-gold"
                      />
                      <span className="text-sm text-gray-200">Mark as sold out</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Short description (card)</label>
                    <textarea
                      value={editing?.short_description ?? ""}
                      onChange={(e) => setEditing((s) => (s ? { ...s, short_description: e.target.value } : s))}
                      rows={2}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                      placeholder="One-line summary for the card"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Workshop details page</p>
                  <div className="mt-4">
                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Description</label>
                    <textarea
                      value={editing?.description ?? ""}
                      onChange={(e) => setEditing((s) => (s ? { ...s, description: e.target.value } : s))}
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                      placeholder="Longer description shown on Learn More page"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Highlights (one per line)</label>
                      <textarea
                        value={highlightsText}
                        onChange={(e) => setHighlightsText(e.target.value)}
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Includes (one per line)</label>
                      <textarea
                        value={includesText}
                        onChange={(e) => setIncludesText(e.target.value)}
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                      />
                    </div>
                    <div>
                      <MediaSlotList
                        label="Workshop videos"
                        hint="YouTube or Vimeo links, or upload your own."
                        values={videoUrls}
                        onChange={setVideoUrls}
                        type="video"
                        folder="workshops/videos"
                        addLabel="Add a video"
                        emptyHint="No videos yet."
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Media</p>
                    <div className="mt-4">
                      <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Images JSON</label>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-500">
                          Upload gallery images to auto-fill JSON.
                          {uploadingGallery ? (
                            <span className="ml-2 text-gray-400">
                              Uploading… {galleryProgress}% ({galleryProgressLabel})
                            </span>
                          ) : null}
                        </div>
                        <label className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors cursor-pointer">
                          Upload image(s)
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                        </label>
                      </div>
                      <textarea
                        value={imagesJsonText}
                        onChange={(e) => setImagesJsonText(e.target.value)}
                        rows={10}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50 font-mono"
                        placeholder='[{"image_url":"https://...","caption":"...","sort_order":1}]'
                      />
                    </div>
                  </div>
                </section>
              </div>

            </div>        </DashboardModal>
      ) : null}
    </div>
  );
}

