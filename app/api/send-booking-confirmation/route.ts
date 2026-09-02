import { NextResponse } from "next/server";

/** Pre-payment booking confirmation emails are disabled — confirmation is sent only after successful payment. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Pre-payment booking confirmation is disabled. Customers receive confirmation email only after successful payment.",
    },
    { status: 403 }
  );
}
