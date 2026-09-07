import { getAdminAuth, getAdminFirestore } from "@/firebase-admin";

/**
 * Two very different failures used to share one catch block, and both answered 401 "Invalid or
 * expired authentication": a genuinely bad token, and a failed read of the admins collection.
 *
 * That second case is infrastructure, not credentials. When Firestore was returning 429 Quota
 * exceeded, an operator with a perfectly valid session was told to sign in again — advice that
 * could not possibly help, and which hid the real cause.
 *
 * They are now separate: 401 means the token, and only the token. 503 means the check itself could
 * not run, so the client knows a fresh token will not fix it.
 */

export type AdminApiAuthResult =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403 | 503; error: string; retryWithFreshToken?: boolean };

export async function verifyAdminApiRequest(request: Request): Promise<AdminApiAuthResult> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    return { ok: false, status: 401, error: "Authentication required", retryWithFreshToken: false };
  }

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(match[1])).uid;
  } catch (err) {
    // Only reachable for a token problem: malformed, expired, wrong project, revoked.
    console.warn("[auth] Rejected an ID token:", err instanceof Error ? err.message : err);
    return {
      ok: false,
      status: 401,
      error: "Your session has expired. Please sign in again.",
      retryWithFreshToken: true,
    };
  }

  try {
    const admin = await getAdminFirestore().collection("admins").doc(uid).get();
    if (!admin.exists) {
      return { ok: false, status: 403, error: "Admin access required" };
    }
    return { ok: true, uid };
  } catch (err) {
    // Quota, network, credentials — the caller is authenticated, we simply could not check.
    console.error("[auth] Could not read the admins record:", err);
    return {
      ok: false,
      status: 503,
      error: "Could not verify your access right now. Please try again in a moment.",
      retryWithFreshToken: false,
    };
  }
}
