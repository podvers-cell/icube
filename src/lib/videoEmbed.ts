/**
 * Parse YouTube / Vimeo / Instagram page URL and return the embed URL for iframe.
 * Uses params to hide source branding, autoplay (muted for policy), and keep experience in our player.
 */
const YT_PARAMS =
  "autoplay=1&mute=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&disablekb=1&controls=0&fs=0";
const VIMEO_PARAMS = "autoplay=1&title=0&byline=0&portrait=0&muted=1&logo=0&badge=0";

export type VideoOrientation = "portrait" | "landscape";

export type VideoEmbedResult =
  | { embedUrl: string; provider: "youtube"; videoId: string; orientation?: VideoOrientation }
  | { embedUrl: string; provider: "vimeo"; videoId: string; orientation?: VideoOrientation }
  | { embedUrl: string; provider: "instagram"; videoId: string; orientation?: VideoOrientation }
  | { embedUrl: string; provider: "file"; videoId: string; orientation?: VideoOrientation };

export function getVideoEmbed(url: string): VideoEmbedResult | null {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();

  // YouTube: watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytWatch = u.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
  if (ytWatch) {
    const id = ytWatch[1];
    return { embedUrl: `https://www.youtube.com/embed/${id}?${YT_PARAMS}`, provider: "youtube", videoId: id, orientation: "landscape" };
  }
  const ytShort = u.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytShort) {
    const id = ytShort[1];
    return { embedUrl: `https://www.youtube.com/embed/${id}?${YT_PARAMS}`, provider: "youtube", videoId: id, orientation: "landscape" };
  }
  const ytEmbed = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytEmbed) {
    const id = ytEmbed[1];
    return { embedUrl: `https://www.youtube.com/embed/${id}?${YT_PARAMS}`, provider: "youtube", videoId: id, orientation: "landscape" };
  }
  const ytShorts = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShorts) {
    const id = ytShorts[1];
    // Shorts: اعتبرها عمودية افتراضيًا
    return { embedUrl: `https://www.youtube.com/embed/${id}?${YT_PARAMS}`, provider: "youtube", videoId: id, orientation: "portrait" };
  }

  // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID – hide title, byline, portrait
  const vimeo = u.match(/(?:vimeo\.com\/)(?:video\/)?(\d+)/);
  if (vimeo) {
    const id = vimeo[1];
    return { embedUrl: `https://player.vimeo.com/video/${id}?${VIMEO_PARAMS}`, provider: "vimeo", videoId: id, orientation: "landscape" };
  }
  const vimeoPlayer = u.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (vimeoPlayer) {
    const id = vimeoPlayer[1];
    return { embedUrl: `https://player.vimeo.com/video/${id}?${VIMEO_PARAMS}`, provider: "vimeo", videoId: id, orientation: "landscape" };
  }

  // Instagram: reels / posts – we render the standard embed iframe
  // Examples:
  // - https://www.instagram.com/reel/ABC123/
  // - https://www.instagram.com/p/ABC123
  const ig = u.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  if (ig) {
    const id = ig[1];
    const isReel = /instagram\.com\/reel\//.test(u);
    const embedUrl = `https://www.instagram.com/${isReel ? "reel" : "p"}/${id}/embed`;
    return {
      embedUrl,
      provider: "instagram",
      videoId: id,
      orientation: "portrait",
    };
  }

  // Direct video files (e.g. Cloudinary or any .mp4/.webm/.mov URL)
  const file = u.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i);
  if (file) {
    return {
      embedUrl: u,
      provider: "file",
      videoId: u,
      orientation: "landscape",
    };
  }

  return null;
}

/** Check if a URL is a supported YouTube or Vimeo link. */
export function isValidVideoUrl(url: string): boolean {
  return getVideoEmbed(url) !== null;
}