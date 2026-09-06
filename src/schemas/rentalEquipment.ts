import { z } from "zod";

export const rentalEquipmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  category: z.string().trim().min(1, "Category is required").max(100),
  short_description: z.string().trim().max(500).optional().default(""),
  details: z.string().trim().max(5000).optional().default(""),
  // z.string().url() accepts javascript: and data: URLs. That is inert in the dashboard's
  // <img src>, but this value is destined for the public catalogue, where reaching an href or a
  // CSS url() would make it stored XSS. Require HTTPS at the point of entry instead.
  image_url: z
    .union([
      z.literal(""),
      z
        .string()
        .url("Invalid image URL")
        .max(2000)
        .refine((value) => value.toLowerCase().startsWith("https://"), "Image URL must use HTTPS"),
    ])
    .optional()
    .default(""),
  price_aed: z.number().min(0).max(10_000_000),
  price_unit: z.enum(["day", "week", "session", "project"]),
  quantity_available: z.number().int().min(0).max(100_000).optional().default(0),
  availability_status: z.enum(["available", "on_request", "unavailable"]),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.number().int().min(0).max(1_000_000),
});

export type RentalEquipmentInput = z.infer<typeof rentalEquipmentSchema>;
