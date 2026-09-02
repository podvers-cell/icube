import { getVideoEmbed, type VideoEmbedResult } from "./videoEmbed";

export type PortfolioProjectMedia = {
  video_url?: string;
  video_urls?: string[];
  gallery_images?: string[];
};

export type ProjectMediaItem =
  | { type: "video"; url: string; embed: VideoEmbedResult; thumbnail: string }
  | { type: "image"; url: string; thumbnail: string };

export function getProjectVideos(project: PortfolioProjectMedia): string[] {
  const fromArray = Array.isArray(project.video_urls)
    ? project.video_urls.map((u) => u.trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) return fromArray;
  const single = project.video_url?.trim();
  return single ? [single] : [];
}

export function getProjectGalleryImages(project: PortfolioProjectMedia): string[] {
  return Array.isArray(project.gallery_images)
    ? project.gallery_images.map((u) => u.trim()).filter(Boolean)
    : [];
}

export function projectHasMedia(project: PortfolioProjectMedia): boolean {
  return getProjectMediaItems(project).length > 0;
}

function videoThumbnail(url: string, embed: VideoEmbedResult, fallback?: string): string {
  if (embed.provider === "youtube") {
    return `https://img.youtube.com/vi/${embed.videoId}/mqdefault.jpg`;
  }
  if (embed.provider === "vimeo") {
    return `https://vumbnail.com/${embed.videoId}.jpg`;
  }
  return fallback ?? url;
}

export function getProjectMediaItems(
  project: PortfolioProjectMedia,
  coverImage?: string
): ProjectMediaItem[] {
  const items: ProjectMediaItem[] = [];
  for (const url of getProjectVideos(project)) {
    const embed = getVideoEmbed(url);
    if (!embed) continue;
    items.push({
      type: "video",
      url,
      embed,
      thumbnail: videoThumbnail(url, embed, coverImage),
    });
  }
  for (const url of getProjectGalleryImages(project)) {
    items.push({ type: "image", url, thumbnail: url });
  }
  return items;
}

export function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
