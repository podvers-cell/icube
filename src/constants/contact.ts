/**
 * Default contact email shown on the site and used for receiving contact form messages.
 */
export const CONTACT_EMAIL = "info@icubeproduction.com";

/**
 * Single source of truth for contact form subject / area of interest options.
 * Used by both the Contact section (home) and the Contact modal.
 */
export const CONTACT_SUBJECT_OPTIONS = [
  "Studio Booking",
  "Video Production",
  "Podcast Production",
  "Branded Content",
  "Social Media",
  "Photography",
  "Commercial / TVC",
  "Post-Production & Editing",
  "General Inquiry",
] as const;

export type ContactSubjectOption = (typeof CONTACT_SUBJECT_OPTIONS)[number];
