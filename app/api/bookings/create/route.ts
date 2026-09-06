import { NextResponse } from "next/server";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { createPendingBooking } from "@/lib/bookingPayment";
import { createPendingBookingSchema } from "@/schemas/booking";
import { validatePackageSchedule } from "@/lib/packageSchedule";
import { toApiError } from "@/lib/apiErrors";

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
    const { bookingId, package_name, checkoutToken } = await createPendingBooking(db, parsed.data);

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      package_name,
      // Returned once, to this caller only: proves ownership when starting the payment.
      checkout_token: checkoutToken,
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
    // Was chosen by substring-matching the message; domain errors now carry their own status.
    const { message, status } = toApiError("bookings/create", err, "Could not create the booking. Please try again.");
    return NextResponse.json({ error: message }, { status });
  }
}
