"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AppShellContextValue = {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  peekPanelWidth: number;
  setPeekPanelWidth: (width: number) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(72);
  const [peekPanelWidth, setPeekPanelWidth] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-shell-offset", `${sidebarWidth}px`);
    return () => {
      document.documentElement.style.removeProperty("--app-shell-offset");
    };
  }, [sidebarWidth]);

  useEffect(() => {
    document.documentElement.style.setProperty("--peek-panel-width", `${peekPanelWidth}px`);
    return () => {
      document.documentElement.style.removeProperty("--peek-panel-width");
    };
  }, [peekPanelWidth]);

  const value = useMemo(
    () => ({ sidebarWidth, setSidebarWidth, peekPanelWidth, setPeekPanelWidth }),
    [sidebarWidth, peekPanelWidth],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    return {
      sidebarWidth: 0,
      setSidebarWidth: () => undefined,
      peekPanelWidth: 0,
      setPeekPanelWidth: () => undefined,
    };
  }
  return context;
}
