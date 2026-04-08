"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AppShellContextValue = {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const value = useMemo(
    () => ({
      sidebarWidth,
      setSidebarWidth,
    }),
    [sidebarWidth],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    return {
      sidebarWidth: 0,
      setSidebarWidth: () => undefined,
    };
  }

  return context;
}
