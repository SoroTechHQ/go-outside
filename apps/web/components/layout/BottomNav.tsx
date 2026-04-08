"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MagnifyingGlass, Ticket, UserCircle } from "@phosphor-icons/react";

type BottomNavRole = "attendee" | "organizer" | "admin";

type BottomNavProps = {
  role?: BottomNavRole;
};

type BottomNavItem = {
  href: string;
  icon: typeof House;
  label: string;
};

export function BottomNav({ role = "attendee" }: BottomNavProps) {
  const pathname = usePathname();
  const items: BottomNavItem[] = [
    { href: "/", icon: House, label: "Home" },
    { href: "/search", icon: MagnifyingGlass, label: "Explore" },
    { href: "/dashboard/tickets", icon: Ticket, label: "Tickets" },
    { href: "/dashboard/profile", icon: UserCircle, label: "Me" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 rounded-[28px] border border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.95)] px-3 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-md md:hidden">
      <div className="flex min-h-[56px] items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              className={`flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition ${
                active ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"
              }`}
              href={item.href}
            >
              <Icon size={20} weight={active ? "fill" : "regular"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
