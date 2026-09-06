import { NextResponse, type NextRequest } from "next/server";

type LimitRule = { key: string; max: number; methods?: string[] };
type LimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_STORE_SIZE = 10_000;
const store = new Map<string, LimitEntry>();

const RULES: Record<string, LimitRule> = {
  "/api/upload": { key: "upload", max: 10 },
  "/api/send-contact-email": { key: "contact", max: 5 },
  "/api/contact": { key: "contact", max: 5 },
  "/api/send-booking-confirmation": { key: "booking-email", max: 5 },
  "/api/send-booking-confirmed": { key: "booking-email", max: 5 },
  "/api/bookings/create": { key: "booking-create", max: 10 },
  "/api/bookings/inquiry": { key: "booking-inquiry", max: 5 },
  "/api/payments/ziina/create-intent": { key: "payment-intent", max: 10 },
  "/api/workshops/enroll": { key: "workshop-enroll", max: 10 },
  // Unauthenticated and reads up to 500 Firestore documents per call, so it is limited on GET
  // as well. Generous, because the public catalogue legitimately polls it.
  "/api/rental-equipment": { key: "rental-equipment-read", max: 60, methods: ["GET", "POST"] },
};

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function pruneExpired(now: number) {
  if (store.size < MAX_STORE_SIZE) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function checkLimit(key: string, max: number): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  pruneExpired(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }

  entry.count += 1;
  return {
    limited: entry.count > max,
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function proxy(request: NextRequest) {
  const rule = RULES[request.nextUrl.pathname];
  if (!rule) return NextResponse.next();

  const methods = rule.methods ?? ["POST"];
  if (!methods.includes(request.method)) return NextResponse.next();

  const result = checkLimit(`${rule.key}:${clientIp(request)}`, rule.max);
  if (!result.limited) return NextResponse.next();

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    }
  );
}

export const config = {
  matcher: [
    "/api/upload",
    "/api/send-contact-email",
    "/api/contact",
    "/api/send-booking-confirmation",
    "/api/send-booking-confirmed",
    "/api/bookings/create",
    "/api/bookings/inquiry",
    "/api/payments/ziina/create-intent",
    "/api/workshops/enroll",
    "/api/rental-equipment",
  ],
};
