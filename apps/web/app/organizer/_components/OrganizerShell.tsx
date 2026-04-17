"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, ChartBar, Hash, NotePencil, Ticket } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import OrganizerBadge from "./OrganizerBadge";

type ShellItem = {
  href?: string;
  label: string;
  icon: typeof ChartBar;
  badge?: string;
};

const NAV_GROUPS: Array<{ label: string; items: ShellItem[] }> = [
  {
    label: "Workspace",
    items: [
      { href: "/organizer", label: "Dashboard", icon: ChartBar },
      { href: "/organizer/calendar", label: "Content Calendar", icon: CalendarBlank },
      { href: "/organizer/events", label: "My Events", icon: Ticket },
      { href: "/organizer/create-post", label: "Create Post", icon: NotePencil },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/organizer/analytics", label: "Analytics", icon: ChartBar },
      { label: "Ad Manager", icon: ChartBar, badge: "Soon" },
      { href: "/organizer/hashtags", label: "Hashtags", icon: Hash },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/messages", label: "Messages", icon: NotePencil },
      { label: "Comments", icon: NotePencil, badge: "Soon" },
      { label: "Snippets", icon: NotePencil, badge: "Soon" },
    ],
  },
];

function NavItem({ item }: { item: ShellItem }) {
  const pathname = usePathname();
  const active = item.href
    ? item.href === "/organizer"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

  const Icon = item.icon;
  const className = `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
    active
      ? "bg-[var(--brand)]/10 text-[var(--brand)]"
      : item.href
      ? "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
      : "cursor-default text-[var(--text-tertiary)]"
  }`;

  const content = (
    <>
      <Icon size={16} weight={active ? "fill" : "regular"} />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (!item.href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link className={className} href={item.href}>
      {content}
    </Link>
  );
}

export function OrganizerShell({
  children,
  organizerName,
  verified,
}: {
  children: ReactNode;
  organizerName: string;
  verified: boolean;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[0_30px_90px_rgba(4,12,8,0.16)] xl:h-[calc(100dvh-7.75rem)] xl:min-h-[760px]">
      <div className="grid min-h-[calc(100dvh-6.5rem)] md:min-h-[calc(100dvh-7rem)] xl:h-full xl:min-h-0 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 xl:h-full xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)]/15 text-lg font-bold text-[var(--brand)]">
              G
            </div>
            <div>
              <p className="font-display text-[1.1rem] italic text-[var(--text-primary)]">GoOutside</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                Organizer
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{organizerName}</p>
            <div className="mt-2">
              {verified ? <OrganizerBadge compact /> : <span className="text-[12px] text-[var(--text-secondary)]">Organizer tools available after approval</span>}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <NavItem key={item.label} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 bg-[var(--bg-elevated)] xl:h-full xl:overflow-y-auto">
          {children}
        </section>
      </div>
    </div>
  );
}

export default OrganizerShell;
