import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";
import { PUBLIC_SITE_DATA_TAG } from "@/lib/publicSiteData";
import { RENTAL_EQUIPMENT_TAG } from "@/lib/rentalEquipmentQuery";

/**
 * Refresh the public site after a dashboard write.
 *
 * Order matters. The tags are cleared first so the shared datasets are known stale, then the
 * rendered pages are invalidated. The first page to re-render refetches once and every other page
 * reuses that result — previously each of ~43 routes ran its own ten Firestore queries.
 *
 * Both tags are cleared on every write. The datasets are kept separate so a narrower invalidation
 * is possible later, but nothing scopes it today: the api layer does not tell this route which
 * section changed, and guessing from the path would be wrong more often than it helped.
 */
export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    // Next 16 requires an expiry profile; { expire: 0 } marks the tag stale immediately.
    revalidateTag(PUBLIC_SITE_DATA_TAG, { expire: 0 });
    revalidateTag(RENTAL_EQUIPMENT_TAG, { expire: 0 });

    // The content lives in the root layout, so this covers every public page.
    revalidatePath("/", "layout");

    return NextResponse.json({ revalidated: true });
  } catch (err) {
    console.error("[revalidate]", err);
    return NextResponse.json({ error: "Could not refresh the public site." }, { status: 500 });
  }
}
