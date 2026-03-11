import { z } from "zod";

export const bookingPayloadSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100, "First name is too long"),
  last_name: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email").max(320, "Email is too long"),
  phone: z.string().max(30).optional(),
  project_details: z.string().max(5000).optional(),
  package_id: z.string().max(100).optional(),
  studio_id: z.string().max(100).optional(),
  studio_name: z.string().max(200).optional(),
  booking_duration_hours: z.number().int().min(1).max(24).optional(),
  studio_total_aed: z.number().min(0).optional(),
  booking_date: z.string().max(20).optional(),
  time_slot: z.string().max(20).optional(),
  addon_ids: z.array(z.string().max(100)).max(20).optional(),
  addons_total_aed: z.number().min(0).optional(),
});

export type BookingPayloadSchema = z.infer<typeof bookingPayloadSchema>;
