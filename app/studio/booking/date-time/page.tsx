import type { Metadata } from "next";
import StudioBookingDateTimePage from "@/views/StudioBookingDateTimePage";

export const metadata: Metadata = {
  title: "Select Date & Time | Book Studio | ICUBE Media Studio",
  description: "Choose your preferred date and time for your studio session.",
};

export default function StudioDateTimeRoute() {
  return <StudioBookingDateTimePage />;
}
