import type { Metadata } from "next";
import StudioBookingAddonsPage from "@/views/StudioBookingAddonsPage";

export const metadata: Metadata = {
  title: "Add-ons | Book Studio | ICUBE Media Studio",
  description: "Select extra services for your studio session.",
  alternates: { canonical: "/studio/booking/add-ons" },
  openGraph: {
    url: "/studio/booking/add-ons",
    siteName: "ICUBE Media Studio",
    title: "Add-ons | Book Studio | ICUBE Media Studio",
    description: "Select extra services for your studio session.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Add-ons | Book Studio | ICUBE Media Studio", description: "Select extra services for your studio session." },
};

export default function StudioAddonsRoute() {
  return <StudioBookingAddonsPage />;
}
