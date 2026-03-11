"use client";

import { useRouter } from "next/navigation";
import { AuthProvider } from "@/AuthContext";
import { SiteDataProvider } from "@/SiteDataContext";
import { ContactModalProvider } from "@/ContactModalContext";
import { AppNavigateProvider } from "@/AppNavigateContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navigate = (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) router.replace(path);
    else router.push(path);
  };
  return (
    <AuthProvider>
      <SiteDataProvider>
        <ContactModalProvider>
          <AppNavigateProvider navigate={navigate}>
            {children}
          </AppNavigateProvider>
        </ContactModalProvider>
      </SiteDataProvider>
    </AuthProvider>
  );
}
