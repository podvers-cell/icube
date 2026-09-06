import { NextResponse, type NextRequest } from "next/server";

type LimitRule = { key: string; max: number; methods?: string[] };
type LimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const WINDOW_SECONDS = WINDOW_MS / 1000;
const MAX_STORE_SIZE = 10_000;

/**
 * Per-instance fallback counters.
 *
 * On serverless every instance keeps its own copy, so the real ceiling is max x instance count and
 * it resets on every cold start. Configure a shared store (below) to make the limit mean what it
 * says; this Map is what remains when none is configured, or when the shared store is unreachable.
 */
const store = new Map<string, LimitEntry>();

/**
 * Shared counters via the Upstash REST API, which also backs Vercel KV. REST rather than a client
 * library because this runs on the edge runtime, where only fetch is available.
 */
function sharedStoreConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function checkLimitShared(
  config: { url: string; token: string },
  key: string,
  max: number
): Promise<{ limited: boolean; retryAfter: number } | null> {
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      // INCR then set the window only on the first hit, so the window does not slide forward
      // with every request inside it.
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, WINDOW_SECONDS, "NX"],
      ]),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(results?.[0]?.result);
    if (!Number.isFinite(count)) return null;

    return { limited: count > max, retryAfter: WINDOW_SECONDS };
  } catch {
    // Unreachable or slow: fall back to the local counter rather than failing the request.
    return null;
  }
}

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

export async function proxy(request: NextRequest) {
  const rule = RULES[request.nextUrl.pathname];
  if (!rule) return NextResponse.next();

  const methods = rule.methods ?? ["POST"];
  if (!methods.includes(request.method)) return NextResponse.next();

  const counterKey = `ratelimit:${rule.key}:${clientIp(request)}`;
  const config = sharedStoreConfig();

  const result =
    (config ? await checkLimitShared(config, counterKey, rule.max) : null) ??
    checkLimit(counterKey, rule.max);

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
