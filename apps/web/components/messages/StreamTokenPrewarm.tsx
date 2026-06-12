"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

function buildDisplayName(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return "";
  const fullName = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.primaryEmailAddress?.emailAddress || "";
}

export function StreamTokenPrewarm() {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const prewarm = async () => {
      try {
        void fetch("/api/chat/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: user.imageUrl || null,
            name: buildDisplayName(user),
            username: user.username ?? null,
          }),
        });
      } catch {
        // Silent — fire-and-forget warm-up
      }
    };
    void prewarm();
  }, [isLoaded, user]);

  return null;
}
