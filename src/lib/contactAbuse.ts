import { createHash } from "crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

/**
 * Abuse controls for the public contact form.
 *
 * The form both writes to Firestore and sends mail through Resend on behalf of an unverified
 * address, so without these it is an open email relay: an attacker can have confirmations
 * delivered to a victim, on the studio's account and sending domain.
 */

const CONFIRMATION_COOLDOWN_MS = 60 * 60 * 1000;
const COOLDOWN_COLLECTION = "contact_confirmation_cooldowns";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { ok: true } | { ok: false; reason: string };

/** Configured only once Cloudflare Turnstile keys exist. Until then verification is skipped. */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

/**
 * Verify a Turnstile token.
 *
 * Returns ok when no secret is configured, so adding the key is what switches enforcement on and
 * the form keeps working until then. Deploy the key and the widget together.
 */
export async function verifyTurnstile(token: unknown, remoteIp?: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, reason: "Please complete the verification challenge." };
  }

  try {
    const body = new URLSearchParams({ secret, response: token.trim() });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json().catch(() => ({}))) as { success?: boolean };
    if (result.success === true) return { ok: true };
    return { ok: false, reason: "Verification failed. Please try again." };
  } catch (err) {
    // Fail closed: a verification outage must not reopen the relay.
    console.error("[contact] Turnstile verification error:", err);
    return { ok: false, reason: "Could not verify your request. Please try again shortly." };
  }
}

function emailKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * Claim the right to send one confirmation to this address, at most once an hour.
 *
 * The address is stored only as a hash — this ledger exists to rate-limit, not to accumulate a
 * second copy of everyone's email. The owner notification is deliberately not gated by this: the
 * studio should still see every genuine enquiry.
 */
export async function claimConfirmationEmail(db: Firestore, email: string): Promise<boolean> {
  const ref = db.collection(COOLDOWN_COLLECTION).doc(emailKey(email));

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        const lastSent = snap.data()?.last_sent_at as { toMillis?: () => number } | undefined;
        const millis = typeof lastSent?.toMillis === "function" ? lastSent.toMillis() : 0;
        if (Number.isFinite(millis) && Date.now() - millis < CONFIRMATION_COOLDOWN_MS) return false;
      }
      tx.set(ref, { last_sent_at: FieldValue.serverTimestamp() }, { merge: true });
      return true;
    });
  } catch (err) {
    // A ledger failure should not silently stop confirmations to genuine customers.
    console.error("[contact] Confirmation cooldown check failed:", err);
    return true;
  }
}
