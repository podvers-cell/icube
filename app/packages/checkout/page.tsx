import type { Metadata } from "next";
import BookingCheckoutPage from "@/views/BookingCheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | Book Studio | ICUBE Media Studio",
  description: "Complete your studio booking request.",
};

export default function CheckoutRoute() {
  return <BookingCheckoutPage />;
}
