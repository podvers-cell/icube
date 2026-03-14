"use client";

import { AuthProvider } from "@/AuthContext";
import { SiteDataProvider } from "@/SiteDataContext";
import { ContactModalProvider } from "@/ContactModalContext";
import { BookingProvider } from "@/BookingContext";
import { ThemeProvider } from "@/ThemeContext";
import { ToastProvider } from "@/ToastContext";
import MaintenanceGate from "@/components/MaintenanceGate";
import CookieConsent from "@/components/CookieConsent";
import CustomCursorGate from "@/components/CustomCursorGate";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteDataProvider>
          <MaintenanceGate>
            <BookingProvider>
              <ToastProvider>
                <ContactModalProvider>
                  {children}
                  <CustomCursorGate />
                  <CookieConsent />
                </ContactModalProvider>
              </ToastProvider>
            </BookingProvider>
          </MaintenanceGate>
        </SiteDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
