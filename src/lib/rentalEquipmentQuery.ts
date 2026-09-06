import type { Firestore } from "firebase-admin/firestore";
import type { RentalEquipment } from "@/types/rentalEquipment";

/** Upper bound on a single read. See the note in the API route about avoiding a composite index. */
export const RENTAL_EQUIPMENT_LIMIT = 500;

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
    image_url: data.image_url ?? "",
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
export async function getPublishedRentalEquipment(db: Firestore): Promise<RentalEquipment[]> {
  const snapshot = await db
    .collection("rental_equipment")
    .where("is_published", "==", true)
    .limit(RENTAL_EQUIPMENT_LIMIT)
    .get();

  return snapshot.docs
    .map((doc) => toPublicEquipment(doc.id, doc.data()))
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Distinct categories in catalogue order, for the filter row. */
export function rentalCategories(items: RentalEquipment[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const category = item.category.trim();
    if (category) seen.add(category);
  }
  return [...seen];
}
