"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarBlank,
  GearSix,
  HeartStraight,
  House,
  Plus,
  Ticket,
  UserCircle,
} from "@phosphor-icons/react";

type SidebarRole = "attendee" | "organizer" | "admin";

type SidebarProps = {
  role?: SidebarRole;
  userName?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof House;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ role = "attendee", userName = "Kofi Mensah" }: SidebarProps) {
  const pathname = usePathname();
  const mainItems: NavItem[] =
    role === "organizer" || role === "admin"
      ? [
          { href: "/", label: "Home", icon: House },
          { href: "/organizer", label: "My Events", icon: CalendarBlank },
          { href: "/organizer/events/new", label: "Create Event", icon: Plus },
          { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
          { href: "/dashboard/saved", label: "Saved", icon: HeartStraight },
        ]
      : [
          { href: "/", label: "Home", icon: House },
          { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
          { href: "/dashboard/saved", label: "Saved", icon: HeartStraight },
          { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
        ];

  const utilityItems: NavItem[] = [
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/profile", label: "Settings", icon: GearSix },
  ];

  const renderItem = (item: NavItem) => {
    const active =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-[rgba(var(--brand-rgb),0.12)] text-[var(--brand)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
        }`}
        href={item.href}
      >
        <Icon size={22} weight={active ? "bold" : "regular"} />
        <span className="truncate lg:block xl:w-0 xl:overflow-hidden xl:opacity-0 xl:transition-all xl:duration-200 xl:group-hover:w-auto xl:group-hover:opacity-100">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside className="group fixed left-0 top-0 z-40 hidden h-screen overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 pb-6 pt-20 backdrop-blur lg:block lg:w-60 xl:w-[72px] xl:hover:w-60">
      <div className="flex h-full flex-col gap-6">
        <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto">
          {mainItems.map(renderItem)}

          <div className="my-5 border-t border-[var(--border-subtle)]" />

          {utilityItems.map(renderItem)}
        </nav>

        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 lg:block xl:w-0 xl:overflow-hidden xl:opacity-0 xl:transition-all xl:duration-200 xl:group-hover:w-auto xl:group-hover:opacity-100">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
              <span className="mt-1 inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
