"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Bank,
  CalendarBlank,
  ChartBar,
  Hash,
  List,
  ListChecks,
  MegaphoneSimple,
  NotePencil,
  PencilSimple,
  Plus,
  QrCode,
  Sparkle,
  Ticket,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { Sidebar } from "../../../components/layout/Sidebar";
import OrganizerBadge from "./OrganizerBadge";
import { CreatePostModal } from "./CreatePostModal";
import type { OrganizerDashboardData } from "../_lib/dashboard";

type OwnEvent = { id: string; title: string; date: string | null; slug: string };

// ─── Nav ──────────────────────────────────────────────────────────────────────
const MANAGE_NAV = [
  { href: "/organizer",            label: "Dashboard", icon: ChartBar   },
  { href: "/organizer/events",     label: "Events",    icon: Ticket     },
  { href: "/organizer/orders",     label: "Orders",    icon: ListChecks },
  { href: "/organizer/analytics",  label: "Analytics", icon: ChartBar   },
  { href: "/organizer/hashtags",   label: "Hashtags",  icon: Hash       },
];
const GROW_NAV = [
  { href: "/organizer/marketing",  label: "Marketing",  icon: MegaphoneSimple },
  { href: "/organizer/attendees",  label: "Attendees",  icon: UsersThree      },
];
const ACCOUNT_NAV = [
  { href: "/organizer/settings/profile", label: "Profile & page",  icon: PencilSimple  },
  { href: "/organizer/calendar",         label: "Calendar",         icon: CalendarBlank },
  { href: "/organizer/settings/payouts", label: "Payouts",          icon: Bank          },
];

function isActive(href: string, pathname: string) {
  if (href === "/organizer") return pathname === "/organizer";
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Single nav row ───────────────────────────────────────────────────────────
function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Ticket }) {
  const pathname = usePathname();
  const active = isActive(href, pathname);
  return (
    <Link href={href}>
      <div className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all ${
        active
          ? "bg-[var(--brand)]/10 font-semibold text-[var(--brand)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      }`}>
        <Icon size={18} weight={active ? "fill" : "regular"} className="shrink-0" />
        <span className="flex-1">{label}</span>
        {active && (
          <motion.span
            layoutId="org-active-dot"
            className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
          />
        )}
      </div>
    </Link>
  );
}

// ─── Section group ────────────────────────────────────────────────────────────
function NavGroup({ label, items }: { label: string; items: typeof MANAGE_NAV }) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <div className="space-y-px">
        {items.map(item => <NavItem key={item.href} {...item} />)}
      </div>
    </div>
  );
}

