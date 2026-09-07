import { z } from "zod";

/**
 * z.string().url() accepts javascript: and data: URLs. Inert in an <img src>, but these reach the
 * public catalogue where an href or a CSS url() would make it stored XSS. HTTPS is required at the
 * point of entry.
 */
const httpsImage = z.union([
  z.literal(""),
  z
    .string()
    .url("Invalid image URL")
    .max(2000)
    .refine((value) => value.toLowerCase().startsWith("https://"), "Image URL must use HTTPS"),
]);

/** Shared by the schema, the save path and the dashboard form. */
export const RENTAL_IMAGE_LIMIT = 10;

export const rentalEquipmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  category: z.string().trim().min(1, "Category is required").max(100),
  short_description: z.string().trim().max(500).optional().default(""),
  details: z.string().trim().max(5000).optional().default(""),
  // Kept for products created before galleries existed, and written on every save as the first
  // image, so anything still reading the single field keeps working without a migration.
  image_url: httpsImage.optional().default(""),
  /**
   * The gallery. First entry is the cover.
   *
   * Capped so one product cannot bloat a document or the public payload; blanks are dropped
   * before validation so an unused slot in the form is not an error.
   */
  image_urls: z
    .array(httpsImage)
    .max(RENTAL_IMAGE_LIMIT, `A product can have at most ${RENTAL_IMAGE_LIMIT} images`)
    .optional()
    .default([]),
  price_aed: z.number().min(0).max(10_000_000),
  price_unit: z.enum(["day", "week", "session", "project"]),
  quantity_available: z.number().int().min(0).max(100_000).optional().default(0),
  availability_status: z.enum(["available", "on_request", "unavailable"]),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.number().int().min(0).max(1_000_000),
});

export type RentalEquipmentInput = z.infer<typeof rentalEquipmentSchema>;
