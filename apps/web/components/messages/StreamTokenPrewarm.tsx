"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export function StreamTokenPrewarm() {
  const { getToken } = useAuth();

  useEffect(() => {
    const prewarm = async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) return;
        void fetch("/api/chat/token", {
          method: "POST",
          headers: { Authorization: `Bearer ${clerkToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Silent — fire-and-forget warm-up
      }
    };
    void prewarm();
  }, [getToken]);

  return null;
}
