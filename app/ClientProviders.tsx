"use client";

import { AuthProvider } from "@/AuthContext";
import { SiteDataProvider } from "@/SiteDataContext";
import { ContactModalProvider } from "@/ContactModalContext";
import { BookingProvider } from "@/BookingContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteDataProvider>
        <BookingProvider>
          <ContactModalProvider>{children}</ContactModalProvider>
        </BookingProvider>
      </SiteDataProvider>
    </AuthProvider>
  );
}
