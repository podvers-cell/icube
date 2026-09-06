"use client";

import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useSiteData, invalidateSiteCache } from "../SiteDataContext";
import CloudinaryUploadField from "../components/CloudinaryUploadField";
import MediaSlotList from "../components/dashboard/MediaSlotList";
import { uploadToCloudinaryWithProgress } from "../lib/uploadCloudinary";
import { getProjectVideos } from "../lib/portfolioMedia";

type Project = {
  id: number | string;
  title: string;
  category: string;
  /** Client or brand name (shown under title on portfolio page) */
  client?: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  video_urls?: string[];
  gallery_images?: string[];
  visible?: boolean;
  show_in_selected_work?: boolean;
};

type EditingProject = Project & {
  /** One entry per slot in the form. Empty strings are dropped on save. */
  videoUrls: string[];
  galleryImages: string[];
};

function emptyProject(listLength: number): EditingProject {
  return {
    id: 0,
    title: "",
    category: "",
    client: "",
    image_url: "",
    sort_order: listLength,
    video_url: "",
    video_urls: [],
    gallery_images: [],
    visible: true,
    show_in_selected_work: false,
    videoUrls: [],
    galleryImages: [],
  };
}

function projectToEditing(p: Project): EditingProject {
  return {
    ...p,
    videoUrls: getProjectVideos(p),
    galleryImages: p.gallery_images ?? [],
  };
}

function editingToPayload(editing: EditingProject): Record<string, unknown> {
  // A slot left blank is simply an unused row, not an entry.
  const video_urls = editing.videoUrls.map((v) => v.trim()).filter(Boolean);
  const gallery_images = editing.galleryImages.map((v) => v.trim()).filter(Boolean);
  const client = editing.client?.trim();

  // Firestore rejects `undefined` — only include defined values (use [] / "" to clear optional fields).
  const payload: Record<string, unknown> = {
    title: editing.title,
    category: editing.category,
    image_url: editing.image_url,
    sort_order: editing.sort_order,
    video_urls,
    gallery_images,
    video_url: video_urls[0] ?? "",
    visible: editing.visible !== false,
    show_in_selected_work: !!editing.show_in_selected_work,
  };

  if (client) payload.client = client;

  return payload;
}

