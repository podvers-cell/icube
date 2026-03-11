import type { Metadata } from "next";
import StudioBookingCheckoutPage from "@/views/StudioBookingCheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | Book Studio | ICUBE Media Studio",
  description: "Complete your studio booking request.",
};

export default function StudioCheckoutRoute() {
  return <StudioBookingCheckoutPage />;
}
