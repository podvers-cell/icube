import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientFacingError, isClientFacingError, toApiError } from "./apiErrors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toApiError", () => {
  it("passes a client-facing message and status straight through", () => {
    const result = toApiError("test", new ClientFacingError("This booking has already been paid.", 409));
    expect(result).toEqual({ message: "This booking has already been paid.", status: 409 });
  });

  it("defaults a client-facing error to 400", () => {
    expect(toApiError("test", new ClientFacingError("Bad input.")).status).toBe(400);
  });

  it("hides an unexpected error behind the fallback and logs it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const internal = new Error("7 PERMISSION_DENIED: Missing index on projects/icube-817ab/...");

    const result = toApiError("test", internal, "Could not create the booking.");

    expect(result).toEqual({ message: "Could not create the booking.", status: 500 });
    expect(result.message).not.toContain("icube-817ab");
    expect(spy).toHaveBeenCalledWith("[test]", internal);
  });

  it("hides non-Error throws too", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toApiError("test", "raw string").status).toBe(500);
  });
});

describe("isClientFacingError", () => {
  it("distinguishes a client-facing error from a plain one", () => {
    expect(isClientFacingError(new ClientFacingError("x"))).toBe(true);
    expect(isClientFacingError(new Error("x"))).toBe(false);
  });
});
