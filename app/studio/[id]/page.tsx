import type { Metadata } from "next";
import StudioDetailPage from "@/views/StudioDetailPage";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Studio ${id} | Book Studio | ICUBE Media Studio`,
    description: "View studio details, gallery, and book your session at ICUBE Media Studio in Dubai.",
    alternates: { canonical: `/studio/${id}` },
  };
}

export default function StudioDetailRoute({ params }: Props) {
  return <StudioDetailPage />;
}
