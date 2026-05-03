"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  ChartBar,
  ChatCircle,
  Hash,
  MoonStars,
  NotePencil,
  PencilSimple,
  Plus,
  Star,
  SunDim,
  Ticket,
} from "@phosphor-icons/react";
import OrganizerBadge from "./OrganizerBadge";
import { CreatePostModal } from "./CreatePostModal";
import { useResizableSidebar } from "../../../hooks/useResizableSidebar";
import type { OrganizerDashboardData } from "../_lib/dashboard";

type OwnEvent = { id: string; title: string; date: string | null; slug: string };

type ShellItem = {
  href?: string;
  label: string;
  icon: typeof ChartBar;
  badge?: string;
  onClick?: () => void;
};

function buildNavGroups(openPostModal: () => void): Array<{ label: string; items: ShellItem[] }> {
  return [
    {
      label: "Workspace",
      items: [
        { href: "/organizer", label: "Dashboard", icon: ChartBar },
        { href: "/organizer/calendar", label: "Content Calendar", icon: CalendarBlank },
        { href: "/organizer/events", label: "My Events", icon: Ticket },
        { label: "Create Post", icon: NotePencil, onClick: openPostModal },
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
        { href: "/organizer/community/comments", label: "Comments", icon: ChatCircle },
        { href: "/organizer/community/snippets", label: "Snippets", icon: Star },
      ],
    },
  ];
}

