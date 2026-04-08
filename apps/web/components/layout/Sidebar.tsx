"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  HeartStraight,
  HouseLine,
  Ticket,
  UserCircle,
} from "@phosphor-icons/react";
import { useEffect } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAppShell } from "./AppShellContext";

type SidebarRole = "attendee" | "organizer" | "admin";

type SidebarProps = {
  role?: SidebarRole;
  userName?: string;
};

type NavItem = {
  href: string;
  icon: typeof HouseLine;
  label: string;
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
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const { setSidebarWidth } = useAppShell();

  const navItems: NavItem[] =
    role === "organizer" || role === "admin"
      ? [
          { href: "/", label: "Home", icon: HouseLine },
          { href: "/search", label: "Explore", icon: Compass },
          { href: "/dashboard/saved", label: "Saved", icon: HeartStraight },
          { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
          { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
        ]
      : [
          { href: "/", label: "Home", icon: HouseLine },
          { href: "/search", label: "Explore", icon: Compass },
          { href: "/dashboard/saved", label: "Saved", icon: HeartStraight },
          { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
          { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
        ];

  useEffect(() => {
    if (!isTabletUp) {
      setSidebarWidth(0);
      return;
    }

    setSidebarWidth(88);
  }, [isTabletUp, setSidebarWidth]);

  if (!isTabletUp) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] border-r border-white/6 bg-[color:rgba(7,9,11,0.92)] backdrop-blur-xl md:flex md:flex-col">
      <div className="flex h-full flex-col items-center justify-between py-6">
        <div className="flex flex-col items-center gap-6">
          <Link
            aria-label="GoOutside home"
            className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/8 bg-white/[0.03] text-lg font-semibold text-[color:var(--text-primary)]"
            href="/"
          >
            G
          </Link>

          <nav className="flex flex-col gap-3">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  aria-label={item.label}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-[18px] border transition ${
                    active
                      ? "border-[color:rgba(95,191,42,0.2)] bg-[color:rgba(95,191,42,0.12)] text-[color:var(--brand)]"
                      : "border-transparent bg-transparent text-[color:var(--text-tertiary)] hover:border-white/8 hover:bg-white/[0.04] hover:text-[color:var(--text-primary)]"
                  }`}
                  href={item.href}
                >
                  {active ? (
                    <span className="absolute -left-[17px] top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[color:var(--brand)]" />
                  ) : null}
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:rgba(255,255,255,0.38)]">
            Pulse
          </div>
          <Link
            aria-label="Profile"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand)] text-xs font-semibold text-[color:var(--brand-contrast)]"
            href="/dashboard/profile"
            title={userName}
          >
            {getInitials(userName)}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
