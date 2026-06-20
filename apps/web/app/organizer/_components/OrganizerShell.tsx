"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  ChartBar,
  ChatCircle,
  ChatsCircle,
  Hash,
  MapTrifold,
  MegaphoneSimple,
  MoonStars,
  NotePencil,
  PencilSimple,
  Plus,
  QrCode,
  Sparkle,
  Star,
  SunDim,
  Ticket,
  UsersThree,
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

function buildNavGroups(): Array<{ label: string; items: ShellItem[] }> {
  return [
    {
      label: "Workspace",
      items: [
        { href: "/organizer",          label: "Dashboard",       icon: ChartBar     },
        { href: "/organizer/calendar", label: "Content Calendar",icon: CalendarBlank },
        { href: "/organizer/events",   label: "My Events",       icon: Ticket       },
        { href: "/organizer/scan",     label: "Scan Tickets",    icon: QrCode       },
      ],
    },
    {
      label: "Growth",
      items: [
        { href: "/organizer/analytics", label: "Analytics",  icon: ChartBar        },
        { label: "Ad Manager", icon: MegaphoneSimple, badge: "Soon" },
        { href: "/organizer/hashtags",  label: "Hashtags",   icon: Hash            },
      ],
    },
    {
      label: "Live",
      items: [
        { href: "/organizer/live", label: "Live Attendees", icon: MapTrifold },
      ],
    },
    {
      label: "Community",
      items: [
        { href: "/dashboard/messages",           label: "Messages", icon: ChatsCircle },
        { href: "/organizer/community/comments", label: "Comments", icon: ChatCircle  },
        { href: "/organizer/community/posts",    label: "Posts",    icon: Star        },
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
      ? "bg-[var(--brand)]/10 text-[var(--brand)] font-semibold"
      : item.href || item.onClick
      ? "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
      : "cursor-default text-[var(--text-tertiary)]"
  }`;

  const content = iconOnly ? (
    <span title={item.label}>
      <Icon size={18} weight={active ? "fill" : "regular"} />
    </span>
  ) : (
    <>
      <Icon size={18} weight={active ? "fill" : "regular"} />
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

  if (!item.href) return <div className={baseClass}>{content}</div>;

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
      {theme === "dark" ? <SunDim size={18} /> : <MoonStars size={18} />}
      {!iconOnly && (theme === "dark" ? "Light mode" : "Dark mode")}
    </button>
  );
}

function OrganizerSidebarProfile({
  organizer,
  followerCount,
  iconOnly,
}: {
  organizer: OrganizerDashboardData["organizer"] | null;
  followerCount?: number;
  iconOnly: boolean;
}) {
  if (!organizer) return null;

  if (iconOnly) {
    return (
      <div className="mt-3 flex justify-center">
        <div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          title={organizer.name}
        >
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
    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            {organizer.logoUrl ? (
              <Image src={organizer.logoUrl} alt={organizer.name} fill className="object-cover" />
            ) : (
              <span className="text-[14px] font-black text-[var(--brand)]">
                {organizer.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
              {organizer.name}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              {organizer.city || "Accra"}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/profile"
          className="shrink-0 rounded-lg border border-[var(--border-subtle)] p-1.5 text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
          title="Edit profile"
        >
          <PencilSimple size={12} />
        </Link>
      </div>

      {/* Badge row */}
      <div className="mt-2.5 flex items-center gap-2">
        {organizer.verified ? (
          <OrganizerBadge compact />
        ) : (
          <span className="inline-flex items-center rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Pending
          </span>
        )}
      </div>

      {/* Mini stats row */}
      <div className="mt-3 grid grid-cols-2 divide-x divide-[var(--border-subtle)] rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="flex flex-col items-center py-2">
          <p className="text-[15px] font-bold tabular-nums leading-none text-[var(--text-primary)]">
            {organizer.totalEvents}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Events
          </p>
        </div>
        <div className="flex flex-col items-center py-2">
          <p className="text-[15px] font-bold tabular-nums leading-none text-[var(--text-primary)]">
            {followerCount ?? 0}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Followers
          </p>
        </div>
      </div>
    </div>
  );
}

export function OrganizerShell({
  children,
  organizerName,
  verified,
  organizer,
  ownEvents = [],
  followerCount,
}: {
  children: ReactNode;
  organizerName: string;
  verified: boolean;
  organizer?: OrganizerDashboardData["organizer"] | null;
  ownEvents?: OwnEvent[];
  followerCount?: number;
}) {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const NAV_GROUPS = buildNavGroups();
  const { sidebarWidth, handleMouseDown } = useResizableSidebar({
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 420,
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
      <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-elevated)] md:pl-[72px]">
        <div className="flex h-full w-full">
          {/* Sidebar */}
          <aside
            className="hidden h-full flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-card)] md:flex"
            style={{ width: sidebarWidth, position: "relative", flexShrink: 0 }}
          >
            <div className={`flex h-full flex-col ${iconOnly ? "px-2 py-5" : "px-4 py-5"}`}>

              {/* Back to feed */}
              <Link
                className={`mb-4 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] ${iconOnly ? "justify-center" : ""}`}
                href="/home"
                title={iconOnly ? "Back to feed" : undefined}
              >
                <ArrowLeft size={14} weight="bold" />
                {!iconOnly && "Back to feed"}
              </Link>

              {/* Brand header */}
              <div className={`flex items-center gap-2.5 ${iconOnly ? "justify-center" : "px-1"}`}>
                <Image
                  src="/logo-mini.png"
                  alt="GoOutside"
                  width={30}
                  height={30}
                  className="shrink-0"
                  style={{ objectFit: "contain", borderRadius: "7px" }}
                />
                {!iconOnly && (
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold leading-none text-[var(--text-primary)]">GoOutside</p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                      Organizer Studio
                    </p>
                  </div>
                )}
              </div>

              {/* Profile card */}
              <div className="mt-4">
                {organizer ? (
                  <OrganizerSidebarProfile
                    organizer={organizer}
                    followerCount={followerCount}
                    iconOnly={iconOnly}
                  />
                ) : (
                  !iconOnly && (
                    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                      <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{organizerName}</p>
                      <div className="mt-2">
                        {verified ? (
                          <OrganizerBadge compact />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Primary CTAs — New Event + Create Post */}
              {!iconOnly && (
                <div className="mt-4 space-y-2">
                  <Link
                    href="/organizer/events/new"
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--brand)] px-3 py-2.5 text-[13px] font-semibold text-black shadow-[0_4px_14px_rgba(47,143,69,0.28)] transition hover:opacity-90 active:scale-[0.98]"
                  >
                    <Sparkle size={14} weight="fill" />
                    New Event
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPostModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-[var(--brand)] bg-[var(--brand)]/10 px-3 py-2.5 text-[13px] font-bold text-[var(--brand)] shadow-[0_0_16px_rgba(47,143,69,0.22)] transition hover:bg-[var(--brand)]/18 hover:shadow-[0_0_24px_rgba(47,143,69,0.35)] active:scale-[0.98]"
                  >
                    <NotePencil size={14} weight="bold" />
                    Create Post
                  </button>
                </div>
              )}
              {iconOnly && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Link
                    href="/organizer/events/new"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-black shadow-[0_4px_14px_rgba(47,143,69,0.28)] transition hover:opacity-90"
                    title="New Event"
                  >
                    <Plus size={16} weight="bold" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPostModalOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--brand)] text-[var(--brand)] shadow-[0_0_12px_rgba(47,143,69,0.2)] transition hover:bg-[var(--brand)]/10"
                    title="Create Post"
                  >
                    <NotePencil size={16} weight="bold" />
                  </button>
                </div>
              )}

              {/* Next up */}
              {!iconOnly && ownEvents.length > 0 && (
                <div className="mt-4">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Next up
                  </p>
                  <Link
                    href={`/organizer/events/${ownEvents[0]!.id}`}
                    className="mt-1.5 flex items-center gap-3 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 transition hover:border-[var(--brand)]/30"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--brand)]/12 text-[var(--brand)]">
                      <CalendarBlank size={14} weight="fill" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold leading-snug text-[var(--text-primary)]">
                        {ownEvents[0]!.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        {ownEvents[0]!.date ?? "No date set"}
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {/* Nav groups */}
              <div className="mt-5 space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    {!iconOnly && (
                      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                        {group.label}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavItem key={item.label} item={item} iconOnly={iconOnly} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Followers link — visible when not icon-only */}
              {!iconOnly && (
                <div className="mt-4">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  >
                    <UsersThree size={18} />
                    <span>Followers</span>
                    {followerCount != null && followerCount > 0 && (
                      <span className="ml-auto rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--text-tertiary)]">
                        {followerCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Theme toggle */}
              <div className="mt-auto pt-4">
                <div className="border-t border-[var(--border-subtle)] pt-3">
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
