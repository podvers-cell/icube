import type { Metadata } from "next";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

export const metadata: Metadata = {
  title: "Dashboard | ICUBE Media Studio",
  description: "Admin dashboard",
  robots: "noindex, nofollow",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
