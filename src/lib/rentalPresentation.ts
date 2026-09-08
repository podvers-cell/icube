import { WHATSAPP_URL } from "@/constants/whatsapp";
import type { RentalEquipment } from "@/types/rentalEquipment";

/**
 * How a rental item is presented on the public catalogue.
 *
 * The card and the details dialog show the same facts, so the label, the badge palette and the
 * enquiry link live here rather than being written twice and drifting apart.
 */

export function rentalPriceUnitLabel(unit: RentalEquipment["price_unit"]): string {
  if (unit === "day") return "per day";
  if (unit === "week") return "per week";
  if (unit === "session") return "per session";
  return "per project";
}

export function rentalAvailabilityClasses(status: RentalEquipment["availability_status"]): string {
  if (status === "available") return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
  if (status === "unavailable") return "border-red-400/40 bg-red-500/15 text-red-300";
  return "border-icube-gold/40 bg-icube-gold/10 text-icube-gold";
}

type Enquiry = Pick<RentalEquipment, "name" | "availability_status">;

/**
 * What the button promises.
 *
 * Nothing in this catalogue reserves anything — there is no checkout, the enquiry opens a chat.
 * An unavailable item therefore asks about availability rather than implying a confirmed booking.
 */
export function rentalCtaLabel(item: Enquiry): string {
  return item.availability_status === "unavailable" ? "Ask about availability" : "Request to rent";
}

/**
 * The CTA's label with the item named.
 *
 * The grid repeats these buttons once per product, so the visible text alone ("Request to rent")
 * is identical on every card and tells a screen-reader user nothing about which item they are on.
 * The visible text stays as it is and the name extends it, which keeps voice control working:
 * the accessible name still starts with what is written on the button.
 */
export function rentalCtaAccessibleName(item: Enquiry): string {
  const name = item.name.trim();
  if (!name) return rentalCtaLabel(item);
  return item.availability_status === "unavailable"
    ? `Ask about availability of ${name}`
    : `Request to rent ${name}`;
}

/**
 * A wa.me link with the chat prefilled for this exact item.
 *
 * ?text= must be encoded: product names carry spaces, ampersands and slashes, any of which would
 * otherwise truncate the message or break the URL.
 */
export function rentalWhatsappUrl(item: Enquiry): string {
  const name = item.name.trim() || "an item";
  const message =
    item.availability_status === "unavailable"
      ? `Hi ICUBE Media Studio, I would like to ask about the availability of ${name}.`
      : `Hi ICUBE Media Studio, I would like to request to rent ${name}. Could you confirm availability and pricing?`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
