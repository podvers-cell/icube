import { describe, expect, it } from "vitest";
import { rentalCategories, toPublicEquipment } from "./rentalEquipmentQuery";
import type { RentalEquipment } from "@/types/rentalEquipment";

describe("toPublicEquipment", () => {
  const stored = {
    name: "Sony FX6",
    category: "Cameras",
    short_description: "Full-frame cinema camera",
    details: "Includes battery and card",
    image_url: "https://res.cloudinary.com/x.jpg",
    price_aed: 900,
    price_unit: "day",
    quantity_available: 3,
    availability_status: "available",
    is_featured: true,
    is_published: true,
    sort_order: 2,
  };

  it("maps the stored document onto the public shape", () => {
    // image_urls is part of the shape now; a document without one publishes an empty gallery.
    expect(toPublicEquipment("abc", stored)).toEqual({ id: "abc", ...stored, image_urls: [] });
  });

  it("publishes a gallery, dropping anything that is not an https URL", () => {
    const result = toPublicEquipment("abc", {
      ...stored,
      image_urls: [
        "https://res.cloudinary.com/1.jpg",
        "http://insecure.example/2.jpg",
        "javascript:alert(1)",
        42,
        "https://res.cloudinary.com/3.jpg",
      ],
    });
    expect(result.image_urls).toEqual([
      "https://res.cloudinary.com/1.jpg",
      "https://res.cloudinary.com/3.jpg",
    ]);
  });

  it("caps the published gallery at ten images", () => {
    const many = Array.from({ length: 25 }, (_, i) => `https://res.cloudinary.com/${i}.jpg`);
    expect(toPublicEquipment("abc", { ...stored, image_urls: many }).image_urls).toHaveLength(10);
  });

  // The whole reason this is an explicit list rather than a spread.
  it("drops fields that are not part of the public shape", () => {
    const result = toPublicEquipment("abc", {
      ...stored,
      cost_price_aed: 400,
      supplier_notes: "Bought from X",
      internal_ref: "INV-991",
    }) as Record<string, unknown>;

    expect(result.cost_price_aed).toBeUndefined();
    expect(result.supplier_notes).toBeUndefined();
    expect(result.internal_ref).toBeUndefined();
    expect(Object.keys(result)).toHaveLength(14);
  });

  // The legacy single field used to be published raw, so a pre-schema document could carry a
  // non-https or malformed URL onto a public page.
  it("sanitises the legacy image_url as well as the gallery", () => {
    expect(toPublicEquipment("a", { ...stored, image_url: "http://insecure.example/a.jpg" }).image_url).toBe("");
    expect(toPublicEquipment("a", { ...stored, image_url: "javascript:alert(1)" }).image_url).toBe("");
    expect(toPublicEquipment("a", { ...stored, image_url: "not a url" }).image_url).toBe("");
    expect(toPublicEquipment("a", { ...stored, image_url: 42 }).image_url).toBe("");
  });

  it("keeps existing https links working", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/a.jpg";
    expect(toPublicEquipment("a", { ...stored, image_url: url }).image_url).toBe(url);
    expect(toPublicEquipment("a", { ...stored, image_urls: [url] }).image_urls).toEqual([url]);
  });

  it("fills sane defaults for a partial document", () => {
    const result = toPublicEquipment("abc", {});
    expect(result.name).toBe("");
    expect(result.price_aed).toBe(0);
    expect(result.price_unit).toBe("day");
    expect(result.availability_status).toBe("on_request");
    expect(result.is_featured).toBe(false);
    expect(result.is_published).toBe(false);
    expect(result.sort_order).toBe(0);
  });

  it("coerces truthy-but-not-true flags to false", () => {
    const result = toPublicEquipment("abc", { is_published: "yes", is_featured: 1 });
    expect(result.is_published).toBe(false);
    expect(result.is_featured).toBe(false);
  });
});

describe("rentalCategories", () => {
  const item = (category: string): RentalEquipment =>
    toPublicEquipment("id", { name: "x", category, price_aed: 1, sort_order: 0 });

  it("returns distinct categories in catalogue order", () => {
    expect(rentalCategories([item("Cameras"), item("Lighting"), item("Cameras")])).toEqual([
      "Cameras",
      "Lighting",
    ]);
  });

  it("ignores blank categories", () => {
    expect(rentalCategories([item(""), item("   "), item("Audio")])).toEqual(["Audio"]);
  });

  it("handles an empty catalogue", () => {
    expect(rentalCategories([])).toEqual([]);
  });
});
