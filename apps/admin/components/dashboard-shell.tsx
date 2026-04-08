import type { ReactNode } from "react";
import { demoData } from "@gooutside/demo-data";
import { DashboardTopbar, SidebarNav } from "@gooutside/ui";

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
  const links =
    mode === "admin" ? demoData.navigation.adminLinks : demoData.navigation.organizerLinks;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] lg:grid lg:grid-cols-[290px,1fr]">
      <SidebarNav
        links={links}
        subtitle={mode === "admin" ? demoData.adminDashboard.roleLabel : demoData.organizerDashboard.roleLabel}
        title="GoOutside"
      />
      <div>
        <DashboardTopbar
          searchLabel={mode === "admin" ? "Search platform activity" : "Search events and attendees"}
          subtitle={subtitle}
          title={title}
        />
        <div className="mx-auto max-w-[1500px] p-5 md:p-8">{children}</div>
      </div>
    </div>
  );
}
