"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AppShellContextValue = {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(72);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-shell-offset", `${sidebarWidth}px`);

    return () => {
      document.documentElement.style.removeProperty("--app-shell-offset");
    };
  }, [sidebarWidth]);

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
