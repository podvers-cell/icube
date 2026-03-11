"use client";

import ProtectedRouteNext from "@/views/ProtectedRouteNext";
import DashboardLayoutNext from "@/views/DashboardLayoutNext";
import { ToastProvider } from "@/ToastContext";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRouteNext>
      <ToastProvider>
        <DashboardLayoutNext>{children}</DashboardLayoutNext>
      </ToastProvider>
    </ProtectedRouteNext>
  );
}
