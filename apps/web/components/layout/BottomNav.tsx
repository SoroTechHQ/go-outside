"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircleDots, House, TrendUp, UserCircle, Wallet } from "@phosphor-icons/react";

type BottomNavRole = "attendee" | "organizer" | "admin";

type BottomNavProps = {
  role?: BottomNavRole;
};

type BottomNavItem = {
  href: string;
  icon: typeof House;
  label: string;
  unread?: boolean;
};

export function BottomNav({ role = "attendee" }: BottomNavProps) {
  const pathname = usePathname();

  // Full-screen pages that manage their own layout
  if (pathname === "/dashboard/messages") return null;

  const items: BottomNavItem[] = [
    { href: "/", icon: House, label: "Home" },
    { href: "/dashboard/messages", icon: ChatCircleDots, label: "Messages", unread: true },
    { href: "/dashboard/wallets", icon: Wallet, label: "Wallets" },
    { href: "/dashboard/saved", icon: TrendUp, label: "Activity" },
    { href: "/dashboard/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 rounded-[var(--radius-card-lg)] border border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.95)] px-3 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-md md:hidden">
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
              className={`relative flex min-w-[60px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                active ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"
              }`}
              href={item.href}
            >
              <Icon size={20} weight={active ? "fill" : "regular"} />
              <span>{item.label}</span>
              {item.unread ? <span className="absolute right-3 top-2 h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
