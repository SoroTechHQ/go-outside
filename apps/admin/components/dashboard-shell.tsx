"use client";

import type { ReactNode } from "react";
import { useSidebar } from "../context/SidebarContext";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function DashboardShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: "admin" | "organizer";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const sidebarWidth =
    isMobileOpen || isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <AppSidebar mode={mode} />
      <div className={`transition-all duration-300 ease-in-out ${sidebarWidth}`}>
        <AppHeader title={title} subtitle={subtitle} />
        <main className="mx-auto max-w-[1500px] p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
