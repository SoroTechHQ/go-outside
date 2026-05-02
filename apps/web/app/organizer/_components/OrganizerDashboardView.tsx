import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowSquareOut,
  CalendarBlank,
  ChatsCircle,
  ChartBar,
  Hash,
  MegaphoneSimple,
  Sparkle,
  Star,
  Ticket,
  TrendUp,
  UsersThree,
  Waves,
} from "@phosphor-icons/react/dist/ssr";
import type { OrganizerDashboardData } from "../_lib/dashboard";
import EventCardMini from "./EventCardMini";
import { OrganizerIdentityCardClient } from "./OrganizerIdentityCardClient";

const TAB_ITEMS = ["Overview", "Events", "Audience", "Ad Campaigns", "Posts & Reels"];

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-GH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getActivityTone(tone: OrganizerDashboardData["activity"][number]["tone"]) {
  switch (tone) {
    case "green":
      return "bg-[var(--brand)]/12 text-[var(--brand)]";
    case "purple":
      return "bg-fuchsia-500/10 text-fuchsia-400";
    case "amber":
      return "bg-amber-500/10 text-amber-500";
    case "coral":
      return "bg-rose-500/10 text-rose-400";
    default:
      return "bg-[var(--bg-muted)] text-[var(--text-secondary)]";
  }
}

function MetricCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)]/12 text-[var(--brand)]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-[1.6rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-2 text-[11px] text-[var(--text-secondary)]">{delta}</p>
    </article>
  );
}

function Donut({ organic, boosted }: { organic: number; boosted: number }) {
  const total = Math.max(organic + boosted, 1);
  const organicPct = Math.round((organic / total) * 100);
  const circumference = 2 * Math.PI * 36;
  const organicLength = (organicPct / 100) * circumference;
  const boostedLength = circumference - organicLength;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(var(--text-primary-rgb,240,239,232),0.08)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="var(--brand)"
          strokeDasharray={`${organicLength} ${circumference - organicLength}`}
          strokeLinecap="round"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="#d946ef"
          strokeDasharray={`${boostedLength} ${circumference - boostedLength}`}
          strokeDashoffset={-organicLength}
          strokeLinecap="round"
          strokeWidth="10"
        />
        <g transform="rotate(90 50 50)">
          <text x="50" y="48" fill="currentColor" fontFamily="var(--font-display)" fontSize="16" fontStyle="italic" fontWeight="700" textAnchor="middle">
            {organicPct}%
          </text>
          <text x="50" y="62" fill="currentColor" fontSize="8" textAnchor="middle">
            organic
          </text>
        </g>
      </svg>

      <div className="flex items-center gap-4 text-[12px] text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
          Organic
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
          Boosted
        </span>
      </div>
    </div>
  );
}

