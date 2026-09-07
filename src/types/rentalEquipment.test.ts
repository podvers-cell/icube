import { describe, expect, it } from "vitest";
import { rentalImages, type RentalEquipment } from "./rentalEquipment";

type ImageFields = Pick<RentalEquipment, "image_url" | "image_urls">;

describe("rentalImages", () => {
  // Products created before galleries existed are never migrated, so they must keep working.
  it("falls back to the legacy single image", () => {
    expect(rentalImages({ image_url: "https://res.cloudinary.com/a.jpg" })).toEqual([
      "https://res.cloudinary.com/a.jpg",
    ]);
  });

  it("prefers the gallery when one is set", () => {
    const item: ImageFields = {
      image_url: "https://res.cloudinary.com/old.jpg",
      image_urls: ["https://res.cloudinary.com/1.jpg", "https://res.cloudinary.com/2.jpg"],
    };
    expect(rentalImages(item)).toEqual([
      "https://res.cloudinary.com/1.jpg",
      "https://res.cloudinary.com/2.jpg",
    ]);
  });

  it("keeps gallery order, because the first entry is the cover", () => {
    const urls = ["https://a.com/3.jpg", "https://a.com/1.jpg", "https://a.com/2.jpg"];
    expect(rentalImages({ image_urls: urls })[0]).toBe("https://a.com/3.jpg");
  });

  it("ignores blank slots left in the form", () => {
    const item: ImageFields = {
      image_urls: ["https://a.com/1.jpg", "", "   ", "https://a.com/2.jpg"],
    };
    expect(rentalImages(item)).toEqual(["https://a.com/1.jpg", "https://a.com/2.jpg"]);
  });

  it("falls back to the legacy image when the gallery is only blanks", () => {
    const item: ImageFields = { image_url: "https://a.com/old.jpg", image_urls: ["", "  "] };
    expect(rentalImages(item)).toEqual(["https://a.com/old.jpg"]);
  });

  it("returns nothing when a product has no image at all", () => {
    expect(rentalImages({})).toEqual([]);
    expect(rentalImages({ image_url: "", image_urls: [] })).toEqual([]);
  });
});
