/**
 * Upload a file to Cloudinary via the app API route.
 * Used by the dashboard so images/videos uploaded from the dashboard appear on the website.
 */

export type UploadOptions = {
  folder?: string;
  type?: "image" | "video" | "auto";
  /** Called with 0–100 as the file is sent to the server (upload progress). */
  onProgress?: (percent: number) => void;
};

export function uploadToCloudinaryWithProgress(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const { folder = "icube", type = "auto", onProgress } = options;
  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);
  formData.set("type", type);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(Math.min(percent, 99)); // cap at 99 until response
      }
    });

    xhr.addEventListener("load", () => {
      if (onProgress) onProgress(100);
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const body = JSON.parse(xhr.responseText || "{}");
          reject(new Error(body?.error || xhr.statusText || "Upload failed"));
        } catch {
          reject(new Error(xhr.statusText || "Upload failed"));
        }
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (!data?.url) reject(new Error("No URL in response"));
        else resolve(data.url);
      } catch {
        reject(new Error("Invalid response"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

export async function uploadToCloudinary(file: File, options: UploadOptions = {}): Promise<string> {
  return uploadToCloudinaryWithProgress(file, options);
}
