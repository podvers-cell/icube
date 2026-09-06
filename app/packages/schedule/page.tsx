import type { Metadata } from "next";
import BookingSchedulePage from "@/views/BookingSchedulePage";

export const metadata: Metadata = {
  title: "Choose Booking Type | Packages | ICUBE Media Studio",
  description: "Choose whether your package booking needs a studio date and time.",
  robots: { index: false, follow: false },
};

export default function ScheduleRoute() {
  return <BookingSchedulePage />;
}
