import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";

/**
 * Hands the browser a short-lived signature so it can upload straight to Cloudinary.
 *
 * Uploads used to be proxied through /api/upload, which meant the whole file travelled through a
 * serverless function — and Vercel caps a function's request body around 4.5MB, so any real video
 * was rejected by the platform before the route ever ran. The route's own 100MB limit was never
 * reachable.
 *
 * Going direct removes that ceiling entirely: the file never touches this app. The API secret
 * stays on the server; the browser only ever receives a signature over the exact parameters it is
 * allowed to use, so it cannot upload somewhere else or as something else.
 */

const bodySchema = z.object({
  folder: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9/_-]+$/i, "Invalid upload folder")
    .refine((value) => !value.includes(".."), "Invalid upload folder"),
  type: z.enum(["image", "video"]),
});

/** Cloudinary signs the sorted `key=value` parameter list, joined by `&`, plus the API secret. */
function signParams(params: Record<string, string>, apiSecret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(canonical + apiSecret).digest("hex");
}

function readCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } | null {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    // cloudinary://<api_key>:<api_secret>@<cloud_name>
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloudName && apiKey && apiSecret) return { cloudName, apiKey, apiSecret };

  return null;
}

export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const config = readCloudinaryConfig();
  if (!config) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid upload request." },
      { status: 400 }
    );
  }

  // Only these are signed, so these are the only values Cloudinary will accept for this upload.
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = { folder: parsed.data.folder, timestamp: String(timestamp) };

  return NextResponse.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    resourceType: parsed.data.type,
    folder: parsed.data.folder,
    timestamp,
    signature: signParams(signedParams, config.apiSecret),
  });
}
