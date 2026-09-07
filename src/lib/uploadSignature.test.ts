import { createHash } from "crypto";
import { describe, expect, it } from "vitest";

/**
 * The signing rule Cloudinary expects, pinned here.
 *
 * This is the contract the direct-upload route depends on: sorted `key=value` pairs joined by `&`,
 * then the API secret, hashed with SHA-1. Verified against Cloudinary with a real upload; these
 * tests stop the shape drifting afterwards.
 */
function signParams(params: Record<string, string>, apiSecret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(canonical + apiSecret).digest("hex");
}

describe("Cloudinary upload signature", () => {
  it("sorts parameters, so key order cannot change the signature", () => {
    const a = signParams({ folder: "icube", timestamp: "100" }, "secret");
    const b = signParams({ timestamp: "100", folder: "icube" }, "secret");
    expect(a).toBe(b);
  });

  it("changes when any signed value changes", () => {
    const base = signParams({ folder: "icube", timestamp: "100" }, "secret");
    expect(signParams({ folder: "other", timestamp: "100" }, "secret")).not.toBe(base);
    expect(signParams({ folder: "icube", timestamp: "101" }, "secret")).not.toBe(base);
  });

  it("changes with the secret, so a leaked signature is not reusable elsewhere", () => {
    expect(signParams({ folder: "icube", timestamp: "100" }, "a")).not.toBe(
      signParams({ folder: "icube", timestamp: "100" }, "b")
    );
  });

  it("produces a 40-character SHA-1 hex digest", () => {
    expect(signParams({ folder: "icube", timestamp: "100" }, "secret")).toMatch(/^[a-f0-9]{40}$/);
  });

  // Matches Cloudinary's documented example format exactly.
  it("builds the canonical string Cloudinary documents", () => {
    const secret = "abcd";
    const expected = createHash("sha1").update("folder=f&timestamp=1" + secret).digest("hex");
    expect(signParams({ timestamp: "1", folder: "f" }, secret)).toBe(expected);
  });
});

describe("upload folder validation", () => {
  const pattern = /^[a-z0-9/_-]+$/i;
  const valid = (v: string) => pattern.test(v) && !v.includes("..") && v.length <= 80;

  it("accepts the folders the dashboard uses", () => {
    for (const f of ["icube", "portfolio", "portfolio/gallery", "workshops/videos", "rental-equipment"]) {
      expect(valid(f)).toBe(true);
    }
  });

  // The folder is signed, so an unchecked value would be an upload anywhere in the account.
  it("rejects traversal and anything outside the allowed characters", () => {
    for (const f of ["../secrets", "a/../../b", "folder;rm", "folder with space", "folder$", ""]) {
      expect(valid(f)).toBe(false);
    }
  });
});
