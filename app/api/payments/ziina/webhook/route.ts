import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("🔥 ZIINA WEBHOOK HIT");

    const rawBody = await req.text();
    console.log("📦 RAW BODY:", rawBody);

    const payload = JSON.parse(rawBody);
    console.log("📩 PARSED:", payload);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}