import type { Metadata } from "next";
import BookingAddonsPage from "@/views/BookingAddonsPage";

export const metadata: Metadata = {
  title: "Add-ons | Book Studio | ICUBE Media Studio",
  description: "Select extra services for your studio session.",
};

export default function AddonsRoute() {
  return <BookingAddonsPage />;
}
