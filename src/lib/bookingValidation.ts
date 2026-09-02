import type { Firestore } from "firebase-admin/firestore";
import { isSlotTooSoonInRegion } from "@/utils/bookingTimezone";
import type { BookingPayloadSchema } from "@/schemas/booking";

/** Lead time + admin blocks only — pending checkout does not reserve a slot. */
export async function assertPendingCheckoutAllowed(
  db: Firestore,
  booking: Pick<BookingPayloadSchema, "booking_date" | "time_slot" | "studio_id">
): Promise<void> {
  if (!booking.booking_date || !booking.time_slot) return;

  if (isSlotTooSoonInRegion(booking.booking_date, booking.time_slot, 180)) {
    throw new Error("Please select a time slot at least 3 hours from now (Dubai time).");
  }

  const blockedSnaps = await db
    .collection("blocked_slots")
    .where("booking_date", "==", booking.booking_date)
    .where("time_slot", "==", booking.time_slot)
    .get();

  if (blockedSnaps.empty) return;

  const studioId = booking.studio_id ?? null;
  const isBlocked = blockedSnaps.docs.some((d) => {
    const data = d.data() as { studio_id?: string | null };
    const blockedStudio = data.studio_id ?? null;
    return blockedStudio == null || (studioId != null && blockedStudio === studioId);
  });

  if (isBlocked) {
    throw new Error("This time slot is blocked. Please choose another time.");
  }
}

export async function resolvePackageName(db: Firestore, packageId: string): Promise<string | null> {
  const trimmed = packageId.trim();
  if (!trimmed) return null;

  const byDocId = await db.collection("booking_packages").doc(trimmed).get();
  if (byDocId.exists) {
    const name = byDocId.data()?.name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }

  const numericId = Number(trimmed);
  if (Number.isFinite(numericId)) {
    const byField = await db.collection("booking_packages").where("id", "==", numericId).limit(1).get();
    if (!byField.empty) {
      const name = byField.docs[0].data()?.name;
      if (typeof name === "string" && name.trim()) return name.trim();
    }
  }

  return null;
}
