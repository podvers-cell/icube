"use client";

import { AuthProvider } from "@/AuthContext";
import { SiteDataProvider } from "@/SiteDataContext";
import { ContactModalProvider } from "@/ContactModalContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteDataProvider>
        <ContactModalProvider>{children}</ContactModalProvider>
      </SiteDataProvider>
    </AuthProvider>
  );
}
