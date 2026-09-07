import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { resolveCanonicalWorkshopPricing } from "@/lib/bookingPricing";
import { createCheckoutToken } from "@/lib/checkoutToken";
import { toApiError } from "@/lib/apiErrors";

const workshopEnrollmentSchema = z.object({
  workshop_id: z.string().trim().min(1).max(100),
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(1).max(30),
});

function parseGroupSizeMax(raw: unknown): number | null {
  const label = typeof raw === "string" ? raw : "";
  const values = label.match(/\d+/g)?.map(Number).filter((value) => Number.isFinite(value) && value > 0) ?? [];
  return values.length ? Math.max(...values) : null;
}

export async function POST(request: Request) {
  try {
    const parsed = workshopEnrollmentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid workshop enrollment." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const pricing = await resolveCanonicalWorkshopPricing(db, parsed.data.workshop_id);
    const workshopRef = db.collection("workshops").doc(parsed.data.workshop_id);
    const workshopSnap = await workshopRef.get();
    if (!workshopSnap.exists) {
      return NextResponse.json({ error: "Workshop is unavailable." }, { status: 404 });
    }

    const workshop = workshopSnap.data() as {
      group_size_max?: number;
      group_size_label?: string;
      paid_enrollments_count?: number;
      sold_out?: boolean;
      sold_out_override?: boolean;
    };
    const soldOut = Boolean(workshop.sold_out_override ?? workshop.sold_out);
    const max = Number(workshop.group_size_max ?? 0) || parseGroupSizeMax(workshop.group_size_label) || 0;
    const paid = Number(workshop.paid_enrollments_count ?? 0) || 0;
    if (soldOut || (Number.isFinite(max) && max > 0 && paid >= max)) {
      return NextResponse.json({ error: "This workshop is sold out." }, { status: 409 });
    }

    const { token: checkoutToken, hash: checkoutTokenHash } = createCheckoutToken();
    const ref = await db.collection("workshop_enrollments").add({
      workshop_id: parsed.data.workshop_id,
      workshop_title: pricing.workshop_title,
      workshop_date: pricing.workshop_date ?? null,
      full_name: parsed.data.full_name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      amount_aed: pricing.amount_aed,
      expected_payment_amount_minor: pricing.expected_payment_amount_minor,
      expected_payment_currency: pricing.expected_payment_currency,
      payment_provider: "ziina",
      payment_status: "pending",
      status: "awaiting_payment",
      checkout_token_hash: checkoutTokenHash,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, enrollment_id: ref.id, checkout_token: checkoutToken });
  } catch (error) {
    if (isFirebaseAdminConfigError(error)) {
      console.error("[workshops/enroll]", error.message);
      return NextResponse.json(
        { error: "Workshop checkout is unavailable: server Firebase Admin credentials are not configured." },
        { status: 503 }
      );
    }
    const { message, status } = toApiError(
      "workshops/enroll",
      error,
      "Could not start the enrolment. Please try again."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
