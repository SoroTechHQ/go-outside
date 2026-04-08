"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@gooutside/demo-data";
import { AppIcon } from "./icon";
import { cn } from "../lib/cn";

export function SidebarNav({
  title,
  subtitle,
  links,
}: {
  title: string;
  subtitle: string;
  links: NavLink[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[290px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 lg:block">
      <div className="mb-10 border-b border-[var(--border-subtle)] pb-6">
        <div className="font-display text-3xl italic text-[var(--text-primary)]">{title}</div>
        <div className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</div>
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {active ? <span className="absolute left-0 top-3 h-8 w-1 rounded-full bg-[var(--neon)]" /> : null}
              {link.iconKey ? <AppIcon className={active ? "text-[var(--neon)]" : ""} name={link.iconKey} size={20} weight="bold" /> : null}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
