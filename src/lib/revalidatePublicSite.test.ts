import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
vi.mock("@/firebase", () => authMocks);

import { resetRevalidateStateForTests, revalidatePublicSite } from "./revalidatePublicSite";

/**
 * Five dashboard screens called invalidateSiteCache *and* went through the api wrapper, and each
 * fired its own /api/revalidate — two identical requests for one save. Coalescing here fixes that
 * without having to prove which call sites can safely drop theirs.
 */

let resolvers: Array<() => void>;

/** send() awaits getIdToken before fetching, so let the microtasks drain before asserting. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function mockAuthed() {
  authMocks.requireAuth.mockReturnValue({
    currentUser: { getIdToken: vi.fn().mockResolvedValue("token") },
  });
}

/** A fetch that only settles when the test says so, so overlap is deterministic. */
function deferredFetch() {
  resolvers = [];
  return vi.fn(
    () =>
      new Promise((resolve) => {
        resolvers.push(() => resolve({ ok: true } as Response));
      })
  );
}

beforeEach(() => {
  resetRevalidateStateForTests();
  vi.clearAllMocks();
  mockAuthed();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("revalidatePublicSite", () => {
  it("sends one request for a single call", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await revalidatePublicSite();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/revalidate");
  });

  // The reported bug: a save that goes through the api wrapper *and* calls invalidateSiteCache
  // sent two identical requests. This is the exact shape of that save.
  it("sends one request when both write paths fire for the same save", async () => {
    const fetchMock = deferredFetch();
    vi.stubGlobal("fetch", fetchMock);

    const first = revalidatePublicSite();
    const second = revalidatePublicSite();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolvers[0]();
    await Promise.all([first, second]);
    await tick();

    // Still one: no trailing follow-up, which would put the count straight back to two.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends one request however many callers overlap", async () => {
    const fetchMock = deferredFetch();
    vi.stubGlobal("fetch", fetchMock);

    const calls = Array.from({ length: 5 }, () => revalidatePublicSite());
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolvers[0]();
    await Promise.all(calls);
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends again for a later, separate save", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await revalidatePublicSite();
    await revalidatePublicSite();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does nothing when nobody is signed in", async () => {
    authMocks.requireAuth.mockReturnValue({ currentUser: null });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await revalidatePublicSite();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows a failed refresh and stays usable afterwards", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(revalidatePublicSite()).resolves.toBeUndefined();
    await revalidatePublicSite();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
