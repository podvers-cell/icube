import { z } from "zod";
import { CONTACT_SUBJECT_OPTIONS } from "../constants/contact";

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(320, "Email is too long"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .refine((s) => CONTACT_SUBJECT_OPTIONS.includes(s as typeof CONTACT_SUBJECT_OPTIONS[number]), "Invalid subject"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(10000, "Message is too long"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
