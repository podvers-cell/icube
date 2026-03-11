import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { api } from "../api";
import { firebaseStorage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type HeroSettings = {
  hero_bg_type?: "image" | "video";
  hero_bg_image_url?: string;
  hero_bg_video_url?: string;
};

export default function DashboardHero() {
  const [settings, setSettings] = useState<HeroSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api
      .get<Record<string, string>>("/dashboard/settings")
      .then((data) => {
        setSettings({
          hero_bg_type: (data.hero_bg_type as HeroSettings["hero_bg_type"]) || "image",
          hero_bg_image_url: data.hero_bg_image_url ?? "",
          hero_bg_video_url: data.hero_bg_video_url ?? "",
        });
      })
      .catch(() => {
        setSettings({ hero_bg_type: "image", hero_bg_image_url: "", hero_bg_video_url: "" });
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/dashboard/settings", settings);
      alert("Hero background saved.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save hero settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(
    e: ChangeEvent<HTMLInputElement>,
    kind: "image" | "video",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (kind === "image") setUploadingImage(true);
    if (kind === "video") setUploadingVideo(true);

    try {
      const path = `hero/${kind}-${Date.now()}-${file.name}`;
      const storageRef = ref(firebaseStorage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (kind === "image") {
        update("hero_bg_type", "image");
        update("hero_bg_image_url", url);
      } else {
        update("hero_bg_type", "video");
        update("hero_bg_video_url", url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (kind === "image") setUploadingImage(false);
      if (kind === "video") setUploadingVideo(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading hero settings…</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-2">Hero section</h1>
      <p className="text-sm text-gray-400 mb-8 max-w-xl">
        Control the background of the homepage hero. You can use a high‑quality image or a looped
        video, from a URL or by uploading to cloud storage.
      </p>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Background type
          </label>
          <div className="inline-flex rounded-full bg-black/40 border border-white/10 p-1 text-xs">
            <button
              type="button"
              onClick={() => update("hero_bg_type", "image")}
              className={`px-4 py-1.5 rounded-full ${
                (settings.hero_bg_type || "image") === "image"
                  ? "bg-icube-gold text-icube-dark font-semibold"
                  : "text-gray-300"
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => update("hero_bg_type", "video")}
              className={`px-4 py-1.5 rounded-full ${
                settings.hero_bg_type === "video"
                  ? "bg-icube-gold text-icube-dark font-semibold"
                  : "text-gray-300"
              }`}
            >
              Video
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Image URL (for image background)
            </label>
            <input
              type="text"
              value={settings.hero_bg_image_url ?? ""}
              onChange={(e) => update("hero_bg_image_url", e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
              placeholder="https://…"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
            >
              {uploadingImage ? "Uploading image…" : "Upload image to cloud"}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e, "image")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Video URL (for video background)
            </label>
            <input
              type="text"
              value={settings.hero_bg_video_url ?? ""}
              onChange={(e) => update("hero_bg_video_url", e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
              placeholder="https://…"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
            >
              {uploadingVideo ? "Uploading video…" : "Upload video to cloud"}
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleUpload(e, "video")}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save hero background"}
          </button>
        </div>
      </form>
    </div>
  );
}

