import { unstable_cache } from "next/cache";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";

/** Invalidated from /api/revalidate after a dashboard write. */
export const PUBLIC_SITE_DATA_TAG = "public-site-data";

/** Matches the layout's own revalidate window. */
const PUBLIC_SITE_DATA_TTL_SECONDS = 300;

/**
 * Server-side copy of everything the public site renders.
 *
 * The browser used to fetch all of this itself: ~467KB of Firebase SDK, then twenty Firestore
 * round-trips, before a visitor saw a single price. Measured on production, package prices took
 * between 1.9s (warm) and 11.6s (cold) to appear, and none of it was in the HTML — so link
 * previews and non-JS crawlers saw an empty page.
 *
 * Fetching here instead puts the content in the HTML and lets the client skip that work entirely.
 * Shapes match `api.ts` exactly — `{ ...doc.data(), id: doc.id }`, ordered by sort_order — so the
 * components consuming it do not change.
 */

export type PublicSiteData = {
  settings: Record<string, string>;
  services: Record<string, unknown>[];
  portfolio: Record<string, unknown>[];
  testimonials: Record<string, unknown>[];
  packages: Record<string, unknown>[];
  whyUs: Record<string, unknown>[];
  studioEquipment: Record<string, unknown>[];
  studios: Record<string, unknown>[];
  videos: Record<string, unknown>[];
  workshops: Record<string, unknown>[];
};

/**
 * Firestore hands back Timestamps, DocumentReferences and undefined, none of which survive the
 * server-to-client boundary. Reduce everything to JSON-safe values.
 */
function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === "function") return maybeTimestamp.toDate().toISOString();

    if (Array.isArray(value)) return value.map(toPlain);

    // A DocumentReference or similar: keep its path rather than the live object.
    const maybeRef = value as { path?: unknown; firestore?: unknown };
    if (typeof maybeRef.path === "string" && maybeRef.firestore) return maybeRef.path;

    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (inner === undefined) continue;
      out[key] = toPlain(inner);
    }
    return out;
  }

  return value;
}

/** `id` is applied after the spread, matching api.ts, so the document id always wins. */
async function listBySortOrder(db: Firestore, name: string): Promise<Record<string, unknown>[]> {
  const snapshot = await db.collection(name).orderBy("sort_order", "asc").limit(500).get();
  return snapshot.docs.map((doc) => ({
    ...(toPlain(doc.data()) as Record<string, unknown>),
    id: doc.id,
  }));
}

/**
 * Returns null when the data cannot be read, rather than throwing: the client provider still has
 * its own fetch and its bundled fallbacks, so a Firestore hiccup degrades to the old behaviour
 * instead of taking the marketing site down.
 */
async function readPublicSiteData(): Promise<PublicSiteData | null> {
  try {
    const db = getAdminFirestore();

    const [
      settingsSnap,
      services,
      portfolio,
      testimonials,
      packages,
      whyUs,
      studioEquipment,
      studios,
      videos,
      workshops,
    ] = await Promise.all([
      db.collection("site_settings").doc("main").get(),
      listBySortOrder(db, "services"),
      listBySortOrder(db, "portfolio"),
      listBySortOrder(db, "testimonials"),
      listBySortOrder(db, "booking_packages"),
      listBySortOrder(db, "why_us"),
      listBySortOrder(db, "studio_equipment"),
      listBySortOrder(db, "studios"),
      listBySortOrder(db, "videos"),
      listBySortOrder(db, "workshops"),
    ]);

    return {
      settings: (toPlain(settingsSnap.data() ?? {}) as Record<string, string>) ?? {},
      services,
      portfolio,
      testimonials,
      packages,
      whyUs,
      studioEquipment,
      studios,
      videos,
      workshops,
    };
  } catch (err) {
    if (!isFirebaseAdminConfigError(err)) console.error("[publicSiteData]", err);
    return null;
  }
}

/**
 * One shared read for the whole site.
 *
 * The root layout calls this, so every route used to run its own ten Firestore queries: a single
 * build issued 43 separate reads of the same data, and revalidatePath("/", "layout") made every
 * page repeat them again. Behind this cache the dataset is fetched once per window and every
 * route reuses it.
 *
 * A failed read is cached too, deliberately. Caching the failure is what stops an outage turning
 * into one retry per route; the cost is that public content can disappear or stay stale for up to
 * the TTL, or until a dashboard write clears the tag. That is a real trade-off, not a free win.
 */
export const getPublicSiteData = unstable_cache(readPublicSiteData, ["public-site-data"], {
  tags: [PUBLIC_SITE_DATA_TAG],
  revalidate: PUBLIC_SITE_DATA_TTL_SECONDS,
});
