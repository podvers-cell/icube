import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where, increment } from "firebase/firestore";
import { requireFirestore } from "@/firebase";

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

function normalizePaymentStatus(status: string | undefined): string {
  switch (status) {
    case "completed":
      return "paid";
    case "failed":
      return "failed";
    case "canceled":
      return "cancelled";
    case "pending":
      return "pending";
    case "requires_user_action":
      return "requires_user_action";
    case "requires_payment_instrument":
      return "requires_payment_instrument";
    default:
      return status || "unknown";
  }
}

function parseGroupSizeMax(raw: unknown): number | null {
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim()) return null;
  const nums = s.match(/\d+/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (!nums.length) return null;
  return Math.max(...nums);
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

    const db = requireFirestore();
    const paymentStatus = normalizePaymentStatus(providerStatus);
    const [bookingSnaps, enrollmentSnaps] = await Promise.all([
      getDocs(query(collection(db, "bookings"), where("ziina_intent_id", "==", intentId))),
      getDocs(query(collection(db, "workshop_enrollments"), where("ziina_intent_id", "==", intentId))),
    ]);

    if (bookingSnaps.empty && enrollmentSnaps.empty) {
      return NextResponse.json({ ok: true, ignored: true, reason: "No record for intent", intentId, event: eventName });
    }

    for (const booking of bookingSnaps.docs) {
      await updateDoc(doc(db, "bookings", booking.id), {
        payment_status: paymentStatus,
        payment_provider: "ziina",
        payment_event: eventName,
        payment_intent_status: providerStatus || null,
        payment_amount_minor: payload.data?.amount ?? null,
        payment_currency: payload.data?.currency_code ?? null,
        payment_last_message: payload.data?.message ?? null,
        paid_at: providerStatus === "completed" ? serverTimestamp() : null,
        updated_at: serverTimestamp(),
      });
    }

    for (const enr of enrollmentSnaps.docs) {
      const enrRef = doc(db, "workshop_enrollments", enr.id);
      await updateDoc(enrRef, {
        payment_status: paymentStatus,
        payment_provider: "ziina",
        payment_event: eventName,
        payment_intent_status: providerStatus || null,
        payment_amount_minor: payload.data?.amount ?? null,
        payment_currency: payload.data?.currency_code ?? null,
        payment_last_message: payload.data?.message ?? null,
        paid_at: providerStatus === "completed" ? serverTimestamp() : null,
        updated_at: serverTimestamp(),
      });

      // When payment completes, increment workshop paid seats once (idempotent).
      if (providerStatus === "completed") {
        try {
          await runTransaction(db, async (tx) => {
            const freshEnr = await tx.get(enrRef);
            if (!freshEnr.exists()) return;
            const data = freshEnr.data() as {
              workshop_id?: string;
              counted_at?: unknown;
            };
            if (data.counted_at) return; // already counted
            const workshopId = String(data.workshop_id ?? "");
            if (!workshopId) return;
            const workshopRef = doc(db, "workshops", workshopId);
            const wsSnap = await tx.get(workshopRef);
            if (!wsSnap.exists()) {
              tx.update(enrRef, { counted_at: serverTimestamp() });
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
              paid_enrollments_count: increment(1),
              sold_out: Number.isFinite(max) && max > 0 ? current + 1 >= max : false,
              updated_at: serverTimestamp(),
            });
            tx.update(enrRef, { counted_at: serverTimestamp() });
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
      updatedBookings: bookingSnaps.size,
      updatedEnrollments: enrollmentSnaps.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
