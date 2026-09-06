import type { Metadata } from "next";
import DashboardPaymentIncidents from "@/views/DashboardPaymentIncidents";

export const metadata: Metadata = {
  title: "Payment Issues",
  description: "Payments that could not be honoured and need a refund or a decision.",
  robots: "noindex, nofollow",
};

export default function Page() {
  return <DashboardPaymentIncidents />;
}
