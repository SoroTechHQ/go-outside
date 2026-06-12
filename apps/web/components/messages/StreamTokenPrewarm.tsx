"use client";

import { useEffect } from "react";

export function StreamTokenPrewarm() {
  useEffect(() => {
    const prewarm = async () => {
      try {
        void fetch("/api/chat/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Silent — fire-and-forget warm-up
      }
    };
    void prewarm();
  }, []);

  return null;
}
