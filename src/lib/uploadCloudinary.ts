/**
 * Dashboard uploads, sent straight from the browser to Cloudinary.
 *
 * These used to be proxied through /api/upload. Vercel caps a serverless function's request body
 * around 4.5MB, so the platform rejected any real video before the route ran — the route's own
 * 100MB limit was unreachable. The file now bypasses this app entirely: the server only signs the
 * upload, and the API secret never leaves it.
 *
 * The progress bar is also more honest now, because it tracks the real upload rather than the hop
 * to our own server.
 */

import { requireAuth } from "@/firebase";

export type UploadOptions = {
  folder?: string;
  /** "auto" resolves from the file's own MIME type, matching the old server behaviour. */
  type?: "image" | "video" | "auto";
  /** Called with 0–100 as the file uploads. */
  onProgress?: (percent: number) => void;
};

/** Generous ceilings; Cloudinary's own plan limits still apply on top. */
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

type SignaturePayload = {
  cloudName: string;
  apiKey: string;
  resourceType: "image" | "video";
  folder: string;
  timestamp: number;
  signature: string;
};

/**
 * Ask the server to sign the upload, retrying once with a forced token refresh.
 *
 * A cached ID token can expire between page load and upload. Exactly one retry, and only for 401
 * — a 403 (not an admin) or 503 (the check could not run) is not helped by a new token, and
 * retrying those would loop for no reason.
 */
async function requestSignature(
  user: { getIdToken: (forceRefresh?: boolean) => Promise<string> },
  folder: string,
  resourceType: "image" | "video"
): Promise<SignaturePayload> {
  async function attempt(forceRefresh: boolean) {
    const idToken = await user.getIdToken(forceRefresh);
    const response = await fetch("/api/upload/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ folder, type: resourceType }),
    });
    const body = (await response.json().catch(() => ({}))) as SignaturePayload & { error?: string };
    return { response, body };
  }

  let { response, body } = await attempt(false);

  if (response.status === 401) {
    ({ response, body } = await attempt(true));
  }

  if (!response.ok || !body.signature) {
    throw new Error(
      body.error ||
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Could not authorise the upload.")
    );
  }
  return body;
}

function resolveType(file: File, requested: UploadOptions["type"]): "image" | "video" {
  if (requested === "image" || requested === "video") return requested;
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  throw new Error("Only image and video uploads are supported.");
}

export async function uploadToCloudinaryWithProgress(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const user = requireAuth().currentUser;
  if (!user) throw new Error("Please sign in as an administrator before uploading.");

  const { folder = "icube", type = "auto", onProgress } = options;
  const resourceType = resolveType(file, type);

  const limit = resourceType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new Error(
      `File is too large. Maximum ${Math.round(limit / (1024 * 1024))} MB for ${resourceType}s.`
    );
  }

  const signed = await requestSignature(user, folder, resourceType);

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signed.apiKey);
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("folder", signed.folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(Math.round((e.loaded / e.total) * 100), 99));
      }
    });

    xhr.addEventListener("load", () => {
      if (onProgress) onProgress(100);
      let body: { secure_url?: string; error?: { message?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {
        reject(new Error("Upload failed: unexpected response."));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(body.error?.message || "Upload failed."));
        return;
      }
      if (!body.secure_url) {
        reject(new Error("Upload succeeded but returned no URL."));
        return;
      }
      resolve(body.secure_url);
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`
    );
    xhr.send(form);
  });
}

export async function uploadToCloudinary(file: File, options: UploadOptions = {}): Promise<string> {
  return uploadToCloudinaryWithProgress(file, options);
}
