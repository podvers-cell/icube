import type { Metadata } from "next";
import StudioBookingDateTimePage from "@/views/StudioBookingDateTimePage";

export const metadata: Metadata = {
  title: "Select Date & Time | Book Studio | ICUBE Media Studio",
  description: "Choose your preferred date and time for your studio session.",
  alternates: { canonical: "/studio/booking/date-time" },
  openGraph: {
    url: "/studio/booking/date-time",
    siteName: "ICUBE Media Studio",
    title: "Select Date & Time | Book Studio | ICUBE Media Studio",
    description: "Choose your preferred date and time for your studio session.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Select Date & Time | Book Studio | ICUBE Media Studio", description: "Choose your preferred date and time for your studio session." },
};

export default function StudioDateTimeRoute() {
  return <StudioBookingDateTimePage />;
}
