import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
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
    const snaps = await getDocs(query(collection(db, "bookings"), where("ziina_intent_id", "==", intentId)));
    if (snaps.empty) {
      return NextResponse.json({ ok: true, ignored: true, reason: "No booking for intent", intentId, event: eventName });
    }

    const paymentStatus = normalizePaymentStatus(providerStatus);
    for (const booking of snaps.docs) {
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

    return NextResponse.json({ ok: true, event: eventName, intentId, updatedBookings: snaps.size });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