export function OrganizerUpgradeGate({ firstName }: { firstName: string }) {
  return (
    <div className="flex h-full p-4 md:p-6 xl:p-8">
      <section className="flex min-h-full flex-1 flex-col justify-center rounded-[34px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-[0_24px_72px_rgba(6,14,9,0.12)] md:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Organizer Mode
        </p>
        <h1 className="mt-4 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
          Turn {firstName}&apos;s account into an organizer workspace
        </h1>
        <p className="mt-4 max-w-[680px] text-[15px] leading-8 text-[var(--text-secondary)]">
          Organizer Mode keeps the same GoOutside account, feed, and social graph, but unlocks a verified organizer profile, event-first analytics, scheduled content, and community management tools.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Professional dashboard",
              body: "Track ticket sales, reach, conversion, and event momentum in one place.",
            },
            {
              title: "Organizer-first profile",
              body: "Show followers, hosted events, social links, and verified status instead of a personal layout.",
            },
            {
              title: "Content and moderation",
              body: "Schedule posts, tag events, and manage comments and snippets from a single workspace.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[26px] bg-[var(--bg-elevated)] p-5">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-3 text-[13px] leading-7 text-[var(--text-secondary)]">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-[14px] font-semibold text-black transition hover:opacity-90"
            href="/profile"
          >
            Update Profile
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-5 py-3 text-[14px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            href="/organizers"
          >
            Explore organizer network
          </Link>
        </div>
      </section>
    </div>
  );
}

export function OrganizerDashboardView({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { organizer, overview, salesSeries, recentEvents, hashtags, activity, snippets } = dashboard;

  return (
    <div className="grid gap-6 p-4 md:p-6 xl:p-8 2xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)] md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
                  Dashboard
                </h1>
                <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  Live workspace
                </span>
              </div>
              <p className="mt-2 max-w-[680px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Track sales, shape audience growth, and keep your next event cycle moving.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                href="/messages"
              >
                <ChatsCircle size={16} />
                Messages
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                href="/organizer/calendar"
              >
                <CalendarBlank size={16} />
                Schedule
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:opacity-90"
                href="/organizer/events/new"
              >
                <Sparkle size={16} weight="fill" />
                New Event
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TAB_ITEMS.map((item, index) => (
              <span
                key={item}
                className={`rounded-full px-3.5 py-2 text-[12px] font-medium ${
                  index === 0
                    ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard delta={overview.ticketSalesDelta} icon={<Ticket size={18} weight="fill" />} label="Ticket Sales" value={formatCompactNumber(overview.ticketSales)} />
          <MetricCard delta={overview.followerDelta} icon={<UsersThree size={18} weight="fill" />} label="Followers" value={formatCompactNumber(overview.followerCount)} />
          <MetricCard delta={overview.eventViewsDelta} icon={<Waves size={18} weight="fill" />} label="Event Views" value={formatCompactNumber(overview.eventViews)} />
          <MetricCard delta={overview.revenueDelta} icon={<TrendUp size={18} weight="fill" />} label="Revenue" value={formatCompactNumber(overview.revenue)} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <article className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Ticket sales, last 7 days</p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  {overview.ticketSales.toLocaleString()} total · {overview.conversionRate}% conversion
                </p>
              </div>
              <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--brand)]">
                Peak Friday
              </span>
            </div>

            <div className="mt-8 flex h-44 items-end gap-3">
              {salesSeries.map((point, index) => {
                const max = Math.max(...salesSeries.map((entry) => entry.value), 1);
                const height = Math.max(14, Math.round((point.value / max) * 100));

                return (
                  <div key={`${point.label}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-full w-full items-end">
                      <div
                        className={`w-full rounded-t-[18px] ${index === 4 ? "bg-[var(--brand)]" : "bg-[var(--brand)]/35"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-[var(--text-primary)]">{point.value}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{point.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Audience reach</p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  Organic vs boosted traffic mix
                </p>
              </div>
              <ChartBar size={18} className="text-[var(--brand)]" weight="fill" />
            </div>

            <div className="mt-6">
              <Donut boosted={overview.boostedReach} organic={overview.organicReach} />
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Recent events</p>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                Upcoming and recent shows with the strongest movement.
              </p>
            </div>
            <Link className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)]" href="/organizer/events">
              View all
              <ArrowSquareOut size={14} />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recentEvents.map((event) => (
              <EventCardMini
                key={event.id}
                capacity={event.capacity}
                category={event.category}
                dateLabel={event.dateLabel}
                revenue={event.revenue}
                snippets={event.snippets}
                sold={event.sold}
                soldRatio={event.soldRatio}
                statusLabel={event.statusLabel}
                statusTone={event.statusTone}
                title={event.title}
                venue={event.venue}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Trending hashtags</p>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                Tags already moving around your events and profile traffic.
              </p>
            </div>
            <Hash size={18} className="text-[var(--brand)]" weight="fill" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                  index < 4
                    ? "border-[var(--brand)]/25 bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <OrganizerIdentityCardClient organizer={organizer} />

        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Quick actions</p>
            <Sparkle size={18} className="text-[var(--brand)]" weight="fill" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { href: "/organizer/events/new", label: "New Event", icon: <CalendarBlank size={18} /> },
              { href: "/messages", label: "Reply to DMs", icon: <ChatsCircle size={18} /> },
              { href: "/organizer/analytics", label: "Boost Event", icon: <MegaphoneSimple size={18} /> },
              { href: "/organizer/create-post", label: "Create Post", icon: <Sparkle size={18} /> },
            ].map((item) => (
              <Link
                key={item.label}
                className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-4 text-center text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                href={item.href}
              >
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                  {item.icon}
                </span>
                <span className="mt-3 block">{item.label}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Live activity</p>
            <TrendUp size={18} className="text-[var(--brand)]" weight="fill" />
          </div>

          <div className="mt-4 space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-[22px] bg-[var(--bg-elevated)] p-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getActivityTone(item.tone)}`}>
                  <Sparkle size={16} weight="fill" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-6 text-[var(--text-secondary)]">{item.body}</p>
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{item.timeLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Recent snippets</p>
            <Star size={18} className="text-amber-500" weight="fill" />
          </div>

          <div className="mt-4 space-y-3">
            {snippets.map((snippet) => (
              <div key={snippet.id} className="rounded-[22px] bg-[var(--bg-elevated)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {snippet.user}
                      {snippet.featured ? (
                        <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-500">
                          Featured
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{snippet.eventTitle}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-amber-500">
                    {"★".repeat(snippet.rating)}
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-6 text-[var(--text-secondary)]">
                  {snippet.text}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

export default OrganizerDashboardView;
