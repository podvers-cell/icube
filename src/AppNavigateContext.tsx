"use client";

import { createContext, useContext, type ReactNode } from "react";

export type NavigateFn = (path: string, options?: { replace?: boolean }) => void;

const AppNavigateContext = createContext<NavigateFn | null>(null);

export function useAppNavigate(): NavigateFn {
  const navigate = useContext(AppNavigateContext);
  return navigate ?? ((path: string) => { window.location.href = path; });
}

export function AppNavigateProvider({
  navigate,
  children,
}: {
  navigate: NavigateFn;
  children: ReactNode;
}) {
  return (
    <AppNavigateContext.Provider value={navigate}>
      {children}
    </AppNavigateContext.Provider>
  );
}
