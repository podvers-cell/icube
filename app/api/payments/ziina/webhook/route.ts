import { createHmac, timingSafeEqual } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/firebase-admin";
import {
  finalizePaidBooking,
  markBookingPaymentFailed,
  normalizeStoredPaymentStatus,
  type PaymentMeta,
} from "@/lib/bookingPayment";
import { checkExpectedPayment } from "@/lib/bookingPricing";

type ZiinaWebhookPayload = {
  event?: string;
  data?: {
    id?: string;
    status?: string;
    amount?: number;
    currency_code?: string;
    message?: string;
    [key: string]: unknown;
  };
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parseGroupSizeMax(raw: unknown): number | null {
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim()) return null;
  const nums = s.match(/\d+/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (!nums.length) return null;
  return Math.max(...nums);
}

function buildPaymentMeta(payload: ZiinaWebhookPayload, eventName: string): PaymentMeta {
  return {
    eventName,
    providerStatus: payload.data?.status,
    amountMinor: payload.data?.amount ?? null,
    currency: payload.data?.currency_code ?? null,
    message: payload.data?.message ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hmac-signature") || "";
    const secret = process.env.ZIINA_WEBHOOK_SECRET?.trim();

    if (!secret) {
      return NextResponse.json({ error: "ZIINA_WEBHOOK_SECRET is missing." }, { status: 500 });
    }
    if (!signature || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as ZiinaWebhookPayload;
    const eventName = payload.event || "";
    const intentId = payload.data?.id;
    const providerStatus = payload.data?.status;
    if (!intentId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "Missing intent id" });
    }

    const db = getAdminFirestore();
    const paymentStatus = normalizeStoredPaymentStatus(providerStatus);
    const meta = buildPaymentMeta(payload, eventName);

    const [bookingSnaps, pendingSnaps, enrollmentSnaps] = await Promise.all([
      db.collection("bookings").where("ziina_intent_id", "==", intentId).get(),
      db.collection("pending_bookings").where("ziina_intent_id", "==", intentId).get(),
      db.collection("workshop_enrollments").where("ziina_intent_id", "==", intentId).get(),
    ]);

    if (bookingSnaps.empty && pendingSnaps.empty && enrollmentSnaps.empty) {
      return NextResponse.json({ ok: true, ignored: true, reason: "No record for intent", intentId, event: eventName });
    }

    let finalizedBookings = 0;
    let failedBookings = 0;
    let slotConflicts = 0;
    let paymentMismatches = 0;
    let workshopCapacityConflicts = 0;

    for (const booking of [...pendingSnaps.docs, ...bookingSnaps.docs]) {
      if (paymentStatus === "paid") {
        const outcome = await finalizePaidBooking(booking.id, meta);
        if (outcome.slotConflict) {
          slotConflicts += 1;
        } else if (outcome.paymentMismatch) {
          paymentMismatches += 1;
        } else {
          finalizedBookings += 1;
        }
      } else if (paymentStatus === "failed") {
        await markBookingPaymentFailed(booking.id, meta);
        failedBookings += 1;
      } else {
        await booking.ref.update({
          payment_status: "pending",
          payment_provider: "ziina",
          payment_event: eventName,
          payment_intent_status: providerStatus || null,
          payment_amount_minor: payload.data?.amount ?? null,
          payment_currency: payload.data?.currency_code ?? null,
          payment_last_message: payload.data?.message ?? null,
          updated_at: FieldValue.serverTimestamp(),
        });
      }
    }

    for (const enrollment of enrollmentSnaps.docs) {
      const enrollmentRef = enrollment.ref;
      if (paymentStatus !== "paid") {
        await enrollmentRef.update({
          payment_status: paymentStatus === "failed" ? "failed" : "pending",
          status: paymentStatus === "failed" ? "cancelled" : "awaiting_payment",
          payment_provider: "ziina",
          payment_event: eventName,
          payment_intent_status: providerStatus || null,
          payment_amount_minor: payload.data?.amount ?? null,
          payment_currency: payload.data?.currency_code ?? null,
          payment_last_message: payload.data?.message ?? null,
          updated_at: FieldValue.serverTimestamp(),
        });
        continue;
      }

      const outcome = await db.runTransaction(async (tx) => {
        const freshEnrollment = await tx.get(enrollmentRef);
        if (!freshEnrollment.exists) return "missing" as const;
        const data = freshEnrollment.data() as {
          workshop_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          counted_at?: unknown;
          expected_payment_amount_minor?: number;
          expected_payment_currency?: string;
        };
        const paymentCheck = checkExpectedPayment(data, meta.amountMinor, meta.currency);
        if (!paymentCheck.ok) {
          tx.update(enrollmentRef, {
            payment_status: "review_required",
            status: "payment_review_required",
            payment_provider: "ziina",
            payment_event: eventName,
            payment_intent_status: providerStatus || null,
            payment_amount_minor: payload.data?.amount ?? null,
            payment_currency: payload.data?.currency_code ?? null,
            payment_validation_error: paymentCheck.reason,
            payment_last_message: payload.data?.message ?? null,
            updated_at: FieldValue.serverTimestamp(),
          });
          tx.set(
            db.collection("payment_incidents").doc(`workshop_${enrollmentRef.id}_amount_mismatch`),
            {
              type: "amount_mismatch",
              status: "open",
              source_collection: "workshop_enrollments",
              source_id: enrollmentRef.id,
              customer_email: data.email ?? null,
              customer_phone: data.phone ?? null,
              expected_amount_minor: data.expected_payment_amount_minor ?? null,
              expected_currency: data.expected_payment_currency ?? null,
              paid_amount_minor: meta.amountMinor ?? null,
              paid_currency: meta.currency ?? null,
              validation_error: paymentCheck.reason,
              created_at: FieldValue.serverTimestamp(),
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return "payment_mismatch" as const;
        }

        if (data.counted_at) return "already_counted" as const;
        const workshopId = String(data.workshop_id ?? "");
        if (!workshopId) return "missing_workshop" as const;

        const workshopRef = db.collection("workshops").doc(workshopId);
        const workshopSnap = await tx.get(workshopRef);
        if (!workshopSnap.exists) {
          tx.update(enrollmentRef, {
            payment_status: "paid",
            status: "refund_required",
            refund_status: "required",
            payment_incident_type: "workshop_unavailable",
            paid_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });
          tx.set(
            db.collection("payment_incidents").doc(`workshop_${enrollmentRef.id}_unavailable`),
            {
              type: "workshop_unavailable",
              status: "open",
              refund_status: "required",
              source_collection: "workshop_enrollments",
              source_id: enrollmentRef.id,
              workshop_id: workshopId,
              customer_email: data.email ?? null,
              customer_phone: data.phone ?? null,
              paid_amount_minor: meta.amountMinor ?? null,
              paid_currency: meta.currency ?? null,
              created_at: FieldValue.serverTimestamp(),
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return "capacity_conflict" as const;
        }

        const workshop = workshopSnap.data() as {
          paid_enrollments_count?: number;
          group_size_max?: number;
          group_size_label?: string;
          sold_out?: boolean;
          sold_out_override?: boolean;
        };
        const max = Number(workshop.group_size_max ?? 0) || parseGroupSizeMax(workshop.group_size_label) || 0;
        const current = Number(workshop.paid_enrollments_count ?? 0) || 0;
        const capacityReached = Boolean(workshop.sold_out_override) || (Number.isFinite(max) && max > 0 && current >= max);
        if (capacityReached) {
          tx.update(enrollmentRef, {
            payment_status: "paid",
            status: "refund_required",
            refund_status: "required",
            payment_incident_type: "workshop_capacity_conflict",
            payment_provider: "ziina",
            payment_event: eventName,
            payment_intent_status: providerStatus || null,
            payment_amount_minor: payload.data?.amount ?? null,
            payment_currency: payload.data?.currency_code ?? null,
            paid_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });
          tx.set(
            db.collection("payment_incidents").doc(`workshop_${enrollmentRef.id}_capacity_conflict`),
            {
              type: "workshop_capacity_conflict",
              status: "open",
              refund_status: "required",
              source_collection: "workshop_enrollments",
              source_id: enrollmentRef.id,
              workshop_id: workshopId,
              customer_email: data.email ?? null,
              customer_phone: data.phone ?? null,
              paid_amount_minor: meta.amountMinor ?? null,
              paid_currency: meta.currency ?? null,
              created_at: FieldValue.serverTimestamp(),
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return "capacity_conflict" as const;
        }

        tx.update(workshopRef, {
          paid_enrollments_count: FieldValue.increment(1),
          sold_out: Number.isFinite(max) && max > 0 ? current + 1 >= max : false,
          updated_at: FieldValue.serverTimestamp(),
        });
        tx.update(enrollmentRef, {
          payment_status: "paid",
          status: "confirmed",
          payment_provider: "ziina",
          payment_event: eventName,
          payment_intent_status: providerStatus || null,
          payment_amount_minor: payload.data?.amount ?? null,
          payment_currency: payload.data?.currency_code ?? null,
          payment_last_message: payload.data?.message ?? null,
          paid_at: FieldValue.serverTimestamp(),
          counted_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });
        return "confirmed" as const;
      });

      if (outcome === "payment_mismatch") paymentMismatches += 1;
      if (outcome === "capacity_conflict") workshopCapacityConflicts += 1;
    }

    return NextResponse.json({
      ok: true,
      event: eventName,
      intentId,
      updatedBookings: bookingSnaps.size + pendingSnaps.size,
      finalizedBookings,
      slotConflicts,
      paymentMismatches,
      workshopCapacityConflicts,
      failedBookings,
      updatedEnrollments: enrollmentSnaps.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
