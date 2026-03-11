"use client";

import { AuthProvider } from "@/AuthContext";
import { SiteDataProvider } from "@/SiteDataContext";
import { ContactModalProvider } from "@/ContactModalContext";
import { BookingProvider } from "@/BookingContext";
import MaintenanceGate from "@/components/MaintenanceGate";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteDataProvider>
        <MaintenanceGate>
          <BookingProvider>
            <ContactModalProvider>{children}</ContactModalProvider>
          </BookingProvider>
        </MaintenanceGate>
      </SiteDataProvider>
    </AuthProvider>
  );
}
