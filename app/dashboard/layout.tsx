"use client";

import ProtectedRouteNext from "@/views/ProtectedRouteNext";
import DashboardLayoutNext from "@/views/DashboardLayoutNext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRouteNext>
      <DashboardLayoutNext>{children}</DashboardLayoutNext>
    </ProtectedRouteNext>
  );
}
