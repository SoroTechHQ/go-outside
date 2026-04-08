"use client";

import { Suspense } from "react";
import { demoData } from "@gooutside/demo-data";
import Header from "./Header";
import NavSwitch from "./NavSwitch";

export function AppChrome() {
  return (
    <>
      <NavSwitch role="attendee" userName={demoData.attendee.name} />
      <Suspense fallback={null}>
        <Header appShell userName={demoData.attendee.name} />
      </Suspense>
    </>
  );
}

export default AppChrome;
