import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

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
  let resourceType: "image" | "video" | "auto" = "auto";

  try {
    const formData = await request.formData();
    file = formData.get("file") as File;
    const f = formData.get("folder");
    const type = formData.get("type");
    if (f && typeof f === "string") folder = f;
    if (type === "image") resourceType = "image";
    else if (type === "video") resourceType = "video";
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mime = file.type || "application/octet-stream";
  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: resourceType,
    });

    if (!result || !("secure_url" in result)) {
      throw new Error("No URL returned");
    }
    return NextResponse.json({ url: (result as { secure_url: string }).secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
