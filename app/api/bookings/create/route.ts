import { NextResponse } from "next/server";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { createPendingBooking } from "@/lib/bookingPayment";
import { createPendingBookingSchema } from "@/schemas/booking";
import { validatePackageSchedule } from "@/lib/packageSchedule";

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

    const { schedule_preference: schedulePreference, booking_date: bookingDate, time_slot: timeSlot } = parsed.data;
    const scheduleError = validatePackageSchedule({ schedulePreference, bookingDate, timeSlot });
    if (scheduleError) {
      return NextResponse.json({ error: scheduleError }, { status: 400 });
    }

    const db = getAdminFirestore();
    const { bookingId, package_name } = await createPendingBooking(db, parsed.data);

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      package_name,
    });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      console.error("[bookings/create]", err.message);
      return NextResponse.json(
        {
          error: "Booking checkout is unavailable: server Firebase Admin credentials are not configured.",
          code: "FIREBASE_ADMIN_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create booking";
    const status = message.includes("blocked") || message.includes("time slot") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
