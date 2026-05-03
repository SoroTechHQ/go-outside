"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarPlus,
  ChartBar,
  ChatCircleDots,
  Fire,
  House,
  UserCircle,
  Wallet,
} from "@phosphor-icons/react";

type BottomNavRole = "attendee" | "organizer" | "admin";
type BottomNavProps = { role?: BottomNavRole };

type BottomNavItem = {
  href:   string;
  icon:   typeof House;
  label:  string;
  badge?: number;
};

// Reads unread count from a global event dispatched by the Stream chat client.
// The messages page fires `stream:unread` CustomEvent when the count changes.
function useStreamUnread() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<number>).detail ?? 0;
      setUnread(count);
    };
    window.addEventListener("stream:unread", handler);
    return () => window.removeEventListener("stream:unread", handler);
  }, []);

  return unread;
}

export function BottomNav({ role = "attendee" }: BottomNavProps) {
  const pathname   = usePathname();
  const msgUnread  = useStreamUnread();

  const items: BottomNavItem[] = [
    { href: "/",          icon: House,         label: "Home" },
    { href: "/trending",  icon: Fire,          label: "Trending" },
    { href: "/host/new",  icon: CalendarPlus,  label: "Host" },
    { href: "/messages",  icon: ChatCircleDots, label: "Messages", badge: msgUnread },
    { href: "/profile",   icon: UserCircle,    label: "Profile" },
  ];

  if (role === "organizer" || role === "admin") {
    items.push({ href: "/organizer", icon: ChartBar, label: "Org" });
  }

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)] md:hidden">
      <div
        className="flex items-center justify-around gap-0.5 px-1"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname === "/home"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              className="relative flex min-w-0 flex-1 flex-col items-center pt-2.5"
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
                  className={`max-w-full truncate text-[9px] font-medium transition-colors duration-150 ${
                    active ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {item.label}
                </span>
              </motion.span>

              {/* Unread badge */}
              {item.badge && item.badge > 0 && !active ? (
                <span className="absolute right-[calc(50%-18px)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5FBF2A] px-1 text-[8px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
