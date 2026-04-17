"use client";

import { useEffect } from "react";

export function ForceLight() {
  useEffect(() => {
    const prev = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = "light";
    return () => {
      if (prev) document.documentElement.dataset.theme = prev;
      else delete document.documentElement.dataset.theme;
    };
  }, []);

  return null;
}
