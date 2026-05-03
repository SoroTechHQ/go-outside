"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseResizableSidebarOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function useResizableSidebar({
  defaultWidth = 240,
  minWidth = 200,
  maxWidth = 340,
  storageKey = "organizer_sidebar_width",
}: UseResizableSidebarOptions = {}) {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = Number(stored);
      if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
        setSidebarWidth(parsed);
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setSidebarWidth(next);
    },
    [minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    // Persist after drag ends
    setSidebarWidth((w) => {
      localStorage.setItem(storageKey, String(w));
      return w;
    });
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [storageKey, handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [sidebarWidth, handleMouseMove, handleMouseUp],
  );

  return { sidebarWidth, handleMouseDown, isDragging: isDragging.current };
}
