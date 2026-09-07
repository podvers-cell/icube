import { unstable_cache } from "next/cache";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/firebase-admin";
import type { RentalEquipment } from "@/types/rentalEquipment";
import { RENTAL_IMAGE_LIMIT } from "@/schemas/rentalEquipment";

/** Upper bound on a single read. See the note in the API route about avoiding a composite index. */
export const RENTAL_EQUIPMENT_LIMIT = 500;

/**
 * A URL is only published if it parses and is https.
 *
 * startsWith("https://") alone let malformed values through, and the legacy image_url was
 * published raw — a document written before the schema required https could reach a public page
 * unchecked. Both fields go through this now. Existing https links are unaffected.
 */
function publicImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * The exact shape published to unauthenticated callers.
 *
 * Deliberately an explicit list rather than a spread of the stored document: any internal field
 * added later (cost, supplier, notes) would otherwise reach the public catalogue the day it is
 * introduced, silently.
 */
export function toPublicEquipment(id: string, data: FirebaseFirestore.DocumentData): RentalEquipment {
  return {
    id,
    name: data.name ?? "",
    category: data.category ?? "",
    short_description: data.short_description ?? "",
    details: data.details ?? "",
    image_url: publicImageUrl(data.image_url) ?? "",
    image_urls: Array.isArray(data.image_urls)
      ? (data.image_urls as unknown[])
          .map(publicImageUrl)
          .filter((url): url is string => url !== null)
          .slice(0, RENTAL_IMAGE_LIMIT)
      : [],
    price_aed: Number(data.price_aed ?? 0),
    price_unit: data.price_unit ?? "day",
    quantity_available: Number(data.quantity_available ?? 0),
    availability_status: data.availability_status ?? "on_request",
    is_featured: data.is_featured === true,
    is_published: data.is_published === true,
    sort_order: Number(data.sort_order ?? 0),
  };
}

/**
 * Published equipment, ordered by sort_order.
 *
 * where() is deliberately not combined with orderBy(): that pairing needs a composite index on
 * (is_published, sort_order), and index deployment is blocked by the same missing service-account
 * permission as the Firestore rules. Both paths here are served by automatic single-field indexes,
 * and a few hundred rows sort in memory for nothing.
 */
async function readPublishedRentalEquipment(db: Firestore): Promise<RentalEquipment[]> {
  const snapshot = await db
    .collection("rental_equipment")
    .where("is_published", "==", true)
    .limit(RENTAL_EQUIPMENT_LIMIT)
    .get();

  return snapshot.docs
    .map((doc) => toPublicEquipment(doc.id, doc.data()))
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Invalidated from /api/revalidate after a rental equipment write. */
export const RENTAL_EQUIPMENT_TAG = "rental-equipment";

/**
 * Shared between the public catalogue page and the public GET, so the two do not read separately.
 *
 * Its own tag rather than the site-wide one: equipment changes far more often than hero copy, and
 * clearing one should not force the other to be re-read.
 */
export const getPublishedRentalEquipment = unstable_cache(
  async (): Promise<RentalEquipment[] | null> => {
    try {
      return await readPublishedRentalEquipment(getAdminFirestore());
    } catch (err) {
      // Returned rather than thrown so the failure is cached: unstable_cache does not cache a
      // throw, so every request retried and 15 requests meant 15 Firestore attempts. Callers get
      // null and decide how to present it.
      console.error("[rentalEquipment] read failed:", err);
      return null;
    }
  },
  ["published-rental-equipment"],
  { tags: [RENTAL_EQUIPMENT_TAG], revalidate: 300 }
);

/** Distinct categories in catalogue order, for the filter row. */
export function rentalCategories(items: RentalEquipment[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const category = item.category.trim();
    if (category) seen.add(category);
  }
  return [...seen];
}
