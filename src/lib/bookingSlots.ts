import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

export const PENDING_BOOKINGS_COLLECTION = "pending_bookings";
export const CONFIRMED_BOOKINGS_COLLECTION = "bookings";
export const PENDING_HOLD_MS = 30 * 60 * 1000;
export const MAX_SLOT_HOUR = 22;

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

type SlotBookingLike = {
  status?: string | null;
  payment_status?: string | null;
  studio_id?: string | null;
  booking_date?: string | null;
  time_slot?: string | null;
  booking_duration_hours?: number | null;
  expires_at?: { toMillis?: () => number; seconds?: number } | null;
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

function isActivePendingCheckout(data: SlotBookingLike, nowMs: number): boolean {
  if (normalizeStoredPaymentStatus(data.payment_status ?? undefined) === "failed") return false;
  if (data.status === "cancelled" || data.status === "completed") return false;

  const expiresAt = data.expires_at;
  if (expiresAt && typeof expiresAt.toMillis === "function") {
    return expiresAt.toMillis() > nowMs;
  }
  if (expiresAt && typeof expiresAt.seconds === "number") {
    return expiresAt.seconds * 1000 > nowMs;
  }

  return normalizeStoredPaymentStatus(data.payment_status ?? undefined) === "pending";
}

function isConfirmedPaidBooking(data: SlotBookingLike): boolean {
  const payment = normalizeStoredPaymentStatus(data.payment_status ?? undefined);
  if (payment === "paid") return data.status !== "cancelled";
  if (!data.payment_status && data.status === "confirmed") return true;
  return false;
}

export function occupiedSlotsFromBooking(
  data: SlotBookingLike,
  studioId?: string,
  nowMs = Date.now()
): string[] {
  if (data.status === "cancelled") return [];

  const holdsSlot = isConfirmedPaidBooking(data) || isActivePendingCheckout(data, nowMs);
  if (!holdsSlot) return [];

  if (studioId != null && String(data.studio_id ?? "") !== String(studioId)) return [];

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

export async function getOccupiedSlotsForDate(
  db: Firestore,
  bookingDate: string,
  studioId?: string
): Promise<string[]> {
  const nowMs = Date.now();
  const slotSet = new Set<string>();

  const [confirmedSnaps, pendingSnaps] = await Promise.all([
    db.collection(CONFIRMED_BOOKINGS_COLLECTION).where("booking_date", "==", bookingDate).get(),
    db.collection(PENDING_BOOKINGS_COLLECTION).where("booking_date", "==", bookingDate).get(),
  ]);

  for (const snap of [...confirmedSnaps.docs, ...pendingSnaps.docs]) {
    const data = snap.data() as SlotBookingLike;
    for (const slot of occupiedSlotsFromBooking(data, studioId, nowMs)) {
      slotSet.add(slot);
    }
  }

  return Array.from(slotSet);
}

export function isDashboardVisibleBooking(data: {
  payment_status?: string | null;
  status?: string | null;
}): boolean {
  const payment = normalizeStoredPaymentStatus(data.payment_status ?? undefined);
  if (payment === "paid" && data.status !== "cancelled") return true;
  if (!data.payment_status && data.status === "confirmed") return true;
  return false;
}

export function mapDocToSlotBooking(snap: QueryDocumentSnapshot): SlotBookingLike {
  return snap.data() as SlotBookingLike;
}
