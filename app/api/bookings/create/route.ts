import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/firebase-admin";
import { createPendingBooking } from "@/lib/bookingPayment";
import { createPendingBookingSchema } from "@/schemas/booking";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createPendingBookingSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid booking data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const db = getAdminFirestore();
    const { bookingId, package_name } = await createPendingBooking(db, parsed.data);

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      package_name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    const status = message.includes("blocked") || message.includes("time slot") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
