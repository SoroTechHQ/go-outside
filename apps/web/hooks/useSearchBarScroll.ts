"use client";

import { useEffect, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useSearchBarScroll() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const compactProgress = clamp((scrollY - 12) / 170, 0, 1);
  const miniProgress = clamp((scrollY - 128) / 260, 0, 1);

  return {
    scrollY,
    isCompact: scrollY > 104,
    isMini: scrollY > 248,
    compactProgress,
    miniProgress,
  };
}
