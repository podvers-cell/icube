import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// NOTE: Vercel caps a serverless function's request body well below this (4.5 MB by default), so
// that platform limit is reached first in production. This bound is the application's own
// guarantee for any other deployment target and for local runs.
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function getConfig() {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    return { url };
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
  }
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "Cloudinary not configured. Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) in .env.local for local dev, or in your hosting provider's environment variables for production.",
      },
      { status: 503 }
    );
  }

  cloudinary.config(config);

  let file: File;
  let folder = "icube";
  let requestedType: "image" | "video" | "auto" = "auto";

  try {
    const formData = await request.formData();
    file = formData.get("file") as File;
    const f = formData.get("folder");
    const type = formData.get("type");
    if (f && typeof f === "string") folder = f;
    if (type === "image") requestedType = "image";
    else if (type === "video") requestedType = "video";
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!/^[a-z0-9/_-]{1,80}$/i.test(folder) || folder.includes("..")) {
    return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
  }

  // "auto" used to hand Cloudinary an unrestricted resource_type. Resolve it from the file
  // instead, so every upload is deliberately an image or a video and nothing else.
  const mime = (file.type || "").toLowerCase();
  let resourceType: "image" | "video";
  if (requestedType !== "auto") {
    resourceType = requestedType;
  } else if (mime.startsWith("image/")) {
    resourceType = "image";
  } else if (mime.startsWith("video/")) {
    resourceType = "video";
  } else {
    return NextResponse.json({ error: "Only image and video uploads are supported" }, { status: 400 });
  }

  if (resourceType === "image" && !mime.startsWith("image/")) {
    return NextResponse.json({ error: "Expected an image file" }, { status: 400 });
  }
  if (resourceType === "video" && !mime.startsWith("video/")) {
    return NextResponse.json({ error: "Expected a video file" }, { status: 400 });
  }

  // Checked before reading the body: the whole file lands in function memory below, so an
  // unbounded upload is an out-of-memory risk rather than merely a slow one.
  const maxBytes = resourceType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File is too large. Maximum ${Math.round(maxBytes / (1024 * 1024))} MB for ${resourceType}s.` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Streamed rather than sent as a base64 data URI, which inflated every upload by ~33% in
    // memory on top of the file itself.
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, uploadResult) => {
          if (error || !uploadResult) reject(error ?? new Error("No URL returned"));
          else resolve(uploadResult);
        }
      );
      stream.end(buffer);
    });

    if (!result || !("secure_url" in result)) {
      throw new Error("No URL returned");
    }
    return NextResponse.json({ url: (result as { secure_url: string }).secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
