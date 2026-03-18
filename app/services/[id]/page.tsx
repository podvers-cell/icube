import type { Metadata } from "next";
import ServiceCaseStudyPage from "@/views/ServiceCaseStudyPage";

export const metadata: Metadata = {
  title: "Service Case Study | ICUBE Media Studio",
  description: "Explore service details, stats, and project infographics.",
};

export default function Page({ params }: { params: { id: string } }) {
  return <ServiceCaseStudyPage serviceId={params.id} />;
}

