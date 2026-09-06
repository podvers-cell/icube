import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/firebase-admin";
import { bookingInquirySchema } from "@/schemas/booking";
import { toApiError } from "@/lib/apiErrors";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bookingInquirySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid inquiry data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const data = parsed.data;
    const db = getAdminFirestore();
    const ref = await db.collection("booking_inquiries").add({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone ?? null,
      project_details: data.project_details ?? null,
      source: data.source ?? "custom_package_form",
      read_at: null,
      created_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, inquiry_id: ref.id });
  } catch (err) {
    const { message, status } = toApiError("bookings/inquiry", err, "Failed to submit inquiry.");
    return NextResponse.json({ error: message }, { status });
  }
}
