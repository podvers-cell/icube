import type { Metadata } from "next";
import PublicSite from "@/PublicSite";

export const metadata: Metadata = {
  title: "ICUBE Media Studio | Premium Media Production – Dubai",
  description:
    "Professional media production and podcast studio in Dubai. Create, record, and amplify your content with cinematic quality. Studio booking, video production, branded content.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    siteName: "ICUBE Media Studio",
    title: "ICUBE Media Studio | Premium Media Production – Dubai",
    description:
      "Professional media production and podcast studio in Dubai. Create, record, and amplify your content.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "ICUBE Media Studio | Premium Media Production – Dubai", description: "Professional media production and podcast studio in Dubai." },
};

export default function HomePage() {
  return <PublicSite />;
}
