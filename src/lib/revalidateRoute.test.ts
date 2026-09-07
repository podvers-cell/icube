import { describe, expect, it, vi, beforeEach } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
const authMocks = vi.hoisted(() => ({ verifyAdminApiRequest: vi.fn() }));

vi.mock("next/cache", () => cacheMocks);
vi.mock("@/lib/adminApiAuth", () => authMocks);

import { POST } from "../../app/api/revalidate/route";
import { PUBLIC_SITE_DATA_TAG } from "./publicSiteData";
import { RENTAL_EQUIPMENT_TAG } from "./rentalEquipmentQuery";

/**
 * The point of the tags: without them, revalidatePath alone made every one of ~43 routes re-run
 * its own ten Firestore queries. Clearing the shared datasets first means the next render fetches
 * once and the rest reuse it.
 */

const request = () => new Request("https://example.com/api/revalidate", { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/revalidate", () => {
  it("requires an authenticated admin", async () => {
    authMocks.verifyAdminApiRequest.mockResolvedValue({
      ok: false,
      status: 401,
      error: "Authentication required",
    });

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(cacheMocks.revalidateTag).not.toHaveBeenCalled();
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("passes through the status the verifier chose", async () => {
    authMocks.verifyAdminApiRequest.mockResolvedValue({
      ok: false,
      status: 503,
      error: "Could not verify your access right now.",
    });
    expect((await POST(request())).status).toBe(503);
  });

  it("clears both dataset tags and the rendered pages", async () => {
    authMocks.verifyAdminApiRequest.mockResolvedValue({ ok: true, uid: "admin-1" });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith(PUBLIC_SITE_DATA_TAG, { expire: 0 });
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith(RENTAL_EQUIPMENT_TAG, { expire: 0 });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  // Stale data must be marked stale before pages re-render, or a page could repopulate the cache
  // from the value that is about to be discarded.
  it("clears the tags before invalidating the pages", async () => {
    authMocks.verifyAdminApiRequest.mockResolvedValue({ ok: true, uid: "admin-1" });
    const order: string[] = [];
    cacheMocks.revalidateTag.mockImplementation(() => void order.push("tag"));
    cacheMocks.revalidatePath.mockImplementation(() => void order.push("path"));

    await POST(request());

    expect(order).toEqual(["tag", "tag", "path"]);
  });

  // Both are cleared on every write today. This only pins that they are distinct keys, which is
  // what would allow scoping later — it does not claim any scoping exists.
  it("keeps the two datasets under distinct tags", () => {
    expect(PUBLIC_SITE_DATA_TAG).not.toBe(RENTAL_EQUIPMENT_TAG);
  });
});
