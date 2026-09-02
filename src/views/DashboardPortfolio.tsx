"use client";

import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useSiteData, invalidateSiteCache } from "../SiteDataContext";
import CloudinaryUploadField from "../components/CloudinaryUploadField";
import { uploadToCloudinaryWithProgress } from "../lib/uploadCloudinary";
import { getProjectVideos, parseLines } from "../lib/portfolioMedia";

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
  videoUrlsText: string;
  galleryImagesText: string;
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
    videoUrlsText: "",
    galleryImagesText: "",
  };
}

function projectToEditing(p: Project): EditingProject {
  const videos = getProjectVideos(p);
  return {
    ...p,
    videoUrlsText: videos.join("\n"),
    galleryImagesText: (p.gallery_images ?? []).join("\n"),
  };
}

function editingToPayload(editing: EditingProject): Record<string, unknown> {
  const video_urls = parseLines(editing.videoUrlsText);
  const gallery_images = parseLines(editing.galleryImagesText);
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
      const current = editing.galleryImagesText.trim();
      const newLines = urls.join("\n");
      setEditing((x) =>
        x ? { ...x, galleryImagesText: current ? `${current}\n${newLines}` : newLines } : null
      );
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
      const current = editing.videoUrlsText.trim();
      const newLines = urls.join("\n");
      setEditing((x) =>
        x ? { ...x, videoUrlsText: current ? `${current}\n${newLines}` : newLines } : null
      );
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
          <p className="text-gray-500 text-sm mt-1">Projects and case studies shown on the public site.</p>
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
              label="Cover image URL"
              value={editing.image_url}
              onChange={(url) => setEditing((x) => (x ? { ...x, image_url: url } : null))}
              type="image"
              folder="portfolio"
              placeholder="https://… or click Upload"
            />

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Project videos (YouTube/Vimeo links or uploads — one URL per line)
              </label>
              <div className="flex gap-2 mb-2 items-center flex-wrap">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideos}
                  className="px-4 py-2 bg-white/10 border border-white/10 rounded-sm text-sm text-gray-200 hover:bg-white/15 disabled:opacity-50"
                >
                  {uploadingVideos ? `${videoProgress}%` : "Upload video(s)"}
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
                <div className="mb-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-icube-gold rounded-full transition-[width] duration-200"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              )}
              <textarea
                value={editing.videoUrlsText}
                onChange={(e) => setEditing((x) => (x ? { ...x, videoUrlsText: e.target.value } : null))}
                rows={4}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white font-mono text-sm"
                placeholder="https://youtube.com/…&#10;https://vimeo.com/…&#10;or use Upload video(s) above"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Project gallery images (one URL per line)
              </label>
              <div className="flex gap-2 mb-2 items-center flex-wrap">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="px-4 py-2 bg-white/10 border border-white/10 rounded-sm text-sm text-gray-200 hover:bg-white/15 disabled:opacity-50"
                >
                  {uploadingGallery ? `${galleryProgress}%` : "Upload image(s)"}
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
                <div className="mb-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-icube-gold rounded-full transition-[width] duration-200"
                    style={{ width: `${galleryProgress}%` }}
                  />
                </div>
              )}
              <textarea
                value={editing.galleryImagesText}
                onChange={(e) => setEditing((x) => (x ? { ...x, galleryImagesText: e.target.value } : null))}
                rows={4}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white font-mono text-sm"
                placeholder="https://…&#10;https://… or use Upload image(s) above"
              />
            </div>

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
