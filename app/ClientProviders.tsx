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
import { usePathname } from "next/navigation";
import type { PublicSiteData } from "@/lib/publicSiteData";

export function ClientProviders({
  children,
  siteData,
}: {
  children: React.ReactNode;
  siteData?: PublicSiteData | null;
}) {
  // The WhatsApp bubble and the cookie banner speak to site visitors. In the admin console they
  // are noise, and the bubble sits on top of the controls in the bottom-right corner.
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard") ?? false;

  return (
    <ErrorBoundary>
    <ThemeProvider>
      <SplashScreen />
      <NavigationLoadingBar />
      <AuthProvider>
        <SiteDataProvider initialData={siteData}>
          <MaintenanceGate>
            <BookingProvider>
              <ToastProvider>
                <ContactModalProvider>
                  {children}
                  {!isAdmin && (
                    <>
                      <WhatsAppFloatingButton />
                      <CookieConsent />
                    </>
                  )}
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
