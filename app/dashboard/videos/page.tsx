import type { Metadata } from "next";
import DashboardVideos from "@/views/DashboardVideos";

export const metadata: Metadata = {
  title: "Videos",
  description: "Manage the videos shown on the public site.",
  robots: "noindex, nofollow",
};

export default function Page() {
  return <DashboardVideos />;
}
