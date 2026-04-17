"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { demoData } from "@gooutside/demo-data";
import Header from "./Header";
import NavSwitch from "./NavSwitch";

type ShellUser = {
  first_name?: string | null;
  last_name?: string | null;
  role?: "attendee" | "organizer" | "admin" | null;
};

type ShellState = {
  role: "attendee" | "organizer" | "admin";
  userName: string;
};

export function AppChrome() {
  const [shellUser, setShellUser] = useState<ShellState>({
    role: "attendee" as const,
    userName: demoData.attendee.name,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadShellUser() {
      try {
        const response = await fetch("/api/users/me", {
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as ShellUser;
        const first = data.first_name?.trim();
        const last = data.last_name?.trim();
        const userName = [first, last].filter(Boolean).join(" ").trim();

        setShellUser({
          role: data.role === "organizer" || data.role === "admin" ? data.role : "attendee",
          userName: userName || demoData.attendee.name,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[AppChrome] failed to load user shell state", error);
        }
      }
    }

    void loadShellUser();
    return () => controller.abort();
  }, []);

  return (
    <>
      <NavSwitch role={shellUser.role} userName={shellUser.userName} />
      <Suspense fallback={null}>
        <Header appShell userName={shellUser.userName} />
      </Suspense>
    </>
  );
}

export default AppChrome;
