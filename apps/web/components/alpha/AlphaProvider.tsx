"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isAlphaMode, setAlphaMode, startConsoleCapture } from "../../lib/alpha";
import { AlphaFeedbackWidget } from "./AlphaFeedbackWidget";
import { AlphaPeriodicPrompt } from "./AlphaPeriodicPrompt";

interface AlphaContextValue {
  isAlpha: boolean;
  enableAlpha: () => void;
}

const AlphaContext = createContext<AlphaContextValue>({ isAlpha: false, enableAlpha: () => {} });

export function useAlpha() {
  return useContext(AlphaContext);
}

export function AlphaProvider({ children }: { children: ReactNode }) {
  const [isAlpha, setIsAlpha] = useState(false);

  useEffect(() => {
    const active = isAlphaMode();
    if (active) {
      setIsAlpha(true);
      startConsoleCapture();
    }

    // If ?alpha=true in URL, persist to localStorage and clean URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("alpha") === "true" || params.get("alpha") === "1") {
      setAlphaMode(true);
      setIsAlpha(true);
      params.delete("alpha");
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : "");
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  const enableAlpha = () => {
    setAlphaMode(true);
    setIsAlpha(true);
    startConsoleCapture();
  };

  return (
    <AlphaContext.Provider value={{ isAlpha, enableAlpha }}>
      {children}
      {isAlpha && (
        <>
          <AlphaFeedbackWidget />
          <AlphaPeriodicPrompt />
        </>
      )}
    </AlphaContext.Provider>
  );
}