function NavItem({ item, iconOnly }: { item: ShellItem; iconOnly: boolean }) {
  const pathname = usePathname();
  const active = item.href
    ? item.href === "/organizer"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

  const isSoon = item.badge === "Soon" && !item.href && !item.onClick;

  const Icon = item.icon;

  const baseClass = `relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
    isSoon
      ? "cursor-not-allowed opacity-40"
      : active
      ? "bg-[var(--brand)]/10 text-[var(--brand)] border-l-2 border-[var(--brand)] font-semibold"
      : item.href || item.onClick
      ? "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
      : "cursor-default text-[var(--text-tertiary)]"
  }`;

  const content = iconOnly ? (
    <span title={item.label}>
      <Icon size={16} weight={active ? "fill" : "regular"} />
    </span>
  ) : (
    <>
      <Icon size={16} weight={active ? "fill" : "regular"} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (isSoon) return <div className={baseClass}>{content}</div>;

  if (item.onClick) {
    return (
      <button className={baseClass} onClick={item.onClick} type="button">
        {content}
      </button>
    );
  }

  if (!item.href) {
    return <div className={baseClass}>{content}</div>;
  }

  return (
    <Link className={baseClass} href={item.href}>
      {content}
    </Link>
  );
}

function ThemeToggle({ iconOnly }: { iconOnly: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("gooutside-theme");
    const current = document.documentElement.dataset.theme;
    const resolved = (saved ?? current ?? "light") as "light" | "dark";
    setTheme(resolved);
    document.documentElement.dataset.theme = resolved;
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("gooutside-theme", next);
    setTheme(next);
  }

  return (
    <button
      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
      onClick={toggle}
      type="button"
      title={iconOnly ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
    >
      {theme === "dark" ? <SunDim size={16} /> : <MoonStars size={16} />}
      {!iconOnly && (theme === "dark" ? "Light mode" : "Dark mode")}
    </button>
  );
}

function OrganizerSidebarProfile({
  organizer,
  iconOnly,
}: {
  organizer: OrganizerDashboardData["organizer"] | null;
  iconOnly: boolean;
}) {
  if (!organizer) return null;

  if (iconOnly) {
    return (
      <div className="mt-5 flex justify-center">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border-subtle)] bg-[var(--bg-card)]" title={organizer.name}>
          {organizer.logoUrl ? (
            <Image src={organizer.logoUrl} alt={organizer.name} fill className="object-cover" />
          ) : (
            <span className="text-[14px] font-black text-[var(--brand)]">
              {organizer.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border-subtle)] bg-[var(--bg-card)]">
            {organizer.logoUrl ? (
              <Image src={organizer.logoUrl} alt={organizer.name} fill className="object-cover" />
            ) : (
              <span className="text-[14px] font-black text-[var(--brand)]">
                {organizer.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
              {organizer.name}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              {organizer.city} · {organizer.totalEvents} event{organizer.totalEvents !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link
          href="/organizer"
          className="shrink-0 rounded-full border border-[var(--border-subtle)] p-1.5 text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
          title="Edit profile"
        >
          <PencilSimple size={11} />
        </Link>
      </div>

      <div className="mt-3">
        {organizer.verified ? (
          <OrganizerBadge compact />
        ) : (
          <span className="inline-flex items-center rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Pending approval
          </span>
        )}
      </div>

      {organizer.bio && (
        <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {organizer.bio}
        </p>
      )}

      {organizer.socialLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {organizer.socialLinks.slice(0, 3).map((link) => (
            <a
              key={link.label}
              href={link.href.startsWith("http") ? link.href : `https://${link.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--brand)] hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganizerShell({
  children,
  organizerName,
  verified,
  organizer,
  ownEvents = [],
}: {
  children: ReactNode;
  organizerName: string;
  verified: boolean;
  organizer?: OrganizerDashboardData["organizer"] | null;
  ownEvents?: OwnEvent[];
}) {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const NAV_GROUPS = buildNavGroups(() => setPostModalOpen(true));
  const { sidebarWidth, handleMouseDown } = useResizableSidebar({
    defaultWidth: 272,
    minWidth: 200,
    maxWidth: 340,
    storageKey: "organizer_sidebar_width",
  });

  const iconOnly = sidebarWidth < 220;

  return (
    <>
      <CreatePostModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        organizerName={organizer?.name ?? organizerName}
        ownEvents={ownEvents}
      />
      <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-elevated)]">
        <div className="flex h-full w-full" style={{ display: "flex" }}>
          {/* Sidebar */}
          <aside
            className="hidden h-full flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-card)] md:flex"
            style={{ width: sidebarWidth, position: "relative", flexShrink: 0 }}
          >
            <div className={`flex h-full flex-col ${iconOnly ? "px-2 py-5" : "p-5"}`}>
              {/* Back to feed */}
              <Link
                className={`mb-4 flex items-center gap-2 rounded-xl px-2 py-1.5 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] ${iconOnly ? "justify-center" : ""}`}
                href="/home"
                title={iconOnly ? "Back to feed" : undefined}
              >
                <ArrowLeft size={14} weight="bold" />
                {!iconOnly && "Back to feed"}
              </Link>

              {/* Brand header */}
              <div className={`flex items-center gap-2.5 ${iconOnly ? "justify-center" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/15">
                  <span className="text-sm font-bold text-[var(--brand)]">G</span>
                </div>
                {!iconOnly && (
                  <div>
                    <p className="text-[13px] font-bold text-[var(--text-primary)]">GoOutside</p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Organizer Studio
                    </p>
                  </div>
                )}
              </div>

              {/* Organizer identity card */}
              <div className="mt-5">
                {organizer ? (
                  <OrganizerSidebarProfile organizer={organizer} iconOnly={iconOnly} />
                ) : (
                  !iconOnly && (
                    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                      <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{organizerName}</p>
                      <div className="mt-2">
                        {verified ? (
                          <OrganizerBadge compact />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            Pending approval
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Quick actions */}
              {!iconOnly && (
                <div className="mt-5">
                  <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Quick actions
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      href="/organizer/events/new"
                      className="flex flex-col items-center gap-1.5 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-3 text-[11px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:scale-[1.01] hover:border-[var(--brand)]/30 hover:text-[var(--brand)] hover:shadow-md active:scale-[0.99]"
                    >
                      <Plus size={15} weight="bold" />
                      New Event
                    </Link>
                    <Link
                      href="/organizer/create-post"
                      className="flex flex-col items-center gap-1.5 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-3 text-[11px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:scale-[1.01] hover:border-[var(--brand)]/30 hover:text-[var(--brand)] hover:shadow-md active:scale-[0.99]"
                    >
                      <NotePencil size={15} />
                      Create Post
                    </Link>
                  </div>
                </div>
              )}

              {/* Nav groups */}
              <div className="mt-6 space-y-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    {!iconOnly && (
                      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        {group.label}
                      </p>
                    )}
                    <div className="mt-2 space-y-0.5">
                      {group.items.map((item) => (
                        <NavItem key={item.label} item={item} iconOnly={iconOnly} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dark mode toggle */}
              <div className="mt-auto pt-6">
                <div className="border-t border-[var(--border-subtle)] pt-4">
                  <ThemeToggle iconOnly={iconOnly} />
                </div>
              </div>
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors hover:bg-[var(--brand)]/40 active:bg-[var(--brand)]"
              style={{ zIndex: 10 }}
            />
          </aside>

          {/* Main content */}
          <section className="h-full min-w-0 flex-1 overflow-y-auto bg-[var(--bg-elevated)]">
            {/* Mobile top bar */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 md:hidden">
              <Link
                className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]"
                href="/home"
              >
                <ArrowLeft size={16} weight="bold" />
                Feed
              </Link>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Organizer Studio</p>
              <div className="w-14" />
            </div>
            {children}
          </section>
        </div>
      </div>
    </>
  );
}

export default OrganizerShell;
