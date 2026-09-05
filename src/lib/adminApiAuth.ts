import { getAdminAuth, getAdminFirestore } from "@/firebase-admin";

export type AdminApiAuthResult =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403; error: string };

export async function verifyAdminApiRequest(request: Request): Promise<AdminApiAuthResult> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    const admin = await getAdminFirestore().collection("admins").doc(decoded.uid).get();
    if (!admin.exists) {
      return { ok: false, status: 403, error: "Admin access required" };
    }
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired authentication" };
  }
}
