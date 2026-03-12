import type { Metadata } from "next";
import ContactPage from "@/views/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us | ICUBE Media Studio",
  description:
    "Get in touch with ICUBE Media Studio in Dubai. Studio bookings, video production inquiries, and general contact.",
  alternates: { canonical: "/contact" },
  openGraph: {
    url: "/contact",
    siteName: "ICUBE Media Studio",
    title: "Contact Us | ICUBE Media Studio",
    description: "Contact ICUBE Media Studio for studio bookings and production inquiries in Dubai.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Contact Us | ICUBE Media Studio", description: "Contact ICUBE Media Studio for studio bookings and production inquiries in Dubai." },
};

export default function ContactRoute() {
  return <ContactPage />;
}
