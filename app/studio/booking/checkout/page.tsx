import type { Metadata } from "next";
import StudioBookingCheckoutPage from "@/views/StudioBookingCheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | Book Studio | ICUBE Media Studio",
  description: "Complete your studio booking request.",
  alternates: { canonical: "/studio/booking/checkout" },
  openGraph: {
    url: "/studio/booking/checkout",
    siteName: "ICUBE Media Studio",
    title: "Checkout | Book Studio | ICUBE Media Studio",
    description: "Complete your studio booking request.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Checkout | Book Studio | ICUBE Media Studio", description: "Complete your studio booking request." },
};

export default function StudioCheckoutRoute() {
  return <StudioBookingCheckoutPage />;
}
