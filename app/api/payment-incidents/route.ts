import { NextResponse } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";

/**
 * Payment incidents are written by the Ziina webhook whenever money arrived but the booking could
 * not be honoured — a full workshop, a deleted workshop, a taken slot, a mismatched amount. Each
 * one is a customer owed a refund or an explanation, so the studio has to be able to see them.
 *
 * Served through the Admin SDK rather than the client Firestore SDK so it needs no rules change.
 */

function isoOrNull(value: unknown): string | null {
  const timestamp = value as Timestamp | undefined;
  if (timestamp && typeof timestamp.toDate === "function") return timestamp.toDate().toISOString();
  return null;
}

export async function GET(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const snapshot = await getAdminFirestore().collection("payment_incidents").limit(500).get();

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type ?? "unknown",
          status: data.status ?? "open",
          refund_status: data.refund_status ?? null,
          source_collection: data.source_collection ?? null,
          source_id: data.source_id ?? null,
          workshop_id: data.workshop_id ?? null,
          customer_email: data.customer_email ?? null,
          customer_phone: data.customer_phone ?? null,
          expected_amount_minor: data.expected_amount_minor ?? null,
          expected_currency: data.expected_currency ?? null,
          paid_amount_minor: data.paid_amount_minor ?? null,
          paid_currency: data.paid_currency ?? null,
          validation_error: data.validation_error ?? null,
          payment_event: data.payment_event ?? null,
          provider_status: data.provider_status ?? null,
          resolution_note: data.resolution_note ?? null,
          created_at: isoOrNull(data.created_at),
          resolved_at: isoOrNull(data.resolved_at),
        };
      })
      // Newest first, and never ordered in the query: that would need a composite index, which
      // cannot be deployed with the current service-account permissions.
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

    return NextResponse.json({ items });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      return NextResponse.json({ error: "Payment incidents are unavailable." }, { status: 503 });
    }
    console.error("[payment-incidents/get]", err);
    return NextResponse.json({ error: "Failed to load payment incidents." }, { status: 500 });
  }
}
