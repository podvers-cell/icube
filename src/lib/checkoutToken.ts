import { createHash, randomUUID, timingSafeEqual } from "crypto";

/**
 * A capability token proving the caller is the party that created a booking.
 *
 * Checkout is deliberately open to guests, so ownership cannot be tied to a signed-in user.
 * Instead, creating a booking mints a token that is returned once to that client; only the
 * holder can start a payment for it. Only the hash is stored, so a leaked database read does
 * not yield usable tokens.
 */
export function createCheckoutToken(): { token: string; hash: string } {
  const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
  return { token, hash: hashCheckoutToken(token) };
}

export function hashCheckoutToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison, so a token cannot be recovered by timing repeated attempts. */
export function checkoutTokenMatches(token: unknown, storedHash: unknown): boolean {
  if (typeof token !== "string" || typeof storedHash !== "string") return false;
  if (!token || !storedHash) return false;

  const provided = Buffer.from(hashCheckoutToken(token), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
