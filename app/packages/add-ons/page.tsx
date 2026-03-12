import type { Metadata } from "next";
import BookingAddonsPage from "@/views/BookingAddonsPage";

export const metadata: Metadata = {
  title: "Add-ons | Book Studio | ICUBE Media Studio",
  description: "Select extra services for your studio session.",
  alternates: { canonical: "/packages/add-ons" },
  openGraph: {
    url: "/packages/add-ons",
    siteName: "ICUBE Media Studio",
    title: "Add-ons | Book Studio | ICUBE Media Studio",
    description: "Select extra services for your studio session.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Add-ons | Book Studio | ICUBE Media Studio", description: "Select extra services for your studio session." },
};

export default function AddonsRoute() {
  return <BookingAddonsPage />;
}
