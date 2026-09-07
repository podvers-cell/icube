export type RentalAvailability = "available" | "on_request" | "unavailable";
export type RentalPriceUnit = "day" | "week" | "session" | "project";

export type RentalEquipment = {
  id: string;
  name: string;
  category: string;
  short_description?: string;
  details?: string;
  image_url?: string;
  /** Gallery; first entry is the cover. Older products only have image_url. */
  image_urls?: string[];
  price_aed: number;
  price_unit: RentalPriceUnit;
  quantity_available?: number;
  availability_status: RentalAvailability;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

/**
 * The images to show, newest field first.
 *
 * Products created before galleries existed only have image_url, and are never migrated — this
 * is the single place that reconciles the two so nothing else has to care which one is set.
 */
export function rentalImages(item: Pick<RentalEquipment, "image_url" | "image_urls">): string[] {
  const gallery = (item.image_urls ?? []).map((url) => url?.trim()).filter(Boolean) as string[];
  if (gallery.length) return gallery;
  const single = item.image_url?.trim();
  return single ? [single] : [];
}

export function rentalAvailabilityLabel(status: RentalAvailability): string {
  if (status === "available") return "Available";
  if (status === "unavailable") return "Unavailable";
  return "On request";
}