export default function DashboardPortfolio() {
  const { refresh } = useSiteData();
  const [list, setList] = useState<Project[]>([]);
  const [editing, setEditing] = useState<EditingProject | null>(null);
  const isCreating = editing && editing.id === 0;
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");

  function load() {
    api.get<Project[]>("/dashboard/portfolio").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload = editingToPayload(editing);
    try {
      if (editing.id === 0) {
        await api.post("/dashboard/portfolio", payload);
      } else {
        await api.put(`/dashboard/portfolio/${editing.id}`, payload);
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

  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !editing) return;
    const total = files.length;
    setUploadingGallery(true);
    setGalleryProgress(0);
    setUploadLabel(`0/${total}`);
    try {
      const urls: string[] = [];
      for (let i = 0; i < total; i++) {
        setUploadLabel(`${i + 1}/${total}`);
        const url = await uploadToCloudinaryWithProgress(files[i], {
          folder: "portfolio/gallery",
          type: "image",
          onProgress: (p) => setGalleryProgress(Math.round(((i + p / 100) / total) * 100)),
        });
        urls.push(url);
        setGalleryProgress(Math.round(((i + 1) / total) * 100));
      }
      setEditing((x) => (x ? { ...x, galleryImages: [...x.galleryImages, ...urls] } : null));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingGallery(false);
      setGalleryProgress(0);
      setUploadLabel("");
      e.target.value = "";
    }
  }

  async function handleVideosUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !editing) return;
    const total = files.length;
    setUploadingVideos(true);
    setVideoProgress(0);
    setUploadLabel(`0/${total}`);
    try {
      const urls: string[] = [];
      for (let i = 0; i < total; i++) {
        setUploadLabel(`${i + 1}/${total}`);
        const url = await uploadToCloudinaryWithProgress(files[i], {
          folder: "portfolio/videos",
          type: "video",
          onProgress: (p) => setVideoProgress(Math.round(((i + p / 100) / total) * 100)),
        });
        urls.push(url);
        setVideoProgress(Math.round(((i + 1) / total) * 100));
      }
      setEditing((x) => (x ? { ...x, videoUrls: [...x.videoUrls, ...urls] } : null));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingVideos(false);
      setVideoProgress(0);
      setUploadLabel("");
      e.target.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Portfolio</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Case studies on the <strong className="text-gray-400">Portfolio page</strong>. Each project has a cover
            image and can hold as many videos and gallery images as you need. For loose videos on the homepage, use{" "}
            <strong className="text-gray-400">Showreel Videos</strong>.
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyProject(list.length))}
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Project
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No projects yet.</p>
          <button
            onClick={() => setEditing(emptyProject(list.length))}
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
                <p className="text-gray-600 text-xs mt-1">
                  {getProjectVideos(p).length} video(s) · {(p.gallery_images ?? []).length} image(s)
                </p>
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditing(projectToEditing(p))}
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
          <div className="bg-icube-gray border border-white/10 rounded-sm p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {isCreating ? "Add project" : "Edit project"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                A project is one case study on the Portfolio page, with its own videos and gallery.
              </p>
            </div>

            <div className="space-y-3">
              {/* Labels rather than placeholders: a placeholder disappears the moment you type,
                  so a half-filled form stopped saying which field was which. */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-300">Project title</span>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
                  className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                  placeholder="Nike — Summer campaign"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-300">Category</span>
                  <input
                    value={editing.category}
                    onChange={(e) => setEditing((x) => (x ? { ...x, category: e.target.value } : null))}
                    className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                    placeholder="Commercial"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-300">
                    Client <span className="font-normal text-gray-500">(optional)</span>
                  </span>
                  <input
                    value={editing.client ?? ""}
                    onChange={(e) => setEditing((x) => (x ? { ...x, client: e.target.value } : null))}
                    className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                    placeholder="Shown under the title"
                  />
                </label>
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-gray-300">Cover image</span>
                <p className="mb-2 text-xs text-gray-500">The single image that represents this project in the grid.</p>
                <CloudinaryUploadField
                  value={editing.image_url}
                  onChange={(url) => setEditing((x) => (x ? { ...x, image_url: url } : null))}
                  type="image"
                  folder="portfolio"
                  placeholder="https://… or click Upload"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-5">
              <MediaSlotList
                label="Project videos"
                hint="YouTube or Vimeo links, or upload your own. Shown in the order below."
                values={editing.videoUrls}
                onChange={(videoUrls) => setEditing((x) => (x ? { ...x, videoUrls } : null))}
                type="video"
                folder="portfolio/videos"
                addLabel="Add a video"
                emptyHint="No videos yet. Add one slot at a time, or upload several at once below."
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideos}
                  className="rounded-sm border border-white/10 bg-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/15 disabled:opacity-50"
                >
                  {uploadingVideos ? `${videoProgress}%` : "Upload several videos"}
                </button>
                {uploadingVideos && (
                  <span className="text-sm text-gray-400">
                    {uploadLabel} — {videoProgress}%
                  </span>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={handleVideosUpload}
                />
              </div>
              {uploadingVideos && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-icube-gold transition-[width] duration-200"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-white/10 pt-5">
              <MediaSlotList
                label="Gallery images"
                hint="Shown on the project page, in the order below."
                values={editing.galleryImages}
                onChange={(galleryImages) => setEditing((x) => (x ? { ...x, galleryImages } : null))}
                type="image"
                folder="portfolio/gallery"
                addLabel="Add an image"
                emptyHint="No gallery images yet. Add one slot at a time, or upload several at once below."
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="rounded-sm border border-white/10 bg-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/15 disabled:opacity-50"
                >
                  {uploadingGallery ? `${galleryProgress}%` : "Upload several images"}
                </button>
                {uploadingGallery && (
                  <span className="text-sm text-gray-400">
                    {uploadLabel} — {galleryProgress}%
                  </span>
                )}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
              </div>
              {uploadingGallery && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-icube-gold transition-[width] duration-200"
                    style={{ width: `${galleryProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5">
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
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-5">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
