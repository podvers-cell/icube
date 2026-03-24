import { NextResponse } from "next/server";

type CreateIntentBody = {
  bookingType?: "package" | "studio";
  amountAed?: number;
  name?: string;
  date?: string;
  slot?: string;
  durationHours?: number;
  customerEmail?: string;
};

function getBaseUrl(request: Request): string {
  const envUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
  const origin = new URL(request.url).origin;
  return origin.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const token = process.env.ZIINA_API_KEY?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "ZIINA_API_KEY is missing on server." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreateIntentBody;
    const amountAed = Number(body.amountAed ?? 0);
    if (!Number.isFinite(amountAed) || amountAed <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const bookingType = body.bookingType === "studio" ? "studio" : "package";
    const amount = Math.round(amountAed * 100); // Ziina expects minor units (fils)
    const baseUrl = getBaseUrl(request);
    const successUrl = `${baseUrl}/payment-gateway/success?type=${encodeURIComponent(bookingType)}&name=${encodeURIComponent(
      body.name || "ICUBE booking"
    )}&amount=${encodeURIComponent(String(amountAed))}`;
    const cancelUrl =
      bookingType === "studio"
        ? `${baseUrl}/studio/booking/checkout`
        : `${baseUrl}/packages/checkout`;
    const detailBits = [body.date, body.slot, body.durationHours ? `${body.durationHours}h` : ""].filter(Boolean);
    const message = `${body.name || "ICUBE Booking"}${detailBits.length ? ` · ${detailBits.join(" · ")}` : ""}`;

    const ziinaRes = await fetch("https://api-v2.ziina.com/api/payment_intent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency_code: "AED",
        message,
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(body.customerEmail ? { email: body.customerEmail } : {}),
        test: process.env.ZIINA_TEST_MODE !== "false",
      }),
    });

    const ziinaBody = (await ziinaRes.json().catch(() => ({}))) as {
      redirect_url?: string;
      message?: string;
      error?: { message?: string };
    };

    if (!ziinaRes.ok || !ziinaBody.redirect_url) {
      const providerError =
        ziinaBody?.error?.message || ziinaBody?.message || "Ziina request failed.";
      return NextResponse.json({ error: providerError }, { status: 502 });
    }

    return NextResponse.json({ redirect_url: ziinaBody.redirect_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
