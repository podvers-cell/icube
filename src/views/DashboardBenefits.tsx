"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext";
import CloudinaryUploadField from "../components/CloudinaryUploadField";

const BENEFITS_KEYS = [
  "benefits_section_label",
  "benefits_title",
  "benefits_intro",
  "benefits_image_url",
  "benefits_image_alt",
  "benefits_col1_p1",
  "benefits_col1_p2",
  "benefits_col2_p1",
  "benefits_col2_p2",
] as const;

const LABELS: Record<(typeof BENEFITS_KEYS)[number], string> = {
  benefits_section_label: "Section label (e.g. Why work with us)",
  benefits_title: "Main heading",
  benefits_intro: "Intro paragraph (use ICUBE for highlighted brand name)",
  benefits_image_url: "Image URL (right side of section)",
  benefits_image_alt: "Image alt text (accessibility)",
  benefits_col1_p1: "Left column – first paragraph",
  benefits_col1_p2: "Left column – second paragraph",
  benefits_col2_p1: "Right column – first paragraph",
  benefits_col2_p2: "Right column – second paragraph",
};

const DEFAULTS: Record<(typeof BENEFITS_KEYS)[number], string> = {
  benefits_section_label: "Why work with us",
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
  benefits_image_alt: "Podcast production at ICUBE Media Studio – professional recording setup",
};

export default function DashboardBenefits() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Record<string, string>>("/dashboard/settings").then(setSettings).catch(() => {});
  }, []);

  const update = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/dashboard/settings", settings);
      showToast("Benefits content saved.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  const value = (key: (typeof BENEFITS_KEYS)[number]) => settings[key]?.trim() ?? DEFAULTS[key];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Benefits</h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit the content of the “Why work with us” / Benefits section on the site. Same structure as the section.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        {/* Section label + title + intro – same order as section */}
        <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-icube-gold uppercase tracking-wider">Label & heading</h2>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_section_label}</label>
            <input
              type="text"
              value={value("benefits_section_label")}
              onChange={(e) => update("benefits_section_label", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500"
              placeholder={DEFAULTS.benefits_section_label}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_title}</label>
            <input
              type="text"
              value={value("benefits_title")}
              onChange={(e) => update("benefits_title", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500"
              placeholder={DEFAULTS.benefits_title}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_intro}</label>
            <textarea
              value={value("benefits_intro")}
              onChange={(e) => update("benefits_intro", e.target.value)}
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500 resize-y"
              placeholder={DEFAULTS.benefits_intro}
            />
          </div>
        </div>

        {/* Image – right side of section */}
        <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-icube-gold uppercase tracking-wider">Image</h2>
          <div>
            <CloudinaryUploadField
              value={value("benefits_image_url")}
              onChange={(url) => update("benefits_image_url", url)}
              type="image"
              folder="icube/benefits"
              label={LABELS.benefits_image_url}
              placeholder="/podcast-still.png or full URL"
              className="mb-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_image_alt}</label>
            <input
              type="text"
              value={value("benefits_image_alt")}
              onChange={(e) => update("benefits_image_alt", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500"
              placeholder="Describe the image for accessibility"
            />
          </div>
        </div>

        {/* Two columns – same as section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-icube-gold uppercase tracking-wider">Left column</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_col1_p1}</label>
              <textarea
                value={value("benefits_col1_p1")}
                onChange={(e) => update("benefits_col1_p1", e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500 resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_col1_p2}</label>
              <textarea
                value={value("benefits_col1_p2")}
                onChange={(e) => update("benefits_col1_p2", e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500 resize-y"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-icube-gold uppercase tracking-wider">Right column</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_col2_p1}</label>
              <textarea
                value={value("benefits_col2_p1")}
                onChange={(e) => update("benefits_col2_p1", e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500 resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{LABELS.benefits_col2_p2}</label>
              <textarea
                value={value("benefits_col2_p2")}
                onChange={(e) => update("benefits_col2_p2", e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-500 resize-y"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-icube-gold text-icube-dark font-semibold rounded hover:bg-icube-gold-light disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save benefits"}
          </button>
        </div>
      </form>
    </div>
  );
}
