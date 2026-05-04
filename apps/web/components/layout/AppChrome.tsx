"use client";

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import Header from "./Header";
import NavSwitch from "./NavSwitch";
import { useAppBootstrap } from "../../hooks/useAppBootstrap";

export function AppChrome() {
  const { data } = useAppBootstrap();
  const { user: clerkUser } = useUser();

  const clerkName = [clerkUser?.firstName?.trim(), clerkUser?.lastName?.trim()]
    .filter(Boolean)
    .join(" ");

  const shellUser = data?.shellUser ?? {
    role: "attendee" as const,
    userName: clerkName,
    avatarUrl: clerkUser?.imageUrl ?? null,
  };

  return (
    <>
      <NavSwitch role={shellUser.role} userName={shellUser.userName} avatarUrl={shellUser.avatarUrl} username={shellUser.username} email={shellUser.email} />
      <Suspense fallback={null}>
        <Header appShell userName={shellUser.userName} />
      </Suspense>
    </>
  );
}

export default AppChrome;
