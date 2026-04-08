"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@gooutside/demo-data";
import { AppIcon } from "./icon";

export function MobileBottomNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-30 rounded-[28px] border border-[var(--border-subtle)] bg-[color:var(--bg-card)]/95 px-3 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur lg:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.label} className="flex flex-col items-center gap-1 px-2 py-1" href={link.href}>
              {link.iconKey ? (
                <AppIcon
                  className={active ? "text-[var(--neon)]" : "text-[var(--text-tertiary)]"}
                  name={link.iconKey}
                  size={20}
                  weight={active ? "fill" : "regular"}
                />
              ) : null}
              <span className={`text-[10px] font-semibold ${active ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
                {link.label}
              </span>
              <span className={`h-1 w-1 rounded-full ${active ? "bg-[var(--neon)]" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
