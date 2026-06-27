"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowSquareOut,
  ArrowUpRight,
  CalendarBlank,
  CaretDown,
  CaretUp,
  ChartBar,
  ChatsCircle,
  Check,
  CheckCircle,
  Circle,
  Compass,
  Hash,
  Heart,
  Image as ImageIcon,
  MegaphoneSimple,
  NotePencil,
  QrCode,
  Rocket,
  SealCheck,
  ShareNetwork,
  Sparkle,
  Star,
  Ticket,
  TrendUp,
  UsersThree,
  Waves,
  Lightning,
  X,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../../components/ui/dropdown-menu";
import type { OrganizerDashboardData } from "../_lib/dashboard";
import OrganizerBadge from "./OrganizerBadge";
import EventCardMini from "./EventCardMini";

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────── */

type Tab = "Overview" | "Events" | "Audience" | "Ad Campaigns" | "Posts & Reels";
const TABS: Tab[] = ["Overview", "Events", "Audience", "Ad Campaigns", "Posts & Reels"];

type Period = "7d" | "30d" | "90d";
const PERIOD_LABELS: Record<Period, string> = {
  "7d":  "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

/* ─────────────────────────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat("en-GH", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
function money(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─────────────────────────────────────────────────────────────────────────
   PERIOD PICKER
───────────────────────────────────────────────────────────────────────── */

function PeriodPicker({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-[12px] font-semibold text-[var(--text-secondary)] shadow-sm transition hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]">
          {PERIOD_LABELS[period]}
          <CaretDown size={10} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Time period</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <DropdownMenuItem key={key} className="flex items-center justify-between gap-3" onSelect={() => onChange(key)}>
            <span>{label}</span>
            {period === key && <Check size={12} weight="bold" className="text-[var(--brand)]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   METRIC CARD  — accent-line at top, big number, delta pill
───────────────────────────────────────────────────────────────────────── */

function MetricCard({
  label, value, delta, icon, accent = "#2f8f45",
}: {
  label: string; value: string; delta: string; icon: ReactNode; accent?: string;
}) {
  const isPositive = delta.startsWith("+") || delta.toLowerCase().includes("up");
  const isNeutral  = delta === "—" || delta === "" || delta.startsWith("No");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_2px_12px_rgba(5,12,8,0.06)]"
    >
      {/* Top accent */}
      <div className="h-[3px] w-full" style={{ background: accent }} />

      <div className="p-5">
        {/* Icon + delta row */}
        <div className="flex items-center justify-between">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${accent}1a`, color: accent }}
          >
            {icon}
          </span>
          {!isNeutral && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isPositive
                  ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "bg-rose-500/10 text-rose-500"
              }`}
            >
              {isPositive ? <CaretUp size={9} weight="bold" /> : <CaretDown size={9} weight="bold" />}
              {delta.replace(/^\+/, "")}
            </span>
          )}
        </div>

        {/* Value */}
        <p className="mt-5 text-[2.4rem] font-bold tabular-nums leading-none tracking-tight text-[var(--text-primary)]">
          {value}
        </p>

        {/* Label */}
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          {label}
        </p>

        {/* Delta note */}
        {isNeutral && (
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{delta}</p>
        )}
      </div>

      {/* Subtle bg blob */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full opacity-[0.06]"
        style={{ background: accent }}
      />
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   BAR CHART  — with gridlines + animated bars
───────────────────────────────────────────────────────────────────────── */

function BarChart({ series }: { series: Array<{ label: string; value: number }> }) {
  const allZero = series.every((s) => s.value === 0);
  const max     = Math.max(...series.map((s) => s.value), 1);
  const gridPcts = [25, 50, 75, 100];

  if (allZero) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--text-tertiary)]">
          <Ticket size={22} weight="thin" />
        </span>
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">No sales yet</p>
        <p className="max-w-[200px] text-center text-[12px] text-[var(--text-secondary)]">
          Ticket sales appear here once your first purchase comes in.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-48">
      {/* Gridlines */}
      {gridPcts.map((pct) => (
        <div
          key={pct}
          className="absolute left-0 right-0 border-t border-dashed border-[var(--border-subtle)]"
          style={{ bottom: `${pct}%` }}
        />
      ))}

      {/* Bars */}
      <div className="absolute inset-0 flex items-end gap-2 pb-7">
        {series.map((point, i) => {
          const h = Math.max(4, Math.round((point.value / max) * 100));
          const isMax = point.value === max;
          return (
            <div key={`${point.label}-${i}`} className="group flex flex-1 flex-col items-center gap-0">
              {isMax && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-1 rounded-full bg-[var(--brand)]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--brand)]"
                >
                  peak
                </motion.span>
              )}
              <div className="flex w-full items-end" style={{ height: "calc(100% - 28px)" }}>
                <motion.div
                  className="w-full rounded-t-[10px]"
                  style={{
                    background: isMax
                      ? "var(--brand)"
                      : "color-mix(in srgb, var(--brand) 30%, transparent)",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
                />
              </div>
              <div className="mt-1.5 text-center">
                <p className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{point.value}</p>
                <p className="text-[9px] text-[var(--text-tertiary)]">{point.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DONUT
───────────────────────────────────────────────────────────────────────── */

function Donut({ organic, boosted }: { organic: number; boosted: number }) {
  const total = Math.max(organic + boosted, 1);
  const pct   = Math.round((organic / total) * 100);
  const c     = 2 * Math.PI * 36;
  const seg   = (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-5">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--bg-muted)" strokeWidth="11" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--brand)"   strokeDasharray={`${seg} ${c - seg}`}   strokeLinecap="round" strokeWidth="11" />
        {boosted > 0 && (
          <circle cx="50" cy="50" r="36" fill="none" stroke="#d946ef" strokeDasharray={`${c - seg} ${seg}`} strokeDashoffset={-seg} strokeLinecap="round" strokeWidth="11" />
        )}
        <g transform="rotate(90 50 50)">
          <text x="50" y="46" fill="currentColor" fontFamily="inherit" fontSize="17" fontWeight="800" textAnchor="middle">{pct}%</text>
          <text x="50" y="60" fill="currentColor" fontSize="8" textAnchor="middle" opacity="0.45">organic</text>
        </g>
      </svg>
      <div className="flex w-full items-center justify-center gap-6 text-[12px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
          Organic · {fmt(organic)}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
          Boosted · {fmt(boosted)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION CARD + HEADER
───────────────────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)] ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  title, sub, icon, action,
}: { title: string; sub?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
            {icon}
          </span>
        )}
        <div>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
          {sub && <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptySlate({ icon, title, body, cta }: { icon: ReactNode; title: string; body: string; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--text-tertiary)]">
        {icon}
      </span>
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1.5 max-w-[260px] text-[12px] leading-relaxed text-[var(--text-secondary)]">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PROGRESS ROW
───────────────────────────────────────────────────────────────────────── */

function ProgressRow({ label, pct, delay = 0 }: { label: string; pct: number; delay?: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-bold tabular-nums text-[var(--text-primary)]">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <motion.div
          className="h-1.5 rounded-full bg-[var(--brand)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ACTIVITY ICON
───────────────────────────────────────────────────────────────────────── */

function ActivityIcon({ tone }: { tone: OrganizerDashboardData["activity"][number]["tone"] }) {
  const map = {
    green:  { Icon: TrendUp,  bg: "rgba(47,143,69,0.12)",   color: "#2f8f45"  },
    purple: { Icon: Sparkle,  bg: "rgba(217,70,239,0.10)",  color: "#d946ef"  },
    amber:  { Icon: Star,     bg: "rgba(245,158,11,0.10)",  color: "#f59e0b"  },
    coral:  { Icon: Heart,    bg: "rgba(244,63,94,0.10)",   color: "#f43f5e"  },
    muted:  { Icon: Waves,    bg: "var(--bg-muted)",        color: "var(--text-tertiary)" },
  } as const;
  const { Icon, bg, color } = map[tone as keyof typeof map] ?? map.muted;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
      <Icon size={14} weight="fill" style={{ color }} />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────────────────────────────────── */

function OverviewTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { overview, salesSeries, recentEvents, hashtags, activity, userPosts } = dashboard;

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard accent="#2f8f45"  label="Ticket Sales"  value={fmt(overview.ticketSales)}   delta={overview.ticketSalesDelta}  icon={<Ticket     size={19} weight="fill" />} />
        <MetricCard accent="#3b82f6"  label="Followers"     value={fmt(overview.followerCount)} delta={overview.followerDelta}     icon={<UsersThree size={19} weight="fill" />} />
        <MetricCard accent="#f59e0b"  label="Revenue"       value={money(overview.revenue)}     delta={overview.revenueDelta}      icon={<TrendUp    size={19} weight="fill" />} />
      </section>

      {/* ── Charts row ─────────────────────────────────────── */}
      <section>
        <Card>
          <CardHeader
            title="Ticket sales"
            sub={`${overview.ticketSales.toLocaleString()} tickets sold total`}
            icon={<Ticket size={15} weight="fill" />}
          />
          <div className="mt-6">
            <BarChart series={salesSeries} />
          </div>
        </Card>
      </section>

      {/* ── Recent events ──────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Recent events"
          sub="Upcoming and recent shows."
          icon={<CalendarBlank size={15} weight="fill" />}
          action={
            <Link className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/25 bg-[var(--brand)]/8 px-3 py-1.5 text-[12px] font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/12" href="/organizer/events">
              View all <ArrowSquareOut size={12} />
            </Link>
          }
        />
        {recentEvents.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recentEvents.map((e) => (
              <Link key={e.id} href={`/organizer/events/${e.id}`} className="block transition hover:-translate-y-px">
                <EventCardMini {...e} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptySlate
            icon={<Ticket size={24} weight="thin" />}
            title="No events yet"
            body="Create your first event to start selling tickets and tracking performance."
            cta={
              <Link href="/organizer/events/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-semibold text-black transition hover:opacity-90">
                <Sparkle size={14} weight="fill" /> New Event
              </Link>
            }
          />
        )}
      </Card>

      {/* ── Trending hashtags ──────────────────────────────── */}
      <Card>
        <CardHeader
          title="Trending hashtags"
          sub="Tags moving around your events."
          icon={<Hash size={15} weight="fill" />}
        />
        {hashtags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {hashtags.map((tag, i) => (
              <motion.span
                key={`${tag}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition hover:scale-105 ${
                  i < 4
                    ? "border-[var(--brand)]/25 bg-[var(--brand)]/8 text-[var(--brand)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                }`}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">No hashtag data yet.</p>
        )}
      </Card>

      {/* ── Activity + Posts ────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Live activity" icon={<Lightning size={15} weight="fill" />} />
          {activity.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {activity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 rounded-[16px] bg-[var(--bg-elevated)] p-3"
                >
                  <ActivityIcon tone={item.tone} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{item.timeLabel}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptySlate
              icon={<Lightning size={20} weight="thin" />}
              title="All quiet for now"
              body="Activity appears here as tickets sell, followers join, and events go live."
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Recent posts" icon={<Star size={15} weight="fill" />} />
          {userPosts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {userPosts.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-[16px] bg-[var(--bg-elevated)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{s.user}</p>
                      {s.featured && (
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">Featured</span>
                      )}
                    </div>
                    <span className="flex shrink-0 gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={11} weight={j < s.rating ? "fill" : "regular"} style={{ color: j < s.rating ? "#f59e0b" : "var(--text-tertiary)" }} />
                      ))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)] truncate">{s.eventTitle}</p>
                  <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">{s.text}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptySlate
              icon={<Star size={20} weight="thin" />}
              title="No posts yet"
              body="Posts appear after attendees post about your events."
            />
          )}
        </Card>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   EVENTS TAB
───────────────────────────────────────────────────────────────────────── */

function EventsTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { overview, recentEvents } = dashboard;
  const live   = recentEvents.filter((e) => e.statusLabel === "Live").length;
  const draft  = recentEvents.filter((e) => e.statusLabel === "Draft").length;
  const past   = recentEvents.filter((e) => e.statusLabel === "Past" || e.statusLabel === "Sold Out").length;
  const drafts = recentEvents.filter((e) => e.statusLabel === "Draft");
  const liveEv = recentEvents.filter((e) => e.statusLabel === "Live");
  const otherEv= recentEvents.filter((e) => e.statusLabel !== "Draft" && e.statusLabel !== "Live");

  return (
    <div className="space-y-5">
      {/* Status KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Live now",        value: live.toString(),                      accent: "#2f8f45" },
          { label: "Drafts",          value: draft.toString(),                     accent: "#f59e0b" },
          { label: "Past / Sold out", value: past.toString(),                      accent: "#a9a9a9" },
          { label: "Tickets sold",    value: overview.ticketSales.toLocaleString(), accent: "#2f8f45" },
        ].map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_2px_8px_rgba(5,12,8,0.05)]">
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-[20px]" style={{ background: k.accent }} />
            <p className="pl-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{k.label}</p>
            <p className="mt-2 pl-2 text-[1.8rem] font-bold tabular-nums leading-none" style={{ color: k.accent }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Drafts callout */}
      {drafts.length > 0 && (
        <div className="rounded-[20px] border border-amber-400/25 bg-gradient-to-br from-amber-500/6 to-amber-400/3 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Drafts ready to publish</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                {drafts.length} event{drafts.length > 1 ? "s" : ""} waiting — publish to start selling tickets
              </p>
            </div>
            <Link href="/organizer/events" className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[12px] font-semibold text-amber-600 transition hover:bg-amber-500/15">
              Review all
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {drafts.slice(0, 2).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{e.title}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{e.dateLabel} · {e.venue}</p>
                </div>
                <Link href={`/organizer/events/${e.id}`} className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-[12px] font-semibold text-black transition hover:opacity-90">
                  Publish
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live events */}
      {liveEv.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-50" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--brand)]" />
              </span>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Live now</p>
            </div>
            <Link href="/organizer/events/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[12px] font-semibold text-black transition hover:opacity-90">
              <Sparkle size={13} weight="fill" /> New Event
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {liveEv.map((e) => (
              <Link key={e.id} href={`/organizer/events/${e.id}`} className="block transition hover:-translate-y-px">
                <EventCardMini {...e} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Past & sold out */}
      {otherEv.length > 0 && (
        <Card>
          <p className="mb-4 text-[13px] font-semibold text-[var(--text-primary)]">Past & sold out</p>
          <div className="grid gap-3 md:grid-cols-2">
            {otherEv.map((e) => (
              <Link key={e.id} href={`/organizer/events/${e.id}`} className="block transition hover:-translate-y-px">
                <EventCardMini {...e} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {recentEvents.length === 0 && (
        <Card>
          <EmptySlate
            icon={<CalendarBlank size={26} weight="thin" />}
            title="No events yet"
            body="Create your first event to start selling tickets."
            cta={
              <Link href="/organizer/events/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-semibold text-black transition hover:opacity-90">
                <Sparkle size={14} weight="fill" /> Create event
              </Link>
            }
          />
        </Card>
      )}

      <Link href="/organizer/events" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] transition hover:opacity-75">
        Manage all events <ArrowSquareOut size={13} />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AUDIENCE TAB
───────────────────────────────────────────────────────────────────────── */

function AudienceTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { overview } = dashboard;
  const organic = overview.organicReach;
  const boosted = overview.boostedReach;
  const total   = Math.max(organic + boosted, 1);

  const pulse = [
    { label: "Legends",      pct: 18 },
    { label: "City Natives", pct: 27 },
    { label: "Regulars",     pct: 31 },
    { label: "Explorers",    pct: 17 },
    { label: "Newcomers",    pct: 7  },
  ];
  const traffic = [
    { label: "Organic",       val: Math.round((organic / total) * 100) },
    { label: "Boosted",       val: Math.round((boosted / total) * 100) },
    { label: "Friend Shares", val: 16 },
    { label: "Search",        val: 11 },
  ];
  const hoods = [
    { name: "Osu",         pct: 24 },
    { name: "East Legon",  pct: 19 },
    { name: "Labone",      pct: 14 },
    { name: "Cantonments", pct: 12 },
    { name: "Tema",        pct: 9  },
  ];
  const ages = [
    { label: "18–24", pct: 21 },
    { label: "25–29", pct: 33 },
    { label: "30–34", pct: 24 },
    { label: "35–44", pct: 15 },
    { label: "45+",   pct: 7  },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total reach",   value: fmt(organic + boosted), accent: "#2f8f45" },
          { label: "Organic",       value: fmt(organic),           accent: "#3b82f6" },
          { label: "Boosted",       value: fmt(boosted),           accent: "#d946ef" },
          { label: "Followers",     value: fmt(overview.followerCount), accent: "#f59e0b" },
        ].map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_2px_8px_rgba(5,12,8,0.05)]">
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-[20px]" style={{ background: k.accent }} />
            <p className="pl-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{k.label}</p>
            <p className="mt-2 pl-2 text-[1.6rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Pulse tier breakdown" icon={<UsersThree size={15} weight="fill" />} />
          <div className="mt-5 space-y-4">
            {pulse.map((r, i) => <ProgressRow key={r.label} label={r.label} pct={r.pct} delay={i * 0.08} />)}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Traffic sources" icon={<ChartBar size={15} weight="fill" />} />
            <div className="mt-4 space-y-2">
              {traffic.map((r) => (
                <div key={r.label} className="flex items-center justify-between rounded-[12px] bg-[var(--bg-elevated)] px-3 py-2.5">
                  <span className="text-[13px] text-[var(--text-primary)]">{r.label}</span>
                  <span className="text-[13px] font-bold tabular-nums text-[var(--brand)]">{r.val}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Top neighbourhoods" icon={<Compass size={15} weight="fill" />} />
            <div className="mt-4 space-y-2">
              {hoods.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="w-5 text-center text-[10px] font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                  <span className="flex-1 text-[13px] text-[var(--text-primary)]">{r.name}</span>
                  <span className="text-[13px] font-bold tabular-nums text-[var(--brand)]">{r.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Age bands */}
      <Card>
        <CardHeader title="Age breakdown" sub="Distribution of your audience by age group" />
        {(() => {
          const maxPct = Math.max(...ages.map((a) => a.pct), 1);
          return (
            <div className="mt-6 flex h-36 items-end gap-2">
              {ages.map((a, i) => (
                <div key={a.label} className="flex flex-1 flex-col items-center gap-2">
                  <p className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{a.pct}%</p>
                  <div className="flex w-full items-end">
                    <motion.div
                      className="w-full rounded-t-[8px]"
                      style={{ background: "color-mix(in srgb, var(--brand) 60%, transparent)" }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, (a.pct / maxPct) * 80)}px` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                      whileHover={{ background: "var(--brand)" }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{a.label}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AD CAMPAIGNS TAB
───────────────────────────────────────────────────────────────────────── */

function AdCampaignsTab() {
  return (
    <Card className="flex flex-col items-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)]/10">
        <MegaphoneSimple size={28} weight="fill" style={{ color: "var(--brand)" }} />
      </span>
      <p className="mt-5 text-[18px] font-bold text-[var(--text-primary)]">Ad Manager coming soon</p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Boost your events directly to the right audience on GoOutside. Campaigns, budgets, and reach reporting — all in one place.
      </p>
      <span className="mt-6 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
        Coming Q3 2026
      </span>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   POSTS TAB
───────────────────────────────────────────────────────────────────────── */

function PostsTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Posts & Reels</p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Create content linked to your events.</p>
        </div>
        <Link href="/organizer/create-post" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:opacity-90">
          <Sparkle size={14} weight="fill" /> Create Post
        </Link>
      </div>

      {dashboard.recentEvents.length > 0 && (
        <Card>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Tag your events in posts</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {dashboard.recentEvents.map((e) => (
              <Link key={e.id} href={`/organizer/create-post?event=${e.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]">
                <Ticket size={12} /> {e.title}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {dashboard.posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {dashboard.posts.map((post) => (
            <Card key={post.id}>
              {post.imageUrl && (
                <div className="relative mb-3 h-40 overflow-hidden rounded-[14px] bg-[var(--bg-muted)]">
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
              )}
              {!post.imageUrl && (
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--bg-elevated)]">
                  <ImageIcon size={16} weight="thin" style={{ color: "var(--text-tertiary)" }} />
                </div>
              )}
              <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--text-primary)]">{post.body}</p>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                  <Heart size={12} /><span>{post.likeCount}</span>
                  {post.eventTitle && (<><span>·</span><Ticket size={12} /><span className="max-w-[120px] truncate">{post.eventTitle}</span></>)}
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)]">{timeAgo(post.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptySlate
            icon={<ChatsCircle size={24} weight="thin" />}
            title="No posts yet"
            body="Create your first post to engage your audience and drive event attendance."
            cta={
              <Link href="/organizer/create-post" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:opacity-90">
                <Sparkle size={14} weight="fill" /> Write your first post
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   UPGRADE GATE
───────────────────────────────────────────────────────────────────────── */

export function OrganizerUpgradeGate({ firstName }: { firstName: string }) {
  return (
    <div className="flex h-full p-4 md:p-6 xl:p-8">
      <section className="relative flex min-h-full flex-1 flex-col justify-center overflow-hidden rounded-[34px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-[0_24px_72px_rgba(6,14,9,0.12)] md:p-12">
        {/* Glow blob */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          <Rocket size={12} weight="fill" /> Organizer Mode
        </span>
        <h1 className="mt-5 max-w-xl text-[1.7rem] font-bold tracking-tight text-[var(--text-primary)]">
          Turn {firstName}&apos;s account into an organizer workspace
        </h1>
        <p className="mt-4 max-w-[640px] text-[15px] leading-8 text-[var(--text-secondary)]">
          Organizer Mode keeps the same GoOutside account, feed, and social graph, but unlocks a verified organizer profile, event-first analytics, scheduled content, and community management tools.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: ChartBar,   accent: "#2f8f45", title: "Professional dashboard",  body: "Track ticket sales, reach, conversion, and event momentum in one place."          },
            { icon: SealCheck,  accent: "#3b82f6", title: "Organizer-first profile", body: "Verified status, hosted events, and social links front and center."                },
            { icon: UsersThree, accent: "#8b5cf6", title: "Content & moderation",    body: "Schedule posts, tag events, and manage comments and posts." },
          ].map((item) => (
            <article key={item.title} className="relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
              <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: item.accent }} />
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${item.accent}18`, color: item.accent }}>
                <item.icon size={17} weight="fill" />
              </span>
              <p className="mt-4 text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/profile" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-[14px] font-semibold text-black transition hover:opacity-90">
            Update Profile
          </Link>
          <Link href="/organizers" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-5 py-3 text-[14px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
            Explore organizers <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CHECKLIST WIDGET
───────────────────────────────────────────────────────────────────────── */

type ChecklistItem = { id: string; label: string; href: string; done: boolean };

function OrganizerChecklist({ items }: { items: ChecklistItem[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_2px_12px_rgba(5,12,8,0.05)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            {allDone ? "Setup complete!" : "Your setup checklist"}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            {doneCount}/{items.length} done
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <motion.div
              className="h-1.5 rounded-full bg-[var(--brand)]"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / items.length) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
            aria-label="Dismiss checklist"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition ${
                item.done
                  ? "opacity-50 cursor-default pointer-events-none"
                  : "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.done ? (
                <CheckCircle size={16} weight="fill" className="shrink-0 text-[var(--brand)]" />
              ) : (
                <Circle size={16} weight="regular" className="shrink-0 text-[var(--text-tertiary)]" />
              )}
              <span className={`text-[13px] font-medium ${item.done ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"}`}>
                {item.label}
              </span>
              {!item.done && (
                <ArrowUpRight size={12} className="ml-auto shrink-0 text-[var(--text-tertiary)]" />
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD VIEW
───────────────────────────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function OrganizerDashboardView({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [period,    setPeriod]    = useState<Period>("7d");

  const org = dashboard.organizer;

  const hasLogo    = Boolean(org?.logoUrl);
  const hasEvents  = dashboard.recentEvents.length > 0;
  const hasBio     = Boolean(org?.bio && org.bio.length > 80);

  const checklistItems: ChecklistItem[] = [
    { id: "profile",  label: "Complete your organizer profile",  href: "/organizer/settings/profile", done: hasBio     },
    { id: "event",    label: "Create your first event",           href: "/organizer/events/new",      done: hasEvents  },
    { id: "logo",     label: "Upload your organizer logo",        href: "/organizer/settings/profile", done: hasLogo   },
    { id: "tickets",  label: "Add tickets to your event",         href: "/organizer/events",          done: hasEvents && dashboard.overview.ticketSales > 0 },
    { id: "share",    label: "Share your event link",             href: "/organizer/marketing",       done: dashboard.overview.ticketSales > 0 },
  ];
  const showChecklist = checklistItems.some((i) => !i.done);

  return (
    <div className="flex flex-col">

      {/* ── HERO HEADER ──────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 pb-0 pt-6 md:px-7">

        {/* Gradient glow — top-right */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }} />

        {/* Dot grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Greeting + identity row */}
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Organizer avatar */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
            >
              {org?.logoUrl ? (
                <Image src={org.logoUrl} alt={org.name} fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[20px] font-black text-[var(--brand)]">
                  {org?.initials ?? "O"}
                </span>
              )}
            </motion.div>

            <div>
              <p className="text-[11px] font-semibold text-[var(--text-tertiary)]">
                {getGreeting()}
              </p>
              <h1 className="mt-0.5 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                {org?.name ?? "Dashboard"}
              </h1>
              {org && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {org.city && (
                    <span className="text-[12px] text-[var(--text-secondary)]">{org.city}</span>
                  )}
                  {org.verified ? (
                    <OrganizerBadge compact />
                  ) : (
                    <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
                      Pending approval
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick stats strip */}
            <div className="hidden lg:flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2">
              {[
                { icon: <Ticket size={12} weight="fill" />, label: `${dashboard.overview.ticketSales.toLocaleString()} tickets` },
                { icon: <UsersThree size={12} weight="fill" />, label: `${dashboard.overview.followerCount.toLocaleString()} followers` },
                { icon: <TrendUp size={12} weight="fill" />, label: dashboard.overview.revenue > 0 ? `GH₵${dashboard.overview.revenue.toLocaleString()}` : "No revenue yet" },
              ].map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--brand)]">{s.icon}</span>
                  {s.label}
                </span>
              ))}
            </div>
            <PeriodPicker period={period} onChange={setPeriod} />
            <Link
              href="/dashboard/messages"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-[13px] font-medium text-[var(--text-secondary)] shadow-sm transition hover:border-[var(--brand)]/30 hover:text-[var(--text-primary)]"
            >
              <ChatsCircle size={15} /> Messages
            </Link>
          </div>
        </div>

        {/* ── Quick actions strip ─────────────────────────────── */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/8 px-3.5 py-2 text-[12px] font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/14"
          >
            <Sparkle size={13} weight="fill" /> New Event
          </Link>
          <Link
            href="/organizer/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/25 hover:text-[var(--text-primary)]"
          >
            <CalendarBlank size={13} /> Calendar
          </Link>
          <button
            type="button"
            onClick={() => setActiveTab("Posts & Reels")}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/25 hover:text-[var(--text-primary)]"
          >
            <NotePencil size={13} /> Create Post
          </button>
          <Link
            href="/organizer/marketing"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/25 hover:text-[var(--text-primary)]"
          >
            <ShareNetwork size={13} /> Share Event
          </Link>
          <Link
            href="/organizer/scan"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)]/25 hover:text-[var(--text-primary)]"
          >
            <QrCode size={13} /> Scan Tickets
          </Link>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────── */}
        <div className="relative mt-5 flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative shrink-0 px-4 pb-3 pt-1 text-[13px] font-semibold transition-colors ${
                activeTab === tab
                  ? "text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--brand)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div className="p-5 md:p-7">
        {/* Checklist — only in Overview tab for new organizers */}
        {activeTab === "Overview" && showChecklist && (
          <div className="mb-5">
            <OrganizerChecklist items={checklistItems} />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeTab === "Overview"      && <OverviewTab    dashboard={dashboard} />}
            {activeTab === "Events"        && <EventsTab      dashboard={dashboard} />}
            {activeTab === "Audience"      && <AudienceTab    dashboard={dashboard} />}
            {activeTab === "Ad Campaigns"  && <AdCampaignsTab />}
            {activeTab === "Posts & Reels" && <PostsTab       dashboard={dashboard} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

export default OrganizerDashboardView;
