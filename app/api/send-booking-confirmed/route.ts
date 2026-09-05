import { NextResponse } from "next/server";

/**
 * Confirmation emails are issued only by the verified payment webhook.
 * Keeping this retired route explicit prevents older clients from falling
 * through to an email-sending implementation.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Booking confirmation emails are sent only after verified payment." },
    { status: 410 }
  );
}
