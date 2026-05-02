"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CalendarBlank, ChartBar, Hash, NotePencil, Ticket } from "@phosphor-icons/react";
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
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-elevated)]">
      <div className="flex h-full w-full md:grid md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden h-full flex-col overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 md:flex">
          <Link
            className="mb-4 flex items-center gap-2 rounded-xl px-2 py-1.5 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
            href="/home"
          >
            <ArrowLeft size={14} weight="bold" />
            Back to feed
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/15">
              <span className="text-sm font-bold text-[var(--brand)]">G</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">GoOutside</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Creator Studio</p>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{organizerName}</p>
            <div className="mt-2">
              {verified ? <OrganizerBadge compact /> : (
                <span className="inline-flex items-center rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  Pending approval
                </span>
              )}
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

        <section className="h-full min-w-0 overflow-y-auto bg-[var(--bg-elevated)]">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 md:hidden">
            <Link
              className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]"
              href="/home"
            >
              <ArrowLeft size={16} weight="bold" />
              Feed
            </Link>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Organizer</p>
            <div className="w-14" />
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

export default OrganizerShell;
