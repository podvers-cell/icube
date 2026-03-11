import type { Metadata } from "next";
import DashboardOverview from "@/views/DashboardOverview";

export const metadata: Metadata = {
  title: "Dashboard | ICUBE Media Studio",
  description: "Admin dashboard",
  robots: "noindex, nofollow",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
