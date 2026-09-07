import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
vi.mock("@/firebase", () => authMocks);

import { uploadToCloudinaryWithProgress } from "./uploadCloudinary";

/**
 * The signature request retries once with a forced token refresh, and only for 401.
 *
 * The bug behind this: a failed read of the admins collection answered 401 "Invalid or expired
 * authentication", so an operator with a valid session was told to sign in again. The server now
 * answers 503 for that, and the client must not treat it as a token problem — retrying it would
 * spend a refresh for nothing and could loop.
 */

function mockUser(tokens: string[] = ["fresh", "refreshed"]) {
  const getIdToken = vi.fn();
  tokens.forEach((t) => getIdToken.mockResolvedValueOnce(t));
  getIdToken.mockResolvedValue(tokens[tokens.length - 1]);
  authMocks.requireAuth.mockReturnValue({ currentUser: { getIdToken } });
  return getIdToken;
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("upload signature retry", () => {
  it("retries once with a forced refresh when the token is rejected", async () => {
    const getIdToken = mockUser();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: "Your session has expired." }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          cloudName: "c",
          apiKey: "k",
          resourceType: "image",
          folder: "icube",
          timestamp: 1,
          signature: "sig",
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    // The direct upload itself is out of scope here; fail it so the promise settles.
    vi.stubGlobal("XMLHttpRequest", class {
      upload = { addEventListener: () => {} };
      addEventListener(type: string, cb: () => void) {
        if (type === "error") setTimeout(cb, 0);
      }
      open() {}
      send() {}
    });

    await expect(uploadToCloudinaryWithProgress(file)).rejects.toThrow(/network error/i);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
  });

  it("does not retry a 503, and surfaces the server's wording", async () => {
    const getIdToken = mockUser();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(503, { error: "Could not verify your access right now. Please try again in a moment." })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadToCloudinaryWithProgress(file)).rejects.toThrow(/could not verify your access/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 403, because a new token cannot grant admin", async () => {
    mockUser();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(403, { error: "Admin access required" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadToCloudinaryWithProgress(file)).rejects.toThrow(/admin access required/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry rather than looping", async () => {
    const getIdToken = mockUser();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: "Your session has expired." }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadToCloudinaryWithProgress(file)).rejects.toThrow(/session has expired/i);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getIdToken).toHaveBeenCalledTimes(2);
  });

  it("refuses a file that is too large before asking for a signature", async () => {
    mockUser();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const huge = new File([""], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(huge, "size", { value: 20 * 1024 * 1024 });

    await expect(uploadToCloudinaryWithProgress(huge)).rejects.toThrow(/too large/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a file that is neither image nor video", async () => {
    mockUser();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });

    await expect(uploadToCloudinaryWithProgress(pdf)).rejects.toThrow(/image and video/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
