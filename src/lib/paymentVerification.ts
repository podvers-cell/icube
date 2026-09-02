import { getAdminFirestore } from "@/firebase-admin";
import { normalizeStoredPaymentStatus } from "@/lib/bookingSlots";
import { computeBookingTotalAed } from "@/lib/dashboardBookingUi";

export type VerifiedPaymentRecord = {
  kind: "booking" | "enrollment";
  id: string;
  paymentStatus: "pending" | "paid" | "failed";
  bookingStatus: string | null;
  label: string;
  amountAed: number | null;
  bookingDate?: string | null;
  timeSlot?: string | null;
  email?: string | null;
  packageName?: string | null;
  studioName?: string | null;
};

export type PaymentPageOutcome = "success" | "processing" | "failed" | "not_found";

type FirestoreBooking = {
  payment_status?: string;
  status?: string;
  studio_name?: string;
  package_name?: string;
  package_id?: string;
  studio_total_aed?: number;
  addons_total_aed?: number;
  discount_percent?: number;
  total_amount_aed?: number;
  payment_amount_minor?: number;
  booking_date?: string;
  time_slot?: string;
  email?: string;
  promoted_booking_id?: string | null;
};

type FirestoreEnrollment = {
  payment_status?: string;
  workshop_id?: string;
  amount_aed?: number;
  payment_amount_minor?: number;
  workshop_date?: string;
  email?: string;
  full_name?: string;
};

function mapBooking(id: string, data: FirestoreBooking): VerifiedPaymentRecord {
  const paymentStatus = normalizeStoredPaymentStatus(data.payment_status);
  const bookingStatus =
    data.status === "completed" && data.promoted_booking_id ? "confirmed" : (data.status ?? null);

  return {
    kind: "booking",
    id,
    paymentStatus,
    bookingStatus,
    label: data.studio_name || data.package_name || "ICUBE booking",
    packageName: data.package_name ?? null,
    studioName: data.studio_name ?? null,
    amountAed: computeBookingTotalAed(data),
    bookingDate: data.booking_date ?? null,
    timeSlot: data.time_slot ?? null,
    email: data.email ?? null,
  };
}

function mapEnrollment(id: string, data: FirestoreEnrollment): VerifiedPaymentRecord {
  const paymentStatus = normalizeStoredPaymentStatus(data.payment_status);
  const workshopLabel = data.workshop_id ? `Workshop (${data.workshop_id})` : "Workshop enrollment";
  let amountAed: number | null = null;
  if (data.amount_aed != null && Number.isFinite(data.amount_aed)) {
    amountAed = data.amount_aed;
  } else if (data.payment_amount_minor != null && Number.isFinite(data.payment_amount_minor)) {
    amountAed = Math.round(data.payment_amount_minor) / 100;
  }

  return {
    kind: "enrollment",
    id,
    paymentStatus,
    bookingStatus: null,
    label: workshopLabel,
    amountAed,
    bookingDate: data.workshop_date ?? null,
    timeSlot: null,
    email: data.email ?? null,
  };
}

async function loadConfirmedBookingFromPending(
  pendingId: string,
  pendingData: FirestoreBooking
): Promise<VerifiedPaymentRecord | null> {
  if (!pendingData.promoted_booking_id) {
    return mapBooking(pendingId, pendingData);
  }

  const db = getAdminFirestore();
  const confirmedSnap = await db.collection("bookings").doc(pendingData.promoted_booking_id).get();
  if (!confirmedSnap.exists) {
    return mapBooking(pendingId, pendingData);
  }

  return mapBooking(confirmedSnap.id, confirmedSnap.data() as FirestoreBooking);
}

export async function verifyPaymentRecord(params: {
  bookingId?: string | null;
  enrollmentId?: string | null;
  intentId?: string | null;
}): Promise<VerifiedPaymentRecord | null> {
  const db = getAdminFirestore();
  const bookingId = params.bookingId?.trim();
  const enrollmentId = params.enrollmentId?.trim();
  const intentId = params.intentId?.trim();

  if (bookingId) {
    const pendingSnap = await db.collection("pending_bookings").doc(bookingId).get();
    if (pendingSnap.exists) {
      return loadConfirmedBookingFromPending(bookingId, pendingSnap.data() as FirestoreBooking);
    }

    const snap = await db.collection("bookings").doc(bookingId).get();
    if (snap.exists) return mapBooking(snap.id, snap.data() as FirestoreBooking);
  }

  if (enrollmentId) {
    const snap = await db.collection("workshop_enrollments").doc(enrollmentId).get();
    if (snap.exists) return mapEnrollment(snap.id, snap.data() as FirestoreEnrollment);
  }

  if (intentId) {
    const [pendingSnaps, bookingSnaps, enrollmentSnaps] = await Promise.all([
      db.collection("pending_bookings").where("ziina_intent_id", "==", intentId).limit(1).get(),
      db.collection("bookings").where("ziina_intent_id", "==", intentId).limit(1).get(),
      db.collection("workshop_enrollments").where("ziina_intent_id", "==", intentId).limit(1).get(),
    ]);

    if (!pendingSnaps.empty) {
      const doc = pendingSnaps.docs[0];
      return loadConfirmedBookingFromPending(doc.id, doc.data() as FirestoreBooking);
    }
    if (!bookingSnaps.empty) {
      const doc = bookingSnaps.docs[0];
      return mapBooking(doc.id, doc.data() as FirestoreBooking);
    }
    if (!enrollmentSnaps.empty) {
      const doc = enrollmentSnaps.docs[0];
      return mapEnrollment(doc.id, doc.data() as FirestoreEnrollment);
    }
  }

  return null;
}

export function getPaymentPageOutcome(record: VerifiedPaymentRecord | null): PaymentPageOutcome {
  if (!record) return "not_found";

  if (record.paymentStatus === "failed" || record.bookingStatus === "cancelled") {
    return "failed";
  }

  if (record.kind === "enrollment") {
    if (record.paymentStatus === "paid") return "success";
    if (record.paymentStatus === "pending") return "processing";
    return "failed";
  }

  if (record.paymentStatus === "paid" && record.bookingStatus === "confirmed") {
    return "success";
  }

  if (record.paymentStatus === "paid" && record.bookingStatus === "completed") {
    return "success";
  }

  if (record.paymentStatus === "pending") {
    return "processing";
  }

  if (record.paymentStatus === "paid") {
    return "processing";
  }

  return "failed";
}

export function getRetryUrl(bookingType: string | undefined, record: VerifiedPaymentRecord | null): string {
  const type = bookingType?.trim().toLowerCase();
  if (type === "studio") return "/studio/booking/checkout";
  if (type === "workshop") return "/#workshops";
  if (record?.studioName) return "/studio/booking/checkout";
  if (record?.packageName || record?.kind === "booking") return "/packages/checkout";
  if (record?.kind === "enrollment") return "/#workshops";
  return "/packages";
}

export function getContinueUrl(bookingType: string | undefined, record: VerifiedPaymentRecord | null): string {
  const type = bookingType?.trim().toLowerCase();
  if (type === "studio") return "/#studio";
  if (type === "workshop") return "/#workshops";
  if (record?.studioName) return "/#studio";
  if (record?.packageName) return "/packages";
  if (record?.kind === "enrollment") return "/#workshops";
  return "/";
}
