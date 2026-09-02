import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/firebase-admin";
import { sendPaidBookingConfirmedEmail, type PaidBookingEmailPayload } from "@/lib/bookingEmail";
import { assertBookingSlotAvailable, resolvePackageName } from "@/lib/bookingValidation";
import {
  CONFIRMED_BOOKINGS_COLLECTION,
  PENDING_BOOKINGS_COLLECTION,
  PENDING_HOLD_MS,
  normalizeStoredPaymentStatus,
} from "@/lib/bookingSlots";
import type { CreatePendingBookingSchema } from "@/schemas/booking";

export { normalizeStoredPaymentStatus };

export type PaymentMeta = {
  eventName?: string;
  providerStatus?: string;
  amountMinor?: number | null;
  currency?: string | null;
  message?: string | null;
};

export type BookingRecord = CreatePendingBookingSchema & {
  package_name?: string | null;
  status?: string;
  payment_status?: string;
  confirmation_email_sent_at?: Timestamp | null;
  paid_at?: Timestamp | null;
  confirmed_at?: Timestamp | null;
  promoted_booking_id?: string | null;
};

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export async function createPendingBooking(
  db: Firestore,
  input: CreatePendingBookingSchema
): Promise<{ bookingId: string; package_name: string | null }> {
  await assertBookingSlotAvailable(db, input);

  let packageName: string | null = null;
  if (input.package_id) {
    packageName = await resolvePackageName(db, input.package_id);
  }

  const expiresAt = Timestamp.fromMillis(Date.now() + PENDING_HOLD_MS);

  const ref = await db.collection(PENDING_BOOKINGS_COLLECTION).add({
    ...stripUndefined(input),
    package_name: packageName,
    status: "awaiting_payment",
    payment_status: "pending",
    expires_at: expiresAt,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return { bookingId: ref.id, package_name: packageName };
}

export async function incrementDiscountCodeOnce(db: Firestore, rawCode: string | undefined | null): Promise<void> {
  if (!rawCode?.trim()) return;

  const code = rawCode.trim().toUpperCase();
  const snaps = await db.collection("discount_codes").where("code", "==", code).limit(1).get();
  if (snaps.empty) return;

  const docSnap = snaps.docs[0];
  const data = docSnap.data() as { used_count?: number; max_uses?: number };
  const used = (data.used_count ?? 0) + 1;
  const maxUses = data.max_uses ?? 1;
  const shouldDeactivate = used >= maxUses;

  await docSnap.ref.update({
    used_count: used,
    ...(shouldDeactivate ? { active: false } : {}),
    updated_at: FieldValue.serverTimestamp(),
  });
}

function bookingToEmailPayload(data: BookingRecord): PaidBookingEmailPayload {
  return {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    studio_name: data.studio_name,
    package_id: data.package_id,
    package_name: data.package_name ?? undefined,
    booking_date: data.booking_date,
    time_slot: data.time_slot,
    booking_duration_hours: data.booking_duration_hours,
    studio_total_aed: data.studio_total_aed,
    addons_total_aed: data.addons_total_aed,
    total_amount_aed: data.total_amount_aed,
    project_details: data.project_details,
  };
}

async function finalizeLegacyBookingInPlace(
  db: Firestore,
  bookingRef: DocumentReference,
  meta: PaymentMeta
): Promise<{ alreadyPaid: boolean; emailSent: boolean }> {
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists) return { alreadyPaid: false, shouldSendEmail: false, data: null as BookingRecord | null };

    const data = snap.data() as BookingRecord;
    const alreadyPaid = data.payment_status === "paid";
    const emailAlreadySent = Boolean(data.confirmation_email_sent_at);

    if (alreadyPaid) {
      return { alreadyPaid: true, shouldSendEmail: false, data };
    }

    tx.update(bookingRef, {
      payment_status: "paid",
      status: "confirmed",
      payment_provider: "ziina",
      payment_event: meta.eventName ?? null,
      payment_intent_status: meta.providerStatus ?? null,
      payment_amount_minor: meta.amountMinor ?? null,
      payment_currency: meta.currency ?? null,
      payment_last_message: meta.message ?? null,
      paid_at: FieldValue.serverTimestamp(),
      confirmed_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return { alreadyPaid: false, shouldSendEmail: !emailAlreadySent, data };
  });

  if (result.alreadyPaid) {
    return { alreadyPaid: true, emailSent: Boolean(result.data?.confirmation_email_sent_at) };
  }

  if (!result.data) return { alreadyPaid: false, emailSent: false };

  try {
    await incrementDiscountCodeOnce(db, result.data.discount_code);
  } catch (err) {
    console.error("[finalizePaidBooking] Discount increment failed:", err);
  }

  if (!result.shouldSendEmail || !result.data.email) {
    return { alreadyPaid: false, emailSent: false };
  }

  const emailResult = await sendPaidBookingConfirmedEmail(bookingToEmailPayload(result.data));
  if (emailResult.ok) {
    await bookingRef.update({
      confirmation_email_sent_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    return { alreadyPaid: false, emailSent: true };
  }

  console.error("[finalizePaidBooking] Confirmation email failed:", emailResult.error);
  return { alreadyPaid: false, emailSent: false };
}

export async function finalizePaidBooking(
  checkoutId: string,
  meta: PaymentMeta
): Promise<{ alreadyPaid: boolean; emailSent: boolean }> {
  const db = getAdminFirestore();
  const pendingRef = db.collection(PENDING_BOOKINGS_COLLECTION).doc(checkoutId);
  const pendingSnap = await pendingRef.get();

  if (!pendingSnap.exists) {
    const legacyRef = db.collection(CONFIRMED_BOOKINGS_COLLECTION).doc(checkoutId);
    const legacySnap = await legacyRef.get();
    if (!legacySnap.exists) return { alreadyPaid: false, emailSent: false };
    return finalizeLegacyBookingInPlace(db, legacyRef, meta);
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(pendingRef);
    if (!snap.exists) return { alreadyPaid: false, shouldSendEmail: false, data: null as BookingRecord | null, confirmedRef: null as DocumentReference | null };

    const data = snap.data() as BookingRecord & { expires_at?: unknown };
    if (data.promoted_booking_id) {
      const confirmedRef = db.collection(CONFIRMED_BOOKINGS_COLLECTION).doc(data.promoted_booking_id);
      return {
        alreadyPaid: true,
        shouldSendEmail: false,
        data,
        confirmedRef,
      };
    }

    const confirmedRef = db.collection(CONFIRMED_BOOKINGS_COLLECTION).doc();
    const { expires_at: _expires, ...rest } = data as BookingRecord & { expires_at?: unknown };

    tx.set(confirmedRef, {
      ...rest,
      payment_status: "paid",
      status: "confirmed",
      payment_provider: "ziina",
      payment_event: meta.eventName ?? null,
      payment_intent_status: meta.providerStatus ?? null,
      payment_amount_minor: meta.amountMinor ?? null,
      payment_currency: meta.currency ?? null,
      payment_last_message: meta.message ?? null,
      paid_at: FieldValue.serverTimestamp(),
      confirmed_at: FieldValue.serverTimestamp(),
      pending_checkout_id: checkoutId,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    tx.update(pendingRef, {
      payment_status: "paid",
      status: "completed",
      promoted_booking_id: confirmedRef.id,
      paid_at: FieldValue.serverTimestamp(),
      payment_provider: "ziina",
      payment_event: meta.eventName ?? null,
      payment_intent_status: meta.providerStatus ?? null,
      payment_amount_minor: meta.amountMinor ?? null,
      payment_currency: meta.currency ?? null,
      payment_last_message: meta.message ?? null,
      updated_at: FieldValue.serverTimestamp(),
    });

    const emailAlreadySent = Boolean(data.confirmation_email_sent_at);
    return {
      alreadyPaid: false,
      shouldSendEmail: !emailAlreadySent,
      data: { ...data, ...rest } as BookingRecord,
      confirmedRef,
    };
  });

  if (result.alreadyPaid) {
    return { alreadyPaid: true, emailSent: Boolean(result.data?.confirmation_email_sent_at) };
  }

  if (!result.data || !result.confirmedRef) {
    return { alreadyPaid: false, emailSent: false };
  }

  try {
    await incrementDiscountCodeOnce(db, result.data.discount_code);
  } catch (err) {
    console.error("[finalizePaidBooking] Discount increment failed:", err);
  }

  if (!result.shouldSendEmail || !result.data.email) {
    return { alreadyPaid: false, emailSent: false };
  }

  const emailResult = await sendPaidBookingConfirmedEmail(bookingToEmailPayload(result.data));
  if (emailResult.ok) {
    await result.confirmedRef.update({
      confirmation_email_sent_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    await pendingRef.update({
      confirmation_email_sent_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    return { alreadyPaid: false, emailSent: true };
  }

  console.error("[finalizePaidBooking] Confirmation email failed:", emailResult.error);
  return { alreadyPaid: false, emailSent: false };
}

export async function markBookingPaymentFailed(checkoutId: string, meta: PaymentMeta): Promise<void> {
  const db = getAdminFirestore();
  const pendingRef = db.collection(PENDING_BOOKINGS_COLLECTION).doc(checkoutId);
  const pendingSnap = await pendingRef.get();

  if (pendingSnap.exists) {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(pendingRef);
      if (!snap.exists) return;

      const data = snap.data() as { payment_status?: string; promoted_booking_id?: string | null };
      if (data.payment_status === "paid" || data.promoted_booking_id) return;

      tx.update(pendingRef, {
        payment_status: "failed",
        status: "cancelled",
        payment_provider: "ziina",
        payment_event: meta.eventName ?? null,
        payment_intent_status: meta.providerStatus ?? null,
        payment_amount_minor: meta.amountMinor ?? null,
        payment_currency: meta.currency ?? null,
        payment_last_message: meta.message ?? null,
        updated_at: FieldValue.serverTimestamp(),
      });
    });
    return;
  }

  const legacyRef = db.collection(CONFIRMED_BOOKINGS_COLLECTION).doc(checkoutId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(legacyRef);
    if (!snap.exists) return;

    const data = snap.data() as { payment_status?: string };
    if (data.payment_status === "paid") return;

    tx.update(legacyRef, {
      payment_status: "failed",
      status: "cancelled",
      payment_provider: "ziina",
      payment_event: meta.eventName ?? null,
      payment_intent_status: meta.providerStatus ?? null,
      payment_amount_minor: meta.amountMinor ?? null,
      payment_currency: meta.currency ?? null,
      payment_last_message: meta.message ?? null,
      updated_at: FieldValue.serverTimestamp(),
    });
  });
}

export async function updateBookingPaymentPending(
  checkoutId: string,
  intentId: string,
  providerStatus?: string
): Promise<void> {
  const db = getAdminFirestore();
  const pendingRef = db.collection(PENDING_BOOKINGS_COLLECTION).doc(checkoutId);
  const pendingSnap = await pendingRef.get();

  const payload = {
    ziina_intent_id: intentId,
    payment_status: "pending",
    payment_provider: "ziina",
    payment_intent_status: providerStatus ?? "requires_payment_instrument",
    updated_at: FieldValue.serverTimestamp(),
  };

  if (pendingSnap.exists) {
    await pendingRef.update(payload);
    return;
  }

  await db.collection(CONFIRMED_BOOKINGS_COLLECTION).doc(checkoutId).update(payload);
}
