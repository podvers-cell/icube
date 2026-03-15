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
import CustomCursorProvider from "@/components/CustomCursorProvider";
import NavigationLoadingBar from "@/components/NavigationLoadingBar";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SplashScreen />
      <NavigationLoadingBar />
      <CustomCursorProvider />
      <AuthProvider>
        <SiteDataProvider>
          <MaintenanceGate>
            <BookingProvider>
              <ToastProvider>
                <ContactModalProvider>
                  {children}
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
