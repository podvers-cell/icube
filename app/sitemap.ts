import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://icube.ae";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();

  const routes: MetadataRoute.Sitemap = [
    { url: base + "/", changeFrequency: "weekly", priority: 1 },
    { url: base + "/contact", changeFrequency: "monthly", priority: 0.9 },
    { url: base + "/portfolio", changeFrequency: "weekly", priority: 0.9 },
    { url: base + "/packages", changeFrequency: "weekly", priority: 0.9 },
    { url: base + "/packages/date-time", changeFrequency: "monthly", priority: 0.6 },
    { url: base + "/packages/add-ons", changeFrequency: "monthly", priority: 0.6 },
    { url: base + "/packages/checkout", changeFrequency: "monthly", priority: 0.5 },
    { url: base + "/studio/booking/date-time", changeFrequency: "monthly", priority: 0.6 },
    { url: base + "/studio/booking/add-ons", changeFrequency: "monthly", priority: 0.6 },
    { url: base + "/studio/booking/checkout", changeFrequency: "monthly", priority: 0.5 },
    { url: base + "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { url: base + "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes;
}
