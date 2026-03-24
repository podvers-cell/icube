import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("🔥 ZIINA WEBHOOK HIT");

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const event = payload?.event;
    const data = payload?.data;

    console.log("📩 Event:", event);
    console.log("💳 Payment ID:", data?.id);
    console.log("📊 Status:", data?.status);

    // أهم شرط
    if (event === "payment_intent.status.updated") {
      const paymentId = data?.id;
      const status = data?.status;

      // هنا تربط مع Firebase
      if (status === "completed") {
        console.log("✅ PAYMENT SUCCESS");

        // مثال:
        // await updateOrder(paymentId, { status: "paid" });
      }

      if (status === "failed") {
        console.log("❌ PAYMENT FAILED");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}