"use client";

import dynamic from "next/dynamic";
import DashboardLayoutLoading from "@/components/DashboardLayoutLoading";

const DashboardLayoutClient = dynamic(
  () => import("@/views/DashboardLayoutClient"),
  { ssr: false, loading: () => <DashboardLayoutLoading /> }
);

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
