import { NextResponse } from "next/server";

/** Health check for orchestration (e.g. Kubernetes, Cloud Run). Returns 200 when the app is up. */
export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
