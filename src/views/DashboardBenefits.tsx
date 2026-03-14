"use client";

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { api } from "../api";
import { requireStorage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { uploadToCloudinaryWithProgress } from "../lib/uploadCloudinary";

const BENEFITS_KEYS = [
  "benefits_label",
  "benefits_title",
  "benefits_intro",
  "benefits_col1_p1",
  "benefits_col1_p2",
  "benefits_col2_p1",
  "benefits_col2_p2",
  "benefits_image_url",
] as const;

type BenefitsSettings = Partial<Record<(typeof BENEFITS_KEYS)[number], string>>;

const FALLBACK: Record<(typeof BENEFITS_KEYS)[number], string> = {
  benefits_label: "Why work with us",
  benefits_title: "The benefits of working with a media & podcast studio",
  benefits_intro:
    "At ICUBE, we bring years of experience in premium production and podcasting in Dubai. From concept to final cut, we help brands and creators tell stories that resonate—with the right gear, the right space, and a team that cares about quality.",
  benefits_col1_p1:
    "Our team combines industry expertise with deep knowledge of digital media, current trends, and how to navigate the content landscape. We don't just record—we shape narratives that fit your brand and audience.",
  benefits_col1_p2:
    "ICUBE's production approach drives real engagement: strategic content creation, community management, and campaign execution. We focus on measurable results so you can see the impact of your investment.",
  benefits_col2_p1:
    "We manage the full production pipeline: podcast recording, video shoots, and multi-format content. From our Dubai studios we support creators and businesses across the UAE and beyond with a skilled team of producers, sound engineers, and creatives.",
  benefits_col2_p2:
    "Our clients get access to professional-grade technology and workflows designed for scalability. Whether you're launching a new show or levelling up your brand content, we're here to help you grow your audience and reach.",
  benefits_image_url: "/podcast-still.png",
};

export default function DashboardBenefits() {
  const [form, setForm] = useState<BenefitsSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgressImage, setUploadProgressImage] = useState(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api
      .get<Record<string, string>>("/dashboard/settings")
      .then((data) => {
        const out: BenefitsSettings = {};
        BENEFITS_KEYS.forEach((key) => {
          out[key] = data[key] ?? FALLBACK[key] ?? "";
        });
        setForm(out);
      })
      .catch(() => setForm(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  function update(key: (typeof BENEFITS_KEYS)[number], value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/dashboard/settings", form);
      alert("Benefits section saved.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setUploadProgressImage(0);
    try {
      let url: string;
      try {
        url = await uploadToCloudinaryWithProgress(file, {
          folder: "benefits",
          type: "image",
          onProgress: setUploadProgressImage,
        });
      } catch {
        const path = `benefits/${Date.now()}-${file.name}`;
        const storageRef = ref(requireStorage(), path);
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      }
      update("benefits_image_url", url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      setUploadProgressImage(0);
      e.target.value = "";
    }
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading benefits…</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-2">Benefits section</h1>
      <p className="text-sm text-gray-400 mb-8 max-w-xl">
        Edit the &quot;Why work with us&quot; / benefits block on the homepage: label, title, intro, and the four column paragraphs. Leave image URL blank to use the default image.
      </p>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Section label (small text above title)</label>
          <input
            type="text"
            value={form.benefits_label ?? ""}
            onChange={(e) => update("benefits_label", e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
            placeholder="e.g. Why work with us"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Main title</label>
          <input
            type="text"
            value={form.benefits_title ?? ""}
            onChange={(e) => update("benefits_title", e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
            placeholder="The benefits of working with a media & podcast studio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Intro paragraph</label>
          <textarea
            value={form.benefits_intro ?? ""}
            onChange={(e) => update("benefits_intro", e.target.value)}
            rows={4}
            className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold resize-y"
            placeholder="At ICUBE, we bring years of experience…"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-icube-gold">Column 1</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paragraph 1</label>
              <textarea
                value={form.benefits_col1_p1 ?? ""}
                onChange={(e) => update("benefits_col1_p1", e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white text-sm focus:outline-none focus:border-icube-gold resize-y"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paragraph 2</label>
              <textarea
                value={form.benefits_col1_p2 ?? ""}
                onChange={(e) => update("benefits_col1_p2", e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white text-sm focus:outline-none focus:border-icube-gold resize-y"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-icube-gold">Column 2</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paragraph 1</label>
              <textarea
                value={form.benefits_col2_p1 ?? ""}
                onChange={(e) => update("benefits_col2_p1", e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white text-sm focus:outline-none focus:border-icube-gold resize-y"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paragraph 2</label>
              <textarea
                value={form.benefits_col2_p2 ?? ""}
                onChange={(e) => update("benefits_col2_p2", e.target.value)}
                rows={3}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white text-sm focus:outline-none focus:border-icube-gold resize-y"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Image (right side)</label>
          <input
            type="text"
            value={form.benefits_image_url ?? ""}
            onChange={(e) => update("benefits_image_url", e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold mb-2"
            placeholder="/podcast-still.png"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
            >
              {uploadingImage ? `Uploading ${uploadProgressImage}%` : "Upload image"}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {uploadingImage && (
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-icube-gold rounded-full transition-[width] duration-200"
                  style={{ width: `${uploadProgressImage}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save benefits section"}
          </button>
        </div>
      </form>
    </div>
  );
}
