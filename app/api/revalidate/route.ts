import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";

/**
 * Purge the server-rendered public pages after a dashboard save.
 *
 * The public site reads its content on the server and caches it for five minutes, which is what
 * keeps a busy page from costing Firestore reads. Without this, an admin who added a video or a
 * project had to wait out that window before it appeared — the old cache-bust only refreshed the
 * client-side store, which server-rendered pages no longer use.
 */
export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    // The content lives in the root layout, so revalidating it covers every public page.
    revalidatePath("/", "layout");
    return NextResponse.json({ revalidated: true });
  } catch (err) {
    console.error("[revalidate]", err);
    return NextResponse.json({ error: "Could not refresh the public site." }, { status: 500 });
  }
}
