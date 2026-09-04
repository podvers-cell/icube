import { randomUUID } from "crypto";
import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/firebase-admin";
import { resolveCanonicalWorkshopPricing } from "@/lib/bookingPricing";

type BookingType = "package" | "studio" | "workshop";

type CreateIntentBody = {
  bookingType?: BookingType;
  bookingId?: string;
  workshopEnrollmentId?: string;
};

type PaymentRecord = {
  booking_type?: string;
  package_id?: string;
  package_name?: string | null;
  studio_name?: string | null;
  booking_date?: string | null;
  time_slot?: string | null;
  booking_duration_hours?: number | null;
  workshop_title?: string | null;
  workshop_id?: string | null;
  workshop_date?: string | null;
  amount_aed?: number;
  email?: string | null;
  expected_payment_amount_minor?: number;
  expected_payment_currency?: string;
  ziina_intent_id?: string | null;
  payment_status?: string | null;
  promoted_booking_id?: string | null;
  payment_initialization_token?: string | null;
  payment_initializing_at?: unknown;
};

type PaymentTarget = {
  ref: DocumentReference;
  record: PaymentRecord;
  type: BookingType;
  idParam: "booking_id" | "enrollment_id";
  id: string;
};

const INITIALIZATION_LOCK_MS = 10 * 60 * 1000;

function getBaseUrl(request: Request): string {
  const configured = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("APP_URL must use HTTPS in production.");
    }
    return url.origin;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL is required in production.");
  }
  return new URL(request.url).origin;
}

function inferBookingType(record: PaymentRecord): "package" | "studio" {
  if (record.booking_type === "package" || record.booking_type === "studio") return record.booking_type;
  return record.package_id ? "package" : "studio";
}

function validateExpectedPayment(record: PaymentRecord): { amount: number; currency: string } {
  const amount = Number(record.expected_payment_amount_minor);
  const currency = record.expected_payment_currency?.trim().toUpperCase() ?? "";
  if (!Number.isInteger(amount) || amount <= 0 || currency !== "AED") {
    throw new Error("Checkout price has not been verified by the server. Please restart the booking.");
  }
  return { amount, currency };
}

async function loadPaymentTarget(db: Firestore, body: CreateIntentBody): Promise<PaymentTarget> {
  const bookingId = body.bookingId?.trim();
  const enrollmentId = body.workshopEnrollmentId?.trim();
  if ((bookingId ? 1 : 0) + (enrollmentId ? 1 : 0) !== 1) {
    throw new Error("Exactly one booking reference is required.");
  }

  if (enrollmentId) {
    if (body.bookingType !== "workshop") throw new Error("Booking type does not match the payment record.");
    const ref = db.collection("workshop_enrollments").doc(enrollmentId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Workshop enrollment was not found.");
    const stored = snap.data() as PaymentRecord;
    const workshopId = stored.workshop_id?.trim();
    if (!workshopId) throw new Error("Workshop enrollment is missing its workshop reference.");
    const pricing = await resolveCanonicalWorkshopPricing(db, workshopId);
    return {
      ref,
      record: { ...stored, ...pricing },
      type: "workshop",
      idParam: "enrollment_id",
      id: enrollmentId,
    };
  }

  const pendingRef = db.collection("pending_bookings").doc(bookingId!);
  const pendingSnap = await pendingRef.get();
  const ref = pendingSnap.exists ? pendingRef : db.collection("bookings").doc(bookingId!);
  const snap = pendingSnap.exists ? pendingSnap : await ref.get();
  if (!snap.exists) throw new Error("Booking was not found.");

  const record = snap.data() as PaymentRecord;
  const inferredType = inferBookingType(record);
  if (body.bookingType !== inferredType) throw new Error("Booking type does not match the payment record.");
  return { ref, record, type: inferredType, idParam: "booking_id", id: bookingId! };
}

function paymentMessage(target: PaymentTarget): string {
  const record = target.record;
  const name =
    target.type === "workshop"
      ? record.workshop_title || "ICUBE Workshop"
      : record.package_name || record.studio_name || "ICUBE Booking";
  const details = [
    target.type === "workshop" ? record.workshop_date : record.booking_date,
    target.type === "workshop" ? null : record.time_slot,
    target.type !== "workshop" && record.booking_duration_hours ? `${record.booking_duration_hours}h` : null,
  ].filter(Boolean);
  return `${name}${details.length ? ` · ${details.join(" · ")}` : ""}`;
}

function lockIsFresh(record: PaymentRecord): boolean {
  if (!record.payment_initialization_token || !record.payment_initializing_at) return false;
  const timestamp = record.payment_initializing_at as { toMillis?: () => number };
  if (typeof timestamp.toMillis !== "function") return false;
  const millis = timestamp.toMillis();
  return Number.isFinite(millis) && Date.now() - millis < INITIALIZATION_LOCK_MS;
}

async function reservePaymentInitialization(db: Firestore, target: PaymentTarget, token: string): Promise<void> {
  const expected = validateExpectedPayment(target.record);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(target.ref);
    if (!snap.exists) throw new Error("Payment record was not found.");
    const current = snap.data() as PaymentRecord;
    if (target.type !== "workshop") validateExpectedPayment(current);
    if (current.payment_status === "paid" || current.promoted_booking_id) {
      throw new Error("This booking has already been paid.");
    }
    if (current.ziina_intent_id) {
      throw new Error("A payment session already exists for this booking.");
    }
    if (lockIsFresh(current)) {
      throw new Error("Payment initialization is already in progress. Please wait a moment.");
    }
    tx.update(target.ref, {
      ...(target.type === "workshop"
        ? {
            workshop_title: target.record.workshop_title ?? null,
            workshop_date: target.record.workshop_date ?? null,
            amount_aed: expected.amount / 100,
            expected_payment_amount_minor: expected.amount,
            expected_payment_currency: expected.currency,
          }
        : {}),
      payment_initialization_token: token,
      payment_initializing_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  });
}

async function clearPaymentInitialization(db: Firestore, target: PaymentTarget, token: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(target.ref);
    if (!snap.exists) return;
    const current = snap.data() as PaymentRecord;
    if (current.payment_initialization_token !== token) return;
    tx.update(target.ref, {
      payment_initialization_token: FieldValue.delete(),
      payment_initializing_at: FieldValue.delete(),
      updated_at: FieldValue.serverTimestamp(),
    });
  });
}

