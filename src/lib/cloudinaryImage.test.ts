import { describe, expect, it } from "vitest";
import { cloudinaryImage } from "./cloudinaryImage";

const RAW = "https://res.cloudinary.com/demo/image/upload/v1774529869/workshops/cover.jpg";

describe("cloudinaryImage", () => {
  it("asks Cloudinary for a sized, auto-format copy", () => {
    expect(cloudinaryImage(RAW, 1200)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1200/v1774529869/workshops/cover.jpg"
    );
  });

  it("keeps the rest of the path and the version intact", () => {
    const out = cloudinaryImage(RAW, 640);
    expect(out).toContain("/v1774529869/workshops/cover.jpg");
    expect(out).toContain("w_640");
  });

  // Someone may have hand-tuned a URL; do not stack a second transformation on it.
  it("leaves an already-transformed URL alone", () => {
    const transformed =
      "https://res.cloudinary.com/demo/image/upload/w_500,c_fill/v1/workshops/cover.jpg";
    expect(cloudinaryImage(transformed, 1200)).toBe(transformed);
  });

  it("passes through non-Cloudinary hosts unchanged", () => {
    const other = "https://images.unsplash.com/photo-1?w=100";
    expect(cloudinaryImage(other, 800)).toBe(other);
  });

  it("passes through relative paths and empty values", () => {
    expect(cloudinaryImage("/icube-logo.svg", 800)).toBe("/icube-logo.svg");
    expect(cloudinaryImage("", 800)).toBe("");
    expect(cloudinaryImage(null, 800)).toBe("");
    expect(cloudinaryImage(undefined, 800)).toBe("");
  });

  it("passes through a Cloudinary URL with no upload segment", () => {
    const odd = "https://res.cloudinary.com/demo/raw/fetch/x.jpg";
    expect(cloudinaryImage(odd, 800)).toBe(odd);
  });
});
