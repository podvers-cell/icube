import type { Metadata } from "next";
import DashboardLayoutClient from "@/views/DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard | ICUBE Media Studio",
  description: "Admin dashboard",
  robots: "noindex, nofollow",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
