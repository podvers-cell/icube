/**
 * Ask Cloudinary for a sized, modern-format copy instead of the original upload.
 *
 * Dashboard uploads go to Cloudinary untouched, and the originals are big: measured on the live
 * site, covers of 3.4MB, 5.9MB and 8.3MB were being served to every visitor at full size. Next's
 * own optimizer cannot help — it timed out fetching them — so the resize is requested from
 * Cloudinary's CDN, which is where the file already lives.
 *
 * f_auto picks WebP/AVIF per browser, q_auto picks a quality, c_limit never upscales.
 */
const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_SEGMENT = "/upload/";

/** Already-transformed URLs are left alone, so hand-tuned links keep working. */
function hasTransformation(pathAfterUpload: string): boolean {
  const firstSegment = pathAfterUpload.split("/")[0] ?? "";
  // A bare version segment (v123…) or a folder means no transformation is present yet.
  return /(^|,)(f_|q_|w_|h_|c_|dpr_|ar_)/.test(firstSegment);
}

export function cloudinaryImage(src: string | null | undefined, width: number): string {
  if (!src) return "";

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (url.hostname !== CLOUDINARY_HOST) return src;

  const index = url.pathname.indexOf(UPLOAD_SEGMENT);
  if (index === -1) return src;

  const after = url.pathname.slice(index + UPLOAD_SEGMENT.length);
  if (hasTransformation(after)) return src;

  url.pathname =
    url.pathname.slice(0, index + UPLOAD_SEGMENT.length) + `f_auto,q_auto,c_limit,w_${width}/` + after;
  return url.toString();
}
