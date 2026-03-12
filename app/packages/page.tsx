import type { Metadata } from "next";
import PackagesPage from "@/views/PackagesPage";

export const metadata: Metadata = {
  title: "Studio Packages & Booking | ICUBE Media Studio",
  description:
    "Book our Dubai podcast and video studios by the hour. Transparent pricing, professional equipment, and flexible packages for content creators and brands.",
  alternates: { canonical: "/packages" },
  openGraph: {
    url: "/packages",
    siteName: "ICUBE Media Studio",
    title: "Studio Packages & Booking | ICUBE Media Studio",
    description: "Book our Dubai podcast and video studios. Transparent pricing and flexible packages.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Studio Packages & Booking | ICUBE Media Studio", description: "Book our Dubai podcast and video studios. Transparent pricing and flexible packages." },
};

export default function PackagesRoute() {
  return <PackagesPage />;
}
