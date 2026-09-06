import { describe, expect, it } from "vitest";
import { rentalEquipmentSchema } from "./rentalEquipment";

const base = {
  name: "Sony FX6",
  category: "Cameras",
  price_aed: 900,
  price_unit: "day" as const,
  availability_status: "available" as const,
  is_featured: false,
  is_published: true,
  sort_order: 1,
};

describe("rentalEquipmentSchema image_url", () => {
  it("accepts an https URL", () => {
    const parsed = rentalEquipmentSchema.safeParse({ ...base, image_url: "https://res.cloudinary.com/x.jpg" });
    expect(parsed.success).toBe(true);
  });

  it("accepts an empty value", () => {
    const parsed = rentalEquipmentSchema.safeParse({ ...base, image_url: "" });
    expect(parsed.success).toBe(true);
  });

  it("defaults to empty when omitted", () => {
    const parsed = rentalEquipmentSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.image_url).toBe("");
  });

  // z.string().url() alone accepts these. They are inert in an <img src> but become stored XSS
  // if the value ever reaches an href or a CSS url() on the public catalogue.
  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://example.com/x.jpg",
  ])("rejects %s", (url) => {
    const parsed = rentalEquipmentSchema.safeParse({ ...base, image_url: url });
    expect(parsed.success).toBe(false);
  });
});
