import { randomUUID } from "crypto";
import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/firebase-admin";
import { resolveCanonicalWorkshopPricing } from "@/lib/bookingPricing";
import { ClientFacingError, toApiError } from "@/lib/apiErrors";
import { checkoutTokenMatches } from "@/lib/checkoutToken";

type BookingType = "package" | "studio" | "workshop";

type CreateIntentBody = {
  bookingType?: BookingType;
  bookingId?: string;
  workshopEnrollmentId?: string;
  checkoutToken?: string;
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
  checkout_token_hash?: string;
  ziina_intent_id?: string | null;
  superseded_intent_ids?: string[];
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

/**
 * A customer who abandons the Ziina redirect must be able to pay later, so an existing unpaid
 * intent is superseded rather than treated as permanent. Capped so a stuck client (or an
 * unauthenticated caller, until checkout ownership lands) cannot mint intents without bound.
 */
const MAX_INTENT_REISSUES = 10;

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
    throw new ClientFacingError("Checkout price has not been verified by the server. Please restart the booking.", 409);
  }
  return { amount, currency };
}

async function loadPaymentTarget(db: Firestore, body: CreateIntentBody): Promise<PaymentTarget> {
  const bookingId = body.bookingId?.trim();
  const enrollmentId = body.workshopEnrollmentId?.trim();
  if ((bookingId ? 1 : 0) + (enrollmentId ? 1 : 0) !== 1) {
    throw new ClientFacingError("Exactly one booking reference is required.", 400);
  }

  if (enrollmentId) {
    if (body.bookingType !== "workshop") throw new ClientFacingError("Booking type does not match the payment record.", 400);
    const ref = db.collection("workshop_enrollments").doc(enrollmentId);
    const snap = await ref.get();
    if (!snap.exists) throw new ClientFacingError("Workshop enrollment was not found.", 404);
    const stored = snap.data() as PaymentRecord;
    const workshopId = stored.workshop_id?.trim();
    if (!workshopId) throw new ClientFacingError("Workshop enrollment is missing its workshop reference.", 409);
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
  if (!snap.exists) throw new ClientFacingError("Booking was not found.", 404);

  const record = snap.data() as PaymentRecord;
  const inferredType = inferBookingType(record);
  if (body.bookingType !== inferredType) throw new ClientFacingError("Booking type does not match the payment record.", 400);
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

async function reservePaymentInitialization(
  db: Firestore,
  target: PaymentTarget,
  token: string,
  checkoutToken: string | undefined
): Promise<void> {
  const expected = validateExpectedPayment(target.record);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(target.ref);
    if (!snap.exists) throw new ClientFacingError("Payment record was not found.", 404);
    const current = snap.data() as PaymentRecord;

    // Ownership: only the client that created this booking holds the token. Checked against the
    // freshly read record inside the transaction so it cannot be raced.
    if (!current.checkout_token_hash) {
      // Records created before checkout tokens existed cannot prove ownership. They are still
      // payable so nobody's in-flight booking breaks on deploy; remove this once they have aged out.
      console.warn("[payments/create-intent] Legacy record without a checkout token:", target.ref.path);
    } else if (!checkoutTokenMatches(checkoutToken, current.checkout_token_hash)) {
      throw new ClientFacingError("This checkout session is no longer valid. Please start again.", 403);
    }
    if (target.type !== "workshop") validateExpectedPayment(current);
    if (current.payment_status === "paid" || current.promoted_booking_id) {
      throw new ClientFacingError("This booking has already been paid.", 409);
    }
    if (lockIsFresh(current)) {
      throw new ClientFacingError("Payment initialization is already in progress. Please wait a moment.", 409);
    }
    // An unpaid intent left over from an abandoned checkout used to lock the booking forever.
    // It is superseded below instead; only an unbounded retry loop is refused.
    const superseded = Array.isArray(current.superseded_intent_ids) ? current.superseded_intent_ids : [];
    if (current.ziina_intent_id && superseded.length >= MAX_INTENT_REISSUES) {
      throw new ClientFacingError("Too many payment attempts for this booking. Please contact support.", 429);
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
    await reservePaymentInitialization(db, target, initializationToken, body.checkoutToken?.trim());

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
      // The provider's own wording can carry account and request detail, so it is logged rather
      // than returned.
      console.error("[payments/create-intent] Ziina rejected the request:", {
        status: ziinaResponse.status,
        message: ziinaBody.error?.message || ziinaBody.message,
      });
      return NextResponse.json(
        { error: "Could not start the payment. Please try again shortly." },
        { status: 502 }
      );
    }

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(target!.ref);
      if (!snap.exists) throw new ClientFacingError("Payment record was not found.", 404);
      const current = snap.data() as PaymentRecord;
      if (current.payment_initialization_token !== initializationToken) {
        throw new ClientFacingError("Payment initialization could not be completed. Please try again.", 409);
      }
      const replacedIntentId =
        current.ziina_intent_id && current.ziina_intent_id !== ziinaBody.id ? current.ziina_intent_id : null;
      tx.update(target!.ref, {
        // Keep every intent this record has ever held: the webhook matches on the superseded
        // ids too, so a late "paid" callback on an abandoned intent is still honoured.
        ...(replacedIntentId ? { superseded_intent_ids: FieldValue.arrayUnion(replacedIntentId) } : {}),
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
    // Previously the status was chosen by substring-matching the message, which both leaked
    // internal error text and changed behaviour whenever a message was reworded.
    const { message, status } = toApiError("payments/create-intent", error, "Could not start payment. Please try again.");
    return NextResponse.json({ error: message }, { status });
  }
}
