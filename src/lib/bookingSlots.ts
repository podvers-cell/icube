import type { Firestore, QueryDocumentSnapshot, Transaction } from "firebase-admin/firestore";

export const PENDING_BOOKINGS_COLLECTION = "pending_bookings";
export const CONFIRMED_BOOKINGS_COLLECTION = "bookings";
export const MAX_SLOT_HOUR = 22;
const SLOT_CLAIM_WINDOW_MS = 2 * 60 * 1000;

export function normalizeStoredPaymentStatus(status: string | undefined): "pending" | "paid" | "failed" {
  switch (status) {
    case "completed":
    case "paid":
      return "paid";
    case "failed":
    case "cancelled":
    case "canceled":
      return "failed";
    default:
      return "pending";
  }
}

export type SlotBookingLike = {
  status?: string | null;
  payment_status?: string | null;
  studio_id?: string | null;
  booking_date?: string | null;
  time_slot?: string | null;
  booking_duration_hours?: number | null;
};

function parseStartHour(timeSlotRaw: string): number | null {
  const m = timeSlotRaw.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const startHour = parseInt(m[1] ?? "0", 10);
  return Number.isFinite(startHour) ? startHour : null;
}

function parseDurationHours(raw: unknown): number {
  const parsed = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Only paid + confirmed (or legacy manual confirmed) bookings block availability. */
export function isConfirmedPaidBooking(data: SlotBookingLike): boolean {
  if (data.status === "cancelled") return false;

  const payment = normalizeStoredPaymentStatus(data.payment_status ?? undefined);
  const status = data.status ?? "";

  if (payment === "paid" && status === "confirmed") return true;

  // Legacy manual bookings before payment fields existed.
  if (!data.payment_status && status === "confirmed") return true;

  return false;
}

export function hourSlotsFromBooking(
  data: Pick<SlotBookingLike, "time_slot" | "booking_duration_hours">
): string[] {
  const timeSlotRaw = data.time_slot ?? "";
  const startHour = parseStartHour(timeSlotRaw);
  if (startHour == null) return [];

  const durationHours = parseDurationHours(data.booking_duration_hours);
  const slots: string[] = [];
  for (let i = 0; i < durationHours; i++) {
    const hour = startHour + i;
    if (hour <= MAX_SLOT_HOUR) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
    }
  }
  return slots;
}

/** When filtering by studio, bookings without studio_id apply to all studios on that date. */
export function bookingAppliesToStudio(data: SlotBookingLike, studioId?: string): boolean {
  if (studioId == null) return true;
  const bookingStudio = data.studio_id ?? null;
  if (bookingStudio == null) return true;
  return String(bookingStudio) === String(studioId);
}

export function occupiedSlotsFromBooking(data: SlotBookingLike, studioId?: string): string[] {
  if (!isConfirmedPaidBooking(data)) return [];
  if (!bookingAppliesToStudio(data, studioId)) return [];
  return hourSlotsFromBooking(data);
}

export function bookingsOverlap(a: SlotBookingLike, b: SlotBookingLike): boolean {
  const studioA = a.studio_id ?? null;
  const studioB = b.studio_id ?? null;
  if (studioA != null && studioB != null && String(studioA) !== String(studioB)) {
    return false;
  }

  const slotsA = new Set(hourSlotsFromBooking(a));
  return hourSlotsFromBooking(b).some((slot) => slotsA.has(slot));
}

export async function getOccupiedSlotsForDate(
  db: Firestore,
  bookingDate: string,
  studioId?: string
): Promise<string[]> {
  const slotSet = new Set<string>();
  const confirmedSnaps = await db
    .collection(CONFIRMED_BOOKINGS_COLLECTION)
    .where("booking_date", "==", bookingDate)
    .get();

  for (const snap of confirmedSnaps.docs) {
    const data = snap.data() as SlotBookingLike;
    for (const slot of occupiedSlotsFromBooking(data, studioId)) {
      slotSet.add(slot);
    }
  }

  return Array.from(slotSet);
}

export async function findPaidBookingSlotConflict(
  tx: Transaction,
  db: Firestore,
  candidate: SlotBookingLike,
  excludeBookingIds: string[] = [],
  claimBookingId?: string
): Promise<{ id: string; data: SlotBookingLike } | null> {
  if (!candidate.booking_date) return null;

  const snaps = await tx.get(
    db.collection(CONFIRMED_BOOKINGS_COLLECTION).where("booking_date", "==", candidate.booking_date)
  );

  const excluded = new Set(excludeBookingIds);

  for (const doc of snaps.docs) {
    if (excluded.has(doc.id)) continue;
    const data = doc.data() as SlotBookingLike;
    if (!isConfirmedPaidBooking(data)) continue;
    if (bookingsOverlap(candidate, data)) {
      return { id: doc.id, data };
    }
  }

  if (!claimBookingId) return null;

  const candidateSlots = hourSlotsFromBooking(candidate);
  const claimRefs = candidateSlots.map((slot) =>
    db.collection("booking_slot_claims").doc(`${candidate.booking_date}__${slot}`)
  );
  const claimSnaps = await Promise.all(claimRefs.map((ref) => tx.get(ref)));
  const candidateStudio = candidate.studio_id ?? null;

  for (const claimSnap of claimSnaps) {
    if (!claimSnap.exists) continue;
    const claim = claimSnap.data() as {
      booking_id?: string;
      studio_id?: string | null;
      claimed_at?: { toMillis?: () => number };
    };
    const claimedAt = typeof claim.claimed_at?.toMillis === "function" ? claim.claimed_at.toMillis() : 0;
    const isFresh = claimedAt > 0 && Date.now() - claimedAt < SLOT_CLAIM_WINDOW_MS;
    const claimedStudio = claim.studio_id ?? null;
    const sameResource = candidateStudio == null || claimedStudio == null || String(candidateStudio) === String(claimedStudio);
    if (isFresh && sameResource && claim.booking_id !== claimBookingId) {
      return { id: claim.booking_id ?? claimSnap.id, data: { studio_id: claimedStudio } };
    }
  }

  for (const claimRef of claimRefs) {
    tx.set(
      claimRef,
      {
        booking_id: claimBookingId,
        studio_id: candidateStudio,
        booking_date: candidate.booking_date,
        claimed_at: new Date(),
      },
      { merge: true }
    );
  }

  return null;
}

export function isDashboardVisibleBooking(data: {
  payment_status?: string | null;
  status?: string | null;
}): boolean {
  return isConfirmedPaidBooking(data);
}

export function mapDocToSlotBooking(snap: QueryDocumentSnapshot): SlotBookingLike {
  return snap.data() as SlotBookingLike;
}
