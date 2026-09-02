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

    for (const booking of [...pendingSnaps.docs, ...bookingSnaps.docs]) {
      if (paymentStatus === "paid") {
        const outcome = await finalizePaidBooking(booking.id, meta);
        if (outcome.slotConflict) {
          slotConflicts += 1;
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

    for (const enr of enrollmentSnaps.docs) {
      const enrRef = enr.ref;
      await enrRef.update({
        payment_status: paymentStatus === "paid" ? "paid" : paymentStatus === "failed" ? "failed" : "pending",
        payment_provider: "ziina",
        payment_event: eventName,
        payment_intent_status: providerStatus || null,
        payment_amount_minor: payload.data?.amount ?? null,
        payment_currency: payload.data?.currency_code ?? null,
        payment_last_message: payload.data?.message ?? null,
        paid_at: providerStatus === "completed" ? FieldValue.serverTimestamp() : null,
        updated_at: FieldValue.serverTimestamp(),
      });

      if (providerStatus === "completed") {
        try {
          await db.runTransaction(async (tx) => {
            const freshEnr = await tx.get(enrRef);
            if (!freshEnr.exists) return;
            const data = freshEnr.data() as { workshop_id?: string; counted_at?: unknown };
            if (data.counted_at) return;

            const workshopId = String(data.workshop_id ?? "");
            if (!workshopId) return;

            const workshopRef = db.collection("workshops").doc(workshopId);
            const wsSnap = await tx.get(workshopRef);
            if (!wsSnap.exists) {
              tx.update(enrRef, { counted_at: FieldValue.serverTimestamp() });
              return;
            }

            const ws = wsSnap.data() as {
              paid_enrollments_count?: number;
              group_size_max?: number;
              group_size_label?: string;
            };
            const max = Number(ws.group_size_max ?? 0) || parseGroupSizeMax(ws.group_size_label) || 0;
            const current = Number(ws.paid_enrollments_count ?? 0) || 0;

            tx.update(workshopRef, {
              paid_enrollments_count: FieldValue.increment(1),
              sold_out: Number.isFinite(max) && max > 0 ? current + 1 >= max : false,
              updated_at: FieldValue.serverTimestamp(),
            });
            tx.update(enrRef, { counted_at: FieldValue.serverTimestamp() });
          });
        } catch {
          // best-effort; payment status already stored
        }
      }
    }

    return NextResponse.json({
      ok: true,
      event: eventName,
      intentId,
      updatedBookings: bookingSnaps.size + pendingSnaps.size,
      finalizedBookings,
      slotConflicts,
      failedBookings,
      updatedEnrollments: enrollmentSnaps.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
