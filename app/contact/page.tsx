import type { Metadata } from "next";
import ContactPage from "@/views/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us | ICUBE Media Studio",
  description:
    "Get in touch with ICUBE Media Studio in Dubai. Studio bookings, video production inquiries, and general contact.",
  openGraph: {
    title: "Contact Us | ICUBE Media Studio",
    description: "Contact ICUBE Media Studio for studio bookings and production inquiries in Dubai.",
  },
};

export default function ContactRoute() {
  return <ContactPage />;
}
