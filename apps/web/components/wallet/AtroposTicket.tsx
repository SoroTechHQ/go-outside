"use client";

import Atropos from "atropos/react";
import "atropos/css";
import type { ReactNode } from "react";

export function AtroposTicket({ children }: { children: ReactNode }) {
  return (
    <Atropos
      activeOffset={24}
      shadow
      shadowScale={1.04}
      shadowOffset={40}
      rotateXMax={10}
      rotateYMax={10}
      className="w-full"
    >
      {children}
    </Atropos>
  );
}
