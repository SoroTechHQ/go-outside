"use client";

import { Suspense } from "react";
import { demoData } from "@gooutside/demo-data";
import Header from "./Header";
import NavSwitch from "./NavSwitch";
import { useAppBootstrap } from "../../hooks/useAppBootstrap";

export function AppChrome() {
  const { data } = useAppBootstrap();
  const shellUser = data?.shellUser ?? {
    role: "attendee" as const,
    userName: demoData.attendee.name,
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
