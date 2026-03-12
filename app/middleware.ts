import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** In-memory rate limit store: IP -> { count, resetAt }. Resets after windowMs. */
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_UPLOAD = 20; // uploads per minute per IP
const MAX_REQUESTS_CONTACT = 5;  // contact submissions per minute per IP
const MAX_REQUESTS_BOOKING_EMAIL = 10; // booking email API per minute per IP

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > max) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  if (method !== "POST") return NextResponse.next();

  if (path === "/api/upload") {
    const ip = getClientIp(request);
    if (isRateLimited(`upload:${ip}`, MAX_REQUESTS_UPLOAD)) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }
  }

  if (path === "/api/send-contact-email") {
    const ip = getClientIp(request);
    if (isRateLimited(`contact:${ip}`, MAX_REQUESTS_CONTACT)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  if (path === "/api/send-booking-confirmation" || path === "/api/send-booking-confirmed") {
    const ip = getClientIp(request);
    if (isRateLimited(`booking-email:${ip}`, MAX_REQUESTS_BOOKING_EMAIL)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/upload", "/api/send-contact-email", "/api/send-booking-confirmation", "/api/send-booking-confirmed"],
};
