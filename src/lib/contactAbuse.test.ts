import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { claimConfirmationEmail, isTurnstileConfigured, verifyTurnstile } from "./contactAbuse";
import type { Firestore } from "firebase-admin/firestore";

const ORIGINAL_SECRET = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = ORIGINAL_SECRET;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it("passes through when no secret is configured, so the form keeps working", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileConfigured()).toBe(false);
    await expect(verifyTurnstile(undefined)).resolves.toEqual({ ok: true });
  });

  it("rejects a missing token once a secret is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(isTurnstileConfigured()).toBe(true);

    const missing = await verifyTurnstile(undefined);
    expect(missing.ok).toBe(false);
    expect(await verifyTurnstile("   ")).toMatchObject({ ok: false });
    expect(await verifyTurnstile(42)).toMatchObject({ ok: false });
  });

  it("accepts a token Cloudflare confirms", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true }) }));

    await expect(verifyTurnstile("good-token")).resolves.toEqual({ ok: true });
  });

  it("rejects a token Cloudflare refuses", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));

    expect(await verifyTurnstile("bad-token")).toMatchObject({ ok: false });
  });

  // A verification outage must not silently reopen the relay.
  it("fails closed when the verification call throws", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    expect(await verifyTurnstile("any-token")).toMatchObject({ ok: false });
  });
});

function firestoreStub(existing: { millis: number } | null, onSet: () => void) {
  const tx = {
    get: async () => ({
      exists: existing !== null,
      data: () => (existing ? { last_sent_at: { toMillis: () => existing.millis } } : undefined),
    }),
    set: onSet,
  };
  return {
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (fn: (t: typeof tx) => Promise<boolean>) => fn(tx),
  } as unknown as Firestore;
}

describe("claimConfirmationEmail", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("allows the first confirmation to an address", async () => {
    const set = vi.fn();
    await expect(claimConfirmationEmail(firestoreStub(null, set), "a@b.com")).resolves.toBe(true);
    expect(set).toHaveBeenCalled();
  });

  it("refuses a second confirmation inside the cooldown window", async () => {
    const set = vi.fn();
    const db = firestoreStub({ millis: Date.now() - 60_000 }, set);
    await expect(claimConfirmationEmail(db, "a@b.com")).resolves.toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it("allows again once the window has passed", async () => {
    const db = firestoreStub({ millis: Date.now() - 2 * 60 * 60 * 1000 }, vi.fn());
    await expect(claimConfirmationEmail(db, "a@b.com")).resolves.toBe(true);
  });

  // Genuine customers must not lose their confirmation because the ledger is unavailable.
  it("allows the send when the ledger itself fails", async () => {
    const db = {
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async () => {
        throw new Error("firestore unavailable");
      },
    } as unknown as Firestore;

    await expect(claimConfirmationEmail(db, "a@b.com")).resolves.toBe(true);
  });
});
