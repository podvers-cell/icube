import type { Metadata } from "next";
import RentEquipmentPage from "@/views/RentEquipmentPage";
import { isFirebaseAdminConfigError } from "@/firebase-admin";
import { getPublishedRentalEquipment } from "@/lib/rentalEquipmentQuery";
import type { RentalEquipment } from "@/types/rentalEquipment";

export const metadata: Metadata = {
  title: "Rent Equipment",
  description:
    "Rent professional cameras, lighting and audio equipment in Dubai. Daily, weekly and per-project rates, with or without a studio booking.",
  alternates: { canonical: "/rent-equipment" },
  openGraph: {
    url: "/rent-equipment",
    siteName: "ICUBE Media Studio",
    title: "Rent Equipment | ICUBE Media Studio",
    description: "Professional camera, lighting and audio rental in Dubai.",
    locale: "en_AE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rent Equipment | ICUBE Media Studio",
    description: "Professional camera, lighting and audio rental in Dubai.",
  },
};

// Rendered on the server so the catalogue is in the HTML for search engines, then revalidated
// periodically rather than on every request.
export const revalidate = 300;

export default async function RentEquipmentRoute() {
  let items: RentalEquipment[] = [];

  try {
    items = (await getPublishedRentalEquipment()) ?? [];
  } catch (err) {
    // The page still renders its empty state and contact CTA rather than failing outright — a
    // catalogue outage should not take a marketing page down.
    if (!isFirebaseAdminConfigError(err)) console.error("[rent-equipment]", err);
  }

  return <RentEquipmentPage items={items} />;
}