// ─── Organizer profile card ───────────────────────────────────────────────────
function OrgCard({
  organizer,
  followerCount,
}: {
  organizer: OrganizerDashboardData["organizer"] | null;
  followerCount?: number;
}) {
  if (!organizer) return null;
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[var(--bg-muted)]">
          {organizer.logoUrl ? (
            <Image src={organizer.logoUrl} alt={organizer.name} fill className="object-cover" />
          ) : (
            <span className="text-[13px] font-black text-[var(--brand)]">
              {organizer.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="truncate text-[14px] font-bold leading-tight text-[var(--text-primary)]">{organizer.name}</p>
            <OrganizerBadge compact />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">{organizer.city || "Accra, Ghana"}</p>
        </div>
        <Link
          href="/organizer/settings/profile"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
        >
          <PencilSimple size={12} />
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 border-t border-[var(--border-subtle)] pt-3">
        <div className="text-center">
          <p className="text-[14px] font-bold tabular-nums leading-none text-[var(--text-primary)]">{organizer.totalEvents}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">events</p>
        </div>
        <div className="h-6 w-px bg-[var(--border-subtle)]" />
        <div className="text-center">
          <p className="text-[14px] font-bold tabular-nums leading-none text-[var(--text-primary)]">{followerCount ?? 0}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">followers</p>
        </div>
      </div>
    </div>
  );
}

// ─── Organizer sidebar panel ──────────────────────────────────────────────────
function OrgPanel({
  organizer,
  followerCount,
  ownEvents,
  onPostClick,
}: {
  organizer: OrganizerDashboardData["organizer"] | null;
  followerCount?: number;
  ownEvents: OwnEvent[];
  onPostClick: () => void;
}) {
  return (
    <div className="flex h-full w-[270px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="flex h-full flex-col overflow-y-auto overscroll-contain px-3 pb-6 pt-5">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between px-1">
          <div>
            <p className="text-[18px] font-black tracking-[-0.3px] text-[var(--text-primary)]">Studio</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">Organizer workspace</p>
          </div>
          <Link href="/home"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/30 hover:bg-[var(--bg-elevated)] hover:text-[var(--brand)]"
            title="Back to GoOutside"
          >
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Organizer card */}
        <div className="mb-5">
          <OrgCard organizer={organizer} followerCount={followerCount} />
        </div>

        {/* CTAs */}
        <div className="mb-5 space-y-2.5">
          <Link href="/organizer/events/new">
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3.5 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(47,143,69,0.22)] transition hover:opacity-90 active:scale-[0.99]">
              <Sparkle size={16} weight="fill" />
              New Event
            </div>
          </Link>
          {/* Gap between New Event and action row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onPostClick}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 text-[12.5px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/6 hover:text-[var(--brand)]"
            >
              <NotePencil size={15} /> Create Post
            </button>
            <Link href="/organizer/scan"
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 text-[12.5px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/6 hover:text-[var(--brand)]"
            >
              <QrCode size={15} /> Scan
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-[var(--border-subtle)]" />

        {/* Nav groups */}
        <div className="space-y-6">
          <NavGroup label="Manage" items={MANAGE_NAV} />
          <NavGroup label="Grow"   items={GROW_NAV} />
          <NavGroup label="Account" items={ACCOUNT_NAV} />
        </div>

        {/* Next up */}
        {ownEvents.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Next Up</p>
            <Link href={`/organizer/events/${ownEvents[0]!.id}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 transition hover:border-[var(--brand)]/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/10">
                <Ticket size={14} weight="fill" className="text-[var(--brand)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{ownEvents[0]!.title}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">{ownEvents[0]!.date ?? "No date set"}</p>
              </div>
              <ArrowUpRight size={13} className="shrink-0 text-[var(--text-tertiary)]" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────
function MobileDrawer({
  open,
  onClose,
  organizer,
  followerCount,
  ownEvents,
  onPostClick,
}: {
  open: boolean;
  onClose: () => void;
  organizer: OrganizerDashboardData["organizer"] | null;
  followerCount?: number;
  ownEvents: OwnEvent[];
  onPostClick: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col overflow-hidden bg-[var(--bg-card)] shadow-2xl"
            style={{ borderRadius: "0 20px 20px 0" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 42 }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-4">
              <p className="text-[14px] font-bold text-[var(--text-primary)]">Organizer Studio</p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <OrgPanel
                organizer={organizer}
                followerCount={followerCount}
                ownEvents={ownEvents}
                onPostClick={onPostClick}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export function OrganizerShell({
  children,
  organizerName,
  verified,
  organizer,
  ownEvents = [],
  followerCount,
  avatarUrl,
  userName,
}: {
  children: ReactNode;
  organizerName: string;
  verified: boolean;
  organizer?: OrganizerDashboardData["organizer"] | null;
  ownEvents?: OwnEvent[];
  followerCount?: number;
  avatarUrl?: string | null;
  userName?: string;
}) {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  void organizerName; void verified;

  return (
    <>
      <CreatePostModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        organizerName={organizer?.name ?? organizerName}
        ownEvents={ownEvents}
      />

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        organizer={organizer ?? null}
        followerCount={followerCount}
        ownEvents={ownEvents}
        onPostClick={() => { setMobileOpen(false); setPostModalOpen(true); }}
      />

      {/*
        The real GoOutside Sidebar is fixed-positioned (left-0, z-30).
        We render it directly here — it works because CartProvider + AppShellProvider
        are already mounted in the root layout (app/layout.tsx → Providers + AppShellProvider).
        The rest of the shell layout shifts right by 72px (the collapsed sidebar width).
      */}
      <div className="hidden md:block">
        <Sidebar
          role="organizer"
          userName={userName ?? ""}
          avatarUrl={avatarUrl}
        />
      </div>

      {/* Layout: offset by GoOutside sidebar (72px fixed) + organizer panel (270px) */}
      <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-elevated)]">

        {/* Spacer for fixed GoOutside sidebar */}
        <div className="hidden w-[72px] shrink-0 md:block" aria-hidden />

        {/* Organizer panel (desktop) */}
        <div className="hidden md:block">
          <OrgPanel
            organizer={organizer ?? null}
            followerCount={followerCount}
            ownEvents={ownEvents}
            onPostClick={() => setPostModalOpen(true)}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)]"
            >
              <List size={16} />
            </button>
            <div className="flex flex-1 items-center gap-2">
              <Image src="/logo-mini.png" alt="GoOutside" width={20} height={20} style={{ objectFit: "contain", borderRadius: "5px" }} />
              <p className="text-[13px] font-bold text-[var(--text-primary)]">Organizer Studio</p>
            </div>
            <Link href="/organizer/events/new"
              className="flex items-center gap-1 rounded-full bg-[var(--brand)] px-3 py-1.5 text-[11px] font-bold text-white"
            >
              <Plus size={10} weight="bold" /> New
            </Link>
          </div>

          {/* Page scroll area */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-[var(--bg-card)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default OrganizerShell;
