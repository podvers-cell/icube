import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/firebase-admin";
import { getOccupiedSlotsForDate } from "@/lib/bookingSlots";
import { toApiError } from "@/lib/apiErrors";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingDate = url.searchParams.get("date")?.trim();
    const studioId = url.searchParams.get("studio_id")?.trim() || undefined;

    if (!bookingDate) {
      return NextResponse.json({ error: "Missing date parameter." }, { status: 400 });
    }

    const db = getAdminFirestore();
    const slots = await getOccupiedSlotsForDate(db, bookingDate, studioId);

    return NextResponse.json({ slots });
  } catch (err) {
    const { message, status } = toApiError("bookings/booked-slots", err, "Failed to load booked slots.");
    return NextResponse.json({ error: message }, { status });
  }
}
