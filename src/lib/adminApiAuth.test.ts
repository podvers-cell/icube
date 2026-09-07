import { afterEach, describe, expect, it, vi } from "vitest";

const adminMocks = vi.hoisted(() => ({
  getAdminAuth: vi.fn(),
  getAdminFirestore: vi.fn(),
}));

vi.mock("@/firebase-admin", () => adminMocks);

import { verifyAdminApiRequest } from "./adminApiAuth";

/**
 * The distinction these pin down: a bad token and a failed admins lookup used to share one catch
 * and both answered 401 "Invalid or expired authentication". With Firestore returning 429, a valid
 * session was told to sign in again — advice that could not help and that hid the real cause.
 */

function request(authorization?: string): Request {
  return new Request("https://example.com/api/thing", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

function mockAuth(behaviour: { uid: string } | Error) {
  adminMocks.getAdminAuth.mockReturnValue({
    verifyIdToken: vi.fn(behaviour instanceof Error
      ? () => Promise.reject(behaviour)
      : () => Promise.resolve({ uid: behaviour.uid })),
  });
}

function mockAdminsDoc(behaviour: { exists: boolean } | Error) {
  adminMocks.getAdminFirestore.mockReturnValue({
    collection: () => ({
      doc: () => ({
        get: behaviour instanceof Error
          ? () => Promise.reject(behaviour)
          : () => Promise.resolve({ exists: behaviour.exists }),
      }),
    }),
  });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("verifyAdminApiRequest", () => {
  it("rejects a missing Authorization header with 401", async () => {
    const result = await verifyAdminApiRequest(request());
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects an invalid token with 401 and invites a fresh one", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockAuth(new Error("Firebase ID token has expired"));

    const result = await verifyAdminApiRequest(request("Bearer bad-token"));

    expect(result).toMatchObject({ ok: false, status: 401, retryWithFreshToken: true });
    if (!result.ok) expect(result.error).toMatch(/sign in again/i);
  });

  it("answers 403 when the token is valid but the account is not an admin", async () => {
    mockAuth({ uid: "user-1" });
    mockAdminsDoc({ exists: false });

    const result = await verifyAdminApiRequest(request("Bearer good-token"));

    expect(result).toMatchObject({ ok: false, status: 403 });
    // A new token cannot grant admin, so the client must not retry this.
    if (!result.ok) expect(result.retryWithFreshToken).toBeFalsy();
  });

  // The reported bug: this used to answer 401 and blame the operator's session.
  it("answers 503 when the admins lookup itself fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockAuth({ uid: "user-1" });
    mockAdminsDoc(Object.assign(new Error("Quota exceeded."), { code: 8 }));

    const result = await verifyAdminApiRequest(request("Bearer good-token"));

    expect(result).toMatchObject({ ok: false, status: 503, retryWithFreshToken: false });
    if (!result.ok) {
      expect(result.error).toMatch(/could not verify your access/i);
      expect(result.error).not.toMatch(/expired|sign in/i);
      // The provider's own wording must not reach the caller.
      expect(result.error).not.toMatch(/quota/i);
    }
  });

  it("succeeds and returns the uid for a real admin", async () => {
    mockAuth({ uid: "admin-42" });
    mockAdminsDoc({ exists: true });

    await expect(verifyAdminApiRequest(request("Bearer good-token"))).resolves.toEqual({
      ok: true,
      uid: "admin-42",
    });
  });

  it("accepts the scheme case-insensitively but still requires a value", async () => {
    mockAuth({ uid: "admin-42" });
    mockAdminsDoc({ exists: true });
    await expect(verifyAdminApiRequest(request("bearer good-token"))).resolves.toMatchObject({ ok: true });

    expect(await verifyAdminApiRequest(request("Bearer "))).toMatchObject({ ok: false, status: 401 });
    expect(await verifyAdminApiRequest(request("Basic abc"))).toMatchObject({ ok: false, status: 401 });
  });
});
