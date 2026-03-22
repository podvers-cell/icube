"use client";

import { AuthProvider } from "@/AuthContext";
import { SiteDataProvider } from "@/SiteDataContext";
import { ContactModalProvider } from "@/ContactModalContext";
import { BookingProvider } from "@/BookingContext";
import { ThemeProvider } from "@/ThemeContext";
import { ToastProvider } from "@/ToastContext";
import MaintenanceGate from "@/components/MaintenanceGate";
import CookieConsent from "@/components/CookieConsent";
import { SplashScreen } from "@/components/SplashScreen";
import NavigationLoadingBar from "@/components/NavigationLoadingBar";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import { ErrorBoundary } from "@/ErrorBoundary";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <SplashScreen />
      <NavigationLoadingBar />
      <AuthProvider>
        <SiteDataProvider>
          <MaintenanceGate>
            <BookingProvider>
              <ToastProvider>
                <ContactModalProvider>
                  {children}
                  <WhatsAppFloatingButton />
                  <CookieConsent />
                </ContactModalProvider>
              </ToastProvider>
            </BookingProvider>
          </MaintenanceGate>
        </SiteDataProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
