export type RentalAvailability = "available" | "on_request" | "unavailable";
export type RentalPriceUnit = "day" | "week" | "session" | "project";

export type RentalEquipment = {
  id: string;
  name: string;
  category: string;
  short_description?: string;
  details?: string;
  image_url?: string;
  price_aed: number;
  price_unit: RentalPriceUnit;
  quantity_available?: number;
  availability_status: RentalAvailability;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

export function rentalAvailabilityLabel(status: RentalAvailability): string {
  if (status === "available") return "Available";
  if (status === "unavailable") return "Unavailable";
  return "On request";
}
