import type { Metadata } from "next";
import StudioBookingAddonsPage from "@/views/StudioBookingAddonsPage";

export const metadata: Metadata = {
  title: "Add-ons | Book Studio | ICUBE Media Studio",
  description: "Select extra services for your studio session.",
};

export default function StudioAddonsRoute() {
  return <StudioBookingAddonsPage />;
}
