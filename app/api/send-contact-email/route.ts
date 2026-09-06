import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has moved to /api/contact." },
    { status: 410 }
  );
}
