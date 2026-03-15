"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { useSiteData, invalidateSiteCache } from "../SiteDataContext";

const keys = [
  "hero_tagline",
  "hero_title_1",
  "hero_title_2",
  "hero_title_3",
  "hero_subtitle",
  "maintenance_mode",
  "maintenance_message",
  "contact_address",
  "contact_email",
  "contact_email_bookings",
  "contact_phone",
  "contact_phone_2",
  "contact_hours",
  "social_instagram",
  "social_youtube",
  "social_twitter",
  "social_tiktok",
  "social_linkedin",
  "social_facebook",
];

export default function DashboardSettings() {
  const { showToast } = useToast();
  const { refresh } = useSiteData();
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
      invalidateSiteCache();
      await refresh();
      showToast("Settings saved.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  const labels: Record<string, string> = {
    hero_tagline: "Hero tagline",
    hero_title_1: "Hero title line 1",
    hero_title_2: "Hero title line 2",
    hero_title_3: "Hero title line 3",
    hero_subtitle: "Hero subtitle",
    maintenance_mode: "Maintenance mode (close website)",
    maintenance_message: "Maintenance message",
    contact_address: "Address (Dubai)",
    contact_email: "Email (general)",
    contact_email_bookings: "Email (bookings)",
    contact_phone: "Phone 1 (+971…)",
    contact_phone_2: "Phone 2 (+971…)",
    contact_hours: "Working hours",
    social_instagram: "Instagram URL",
    social_youtube: "YouTube URL",
    social_twitter: "X (Twitter) URL",
    social_tiktok: "TikTok URL",
    social_linkedin: "LinkedIn URL",
    social_facebook: "Facebook URL",
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Site Settings</h1>
      <form onSubmit={handleSave} className="max-w-2xl space-y-4">
        {keys.map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{labels[key] || key}</label>
            {key === "maintenance_mode" ? (
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="checkbox"
                  checked={(settings[key] ?? "") === "1"}
                  onChange={(e) => update(key, e.target.checked ? "1" : "0")}
                />
                Close public website and show maintenance page
              </label>
            ) : key === "maintenance_message" || key === "contact_address" ? (
              <textarea
                value={settings[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                rows={key === "maintenance_message" ? 2 : 3}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
              />
            ) : (
              <input
                type="text"
                value={settings[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
