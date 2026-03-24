import type { Metadata } from "next";
import ServiceCaseStudyPage from "@/views/ServiceCaseStudyPage";

export const metadata: Metadata = {
  title: "Service Case Study | ICUBE Media Studio",
  description: "Explore service details and project case studies.",
};

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ServiceCaseStudyPage serviceId={id} />;
}