export async function POST(request: Request) {
  let target: PaymentTarget | null = null;
  let initializationToken: string | null = null;
  try {
    const apiToken = process.env.ZIINA_API_KEY?.trim();
    if (!apiToken) {
      return NextResponse.json({ error: "ZIINA_API_KEY is missing on server." }, { status: 500 });
    }

    const body = (await request.json()) as CreateIntentBody;
    const db = getAdminFirestore();
    target = await loadPaymentTarget(db, body);
    const expected = validateExpectedPayment(target.record);
    const baseUrl = getBaseUrl(request);
    initializationToken = randomUUID();
    await reservePaymentInitialization(db, target, initializationToken);

    const successParams = new URLSearchParams({ type: target.type, [target.idParam]: target.id });
    const cancelParams = new URLSearchParams({ type: target.type, [target.idParam]: target.id });
    const ziinaResponse = await fetch("https://api-v2.ziina.com/api/payment_intent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: expected.amount,
        currency_code: expected.currency,
        message: paymentMessage(target),
        success_url: `${baseUrl}/payment-gateway/success?${successParams.toString()}`,
        cancel_url: `${baseUrl}/payment-gateway/failed?${cancelParams.toString()}`,
        ...(target.record.email ? { email: target.record.email } : {}),
        test: process.env.ZIINA_TEST_MODE !== "false",
      }),
    });

    const ziinaBody = (await ziinaResponse.json().catch(() => ({}))) as {
      id?: string;
      redirect_url?: string;
      message?: string;
      error?: { message?: string };
    };
    if (!ziinaResponse.ok || !ziinaBody.id || !ziinaBody.redirect_url) {
      await clearPaymentInitialization(db, target, initializationToken);
      initializationToken = null;
      const providerError = ziinaBody.error?.message || ziinaBody.message || "Ziina request failed.";
      return NextResponse.json({ error: providerError }, { status: 502 });
    }

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(target!.ref);
      if (!snap.exists) throw new Error("Payment record was not found.");
      const current = snap.data() as PaymentRecord;
      if (current.payment_initialization_token !== initializationToken) {
        throw new Error("Payment initialization lock was lost.");
      }
      tx.update(target!.ref, {
        ziina_intent_id: ziinaBody.id,
        payment_status: "pending",
        payment_provider: "ziina",
        payment_intent_status: "requires_payment_instrument",
        payment_initialization_token: FieldValue.delete(),
        payment_initializing_at: FieldValue.delete(),
        updated_at: FieldValue.serverTimestamp(),
      });
    });
    initializationToken = null;

    return NextResponse.json({
      redirect_url: ziinaBody.redirect_url,
      payment_intent_id: ziinaBody.id,
      mode: process.env.ZIINA_TEST_MODE !== "false" ? "test" : "live",
    });
  } catch (error) {
    if (target && initializationToken) {
      try {
        await clearPaymentInitialization(getAdminFirestore(), target, initializationToken);
      } catch (cleanupError) {
        console.error("[payments/create-intent] Failed to release initialization lock:", cleanupError);
      }
    }
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    const isClientError =
      message.includes("required") ||
      message.includes("not found") ||
      message.includes("does not match") ||
      message.includes("already") ||
      message.includes("restart") ||
      message.includes("progress");
    return NextResponse.json({ error: message }, { status: isClientError ? 409 : 500 });
  }
}
