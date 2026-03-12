import type { Metadata } from "next";
import PortfolioPage from "@/views/PortfolioPage";

export const metadata: Metadata = {
  title: "Our Work & Portfolio | ICUBE Media Studio",
  description:
    "Explore our portfolio of podcast productions, brand films, and commercial video work from Dubai and the GCC.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    url: "/portfolio",
    siteName: "ICUBE Media Studio",
    title: "Our Work & Portfolio | ICUBE Media Studio",
    description: "Podcast, brand film, and commercial video portfolio from Dubai.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title: "Our Work & Portfolio | ICUBE Media Studio", description: "Podcast, brand film, and commercial video portfolio from Dubai." },
};

export default function PortfolioRoute() {
  return <PortfolioPage />;
}
