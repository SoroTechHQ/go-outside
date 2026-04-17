"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircleDots, Fire, House, TrendUp, UserCircle, Wallet } from "@phosphor-icons/react";

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

  const items: BottomNavItem[] = [
    { href: "/", icon: House, label: "Home" },
    { href: "/dashboard/trending", icon: Fire, label: "Trending" },
    { href: "/dashboard/messages", icon: ChatCircleDots, label: "Messages", unread: true },
    { href: "/dashboard/wallets", icon: Wallet, label: "Wallets" },
    { href: "/dashboard/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)] md:hidden">
      <div
        className="flex items-center justify-around px-1"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              className="relative flex flex-1 flex-col items-center pt-2.5"
              href={item.href}
            >
              {/* Animated active pill */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute top-1.5 h-8 w-12 rounded-full bg-[var(--brand-dim)]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </AnimatePresence>

              <motion.span
                className="relative z-10 flex flex-col items-center gap-0.5 pb-1"
                animate={{ scale: active ? 1 : 0.92, opacity: active ? 1 : 0.62 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon
                  size={21}
                  weight={active ? "fill" : "regular"}
                  className={`transition-colors duration-150 ${
                    active ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-150 ${
                    active ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {item.label}
                </span>
              </motion.span>

              {/* Unread dot */}
              {item.unread && !active ? (
                <span className="absolute right-[calc(50%-16px)] top-2 h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
