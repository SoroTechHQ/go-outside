"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowSquareOut,
  CalendarBlank,
  ChartBar,
  ChatsCircle,
  Compass,
  Hash,
  MegaphoneSimple,
  Sparkle,
  Star,
  Ticket,
  TrendUp,
  UsersThree,
  Waves,
} from "@phosphor-icons/react";
import type { OrganizerDashboardData } from "../_lib/dashboard";
import EventCardMini from "./EventCardMini";

type Tab = "Overview" | "Events" | "Audience" | "Ad Campaigns" | "Posts & Reels";
const TABS: Tab[] = ["Overview", "Events", "Audience", "Ad Campaigns", "Posts & Reels"];

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-GH", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function getActivityTone(tone: OrganizerDashboardData["activity"][number]["tone"]) {
  switch (tone) {
    case "green": return "bg-[var(--brand)]/12 text-[var(--brand)]";
    case "purple": return "bg-fuchsia-500/10 text-fuchsia-400";
    case "amber": return "bg-amber-500/10 text-amber-500";
    case "coral": return "bg-rose-500/10 text-rose-400";
    default: return "bg-[var(--bg-muted)] text-[var(--text-secondary)]";
  }
}

function MetricCard({ label, value, delta, icon }: { label: string; value: string; delta: string; icon: ReactNode }) {
  return (
    <article className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)]/12 text-[var(--brand)]">
        {icon}
      </span>
      <p className="mt-4 text-[1.6rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-2 text-[11px] text-[var(--text-secondary)]">{delta}</p>
    </article>
  );
}

function Donut({ organic, boosted }: { organic: number; boosted: number }) {
  const total = Math.max(organic + boosted, 1);
  const organicPct = Math.round((organic / total) * 100);
  const c = 2 * Math.PI * 36;
  const organicLen = (organicPct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(var(--text-primary-rgb,240,239,232),0.08)" strokeWidth="10" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--brand)" strokeDasharray={`${organicLen} ${c - organicLen}`} strokeLinecap="round" strokeWidth="10" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#d946ef" strokeDasharray={`${c - organicLen} ${organicLen}`} strokeDashoffset={-organicLen} strokeLinecap="round" strokeWidth="10" />
        <g transform="rotate(90 50 50)">
          <text x="50" y="48" fill="currentColor" fontFamily="var(--font-display)" fontSize="16" fontStyle="italic" fontWeight="700" textAnchor="middle">{organicPct}%</text>
          <text x="50" y="62" fill="currentColor" fontSize="8" textAnchor="middle">organic</text>
        </g>
      </svg>
      <div className="flex items-center gap-4 text-[12px] text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />Organic</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />Boosted</span>
      </div>
    </div>
  );
}

function BarChart({ series }: { series: Array<{ label: string; value: number }> }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <div className="flex h-44 items-end gap-3">
      {series.map((point, index) => {
        const height = Math.max(14, Math.round((point.value / max) * 100));
        return (
          <div key={`${point.label}-${index}`} className="group flex flex-1 flex-col items-center gap-3">
            <div className="flex h-full w-full items-end">
              <div
                className={`w-full rounded-t-[18px] transition-all ${index === 4 ? "bg-[var(--brand)]" : "bg-[var(--brand)]/35 group-hover:bg-[var(--brand)]/60"}`}
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
  );
}

function OverviewTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { overview, salesSeries, recentEvents, hashtags, activity, snippets } = dashboard;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard delta={overview.ticketSalesDelta} icon={<Ticket size={18} weight="fill" />} label="Ticket Sales" value={formatCompact(overview.ticketSales)} />
        <MetricCard delta={overview.followerDelta} icon={<UsersThree size={18} weight="fill" />} label="Followers" value={formatCompact(overview.followerCount)} />
        <MetricCard delta={overview.eventViewsDelta} icon={<Waves size={18} weight="fill" />} label="Event Views" value={formatCompact(overview.eventViews)} />
        <MetricCard delta={overview.revenueDelta} icon={<TrendUp size={18} weight="fill" />} label="Revenue" value={formatMoney(overview.revenue)} />
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <article className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Ticket sales, last 7 days</p>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                {overview.ticketSales.toLocaleString()} total · {overview.conversionRate}% conversion
              </p>
            </div>
            <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--brand)]">Peak Friday</span>
          </div>
          <div className="mt-8">
            <BarChart series={salesSeries} />
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Audience reach</p>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Organic vs boosted traffic mix</p>
            </div>
            <ChartBar size={18} className="text-[var(--brand)]" weight="fill" />
          </div>
          <div className="mt-6">
            <Donut boosted={overview.boostedReach} organic={overview.organicReach} />
          </div>
        </article>
      </section>

      {/* Recent events */}
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Recent events</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Upcoming and recent shows with the strongest movement.</p>
          </div>
          <Link className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)]" href="/organizer/events">
            View all <ArrowSquareOut size={14} />
          </Link>
        </div>
        {recentEvents.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recentEvents.map((event) => (
              <Link key={event.id} href={`/organizer/events/${event.id}`} className="block">
                <EventCardMini {...event} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center py-10 text-center">
            <Ticket size={28} className="text-[var(--text-tertiary)]" weight="thin" />
            <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No events yet — create your first one.</p>
            <Link className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black" href="/organizer/events/new">
              <Sparkle size={14} weight="fill" /> New Event
            </Link>
          </div>
        )}
      </section>

      {/* Trending hashtags */}
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Trending hashtags</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Tags moving around your events and profile traffic.</p>
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

      {/* Live activity + snippets */}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Live activity</p>
            <TrendUp size={18} className="text-[var(--brand)]" weight="fill" />
          </div>
          {activity.length > 0 ? (
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
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-secondary)]">Nothing here yet — activity appears as tickets sell and events go live.</p>
          )}
        </article>

        <article className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Recent snippets</p>
            <Star size={18} className="text-amber-500" weight="fill" />
          </div>
          {snippets.length > 0 ? (
            <div className="mt-4 space-y-3">
              {snippets.map((snippet) => (
                <div key={snippet.id} className="rounded-[22px] bg-[var(--bg-elevated)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {snippet.user}
                        {snippet.featured && (
                          <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-500">Featured</span>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{snippet.eventTitle}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-amber-500">{"★".repeat(snippet.rating)}</span>
                  </div>
                  <p className="mt-3 text-[12px] leading-6 text-[var(--text-secondary)]">{snippet.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--text-secondary)]">No snippets yet — they appear after attendees post about your events.</p>
          )}
        </article>
      </section>
    </div>
  );
}

function EventsTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { overview, recentEvents } = dashboard;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total events", value: dashboard.organizer.totalEvents.toString() },
          { label: "Tickets sold", value: overview.ticketSales.toLocaleString() },
          { label: "Revenue", value: formatMoney(overview.revenue) },
          { label: "Conversion", value: `${overview.conversionRate}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{kpi.label}</p>
            <p className="mt-2 text-[1.4rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">All events</p>
          <Link className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black" href="/organizer/events/new">
            <Sparkle size={14} weight="fill" /> New Event
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {recentEvents.map((event) => (
            <Link key={event.id} href={`/organizer/events/${event.id}`} className="block">
              <EventCardMini {...event} />
            </Link>
          ))}
        </div>
        <Link className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)]" href="/organizer/events">
          Manage all events <ArrowSquareOut size={14} />
        </Link>
      </div>
    </div>
  );
}

function AudienceTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const { overview } = dashboard;
  const organic = overview.organicReach;
  const boosted = overview.boostedReach;
  const totalReach = Math.max(organic + boosted, 1);

  const pulseBreakdown = [
    { label: "Legends", percentage: 18 },
    { label: "City Natives", percentage: 27 },
    { label: "Regulars", percentage: 31 },
    { label: "Explorers", percentage: 17 },
    { label: "Newcomers", percentage: 7 },
  ];

  const referralSources = [
    { label: "Organic", value: Math.round((organic / totalReach) * 100) },
    { label: "Boosted", value: Math.round((boosted / totalReach) * 100) },
    { label: "Friend Shares", value: 16 },
    { label: "Search", value: 11 },
  ];

  const neighbourhoods = [
    { name: "Osu", share: 24 },
    { name: "East Legon", share: 19 },
    { name: "Labone", share: 14 },
    { name: "Cantonments", share: 12 },
    { name: "Tema", share: 9 },
  ];

  const ageBands = [
    { label: "18-24", share: 21 },
    { label: "25-29", share: 33 },
    { label: "30-34", share: 24 },
    { label: "35-44", share: 15 },
    { label: "45+", share: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total reach", value: formatCompact(organic + boosted) },
          { label: "Organic reach", value: formatCompact(organic) },
          { label: "Boosted reach", value: formatCompact(boosted) },
          { label: "Followers", value: formatCompact(overview.followerCount) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{kpi.label}</p>
            <p className="mt-2 text-[1.4rem] font-bold tabular-nums leading-none text-[var(--text-primary)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Pulse tier breakdown */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          <div className="flex items-center gap-2">
            <UsersThree size={16} className="text-[var(--brand)]" weight="fill" />
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Pulse tiers</p>
          </div>
          <div className="mt-4 space-y-3">
            {pulseBreakdown.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)]">{row.label}</span>
                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">{row.percentage}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-muted)]">
                  <div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${row.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral sources + neighbourhoods */}
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="flex items-center gap-2">
              <ChartBar size={16} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Traffic sources</p>
            </div>
            <div className="mt-4 space-y-2">
              {referralSources.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-[12px] bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px]">
                  <span className="text-[var(--text-primary)]">{row.label}</span>
                  <span className="font-semibold tabular-nums text-[var(--brand)]">{row.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Top neighbourhoods</p>
            </div>
            <div className="mt-4 space-y-2">
              {neighbourhoods.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-[12px] bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px]">
                  <span className="text-[var(--text-primary)]">{row.name}</span>
                  <span className="font-semibold tabular-nums text-[var(--brand)]">{row.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Age breakdown */}
      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
        <p className="text-[15px] font-semibold text-[var(--text-primary)]">Age bands</p>
        <div className="mt-4 flex h-32 items-end gap-3">
          {ageBands.map((band) => (
            <div key={band.label} className="flex flex-1 flex-col items-center gap-2">
              <p className="text-[11px] font-semibold tabular-nums text-[var(--text-primary)]">{band.share}%</p>
              <div className="flex w-full items-end">
                <div className="w-full rounded-t-[10px] bg-[var(--brand)]/60 transition-all hover:bg-[var(--brand)]" style={{ height: `${(band.share / 40) * 80}px` }} />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">{band.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdCampaignsTab() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-16 text-center shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)]/10">
        <MegaphoneSimple size={24} className="text-[var(--brand)]" weight="fill" />
      </span>
      <p className="mt-4 text-[16px] font-bold text-[var(--text-primary)]">Ad Manager coming soon</p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Boost your events directly to the right audience on GoOutside. Campaigns, budgets, and reach reporting — all in one place.
      </p>
      <span className="mt-6 rounded-full bg-[var(--brand)]/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
        Coming Q3 2026
      </span>
    </div>
  );
}

function PostsTab({ dashboard }: { dashboard: OrganizerDashboardData }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Posts & Reels</p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Create content linked to your events and engage your audience.</p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:opacity-90"
          href="/organizer/create-post"
        >
          <Sparkle size={14} weight="fill" />
          Create Post
        </Link>
      </div>

      {dashboard.recentEvents.length > 0 && (
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Tag your events in posts
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {dashboard.recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/organizer/create-post?event=${event.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--brand)]"
              >
                <Ticket size={12} />
                {event.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[var(--border-subtle)] py-14 text-center">
        <ChatsCircle size={28} className="text-[var(--text-tertiary)]" weight="thin" />
        <p className="mt-3 text-[13px] text-[var(--text-secondary)]">Your published posts will appear here.</p>
      </div>
    </div>
  );
}

export function OrganizerUpgradeGate({ firstName }: { firstName: string }) {
  return (
    <div className="flex h-full p-4 md:p-6 xl:p-8">
      <section className="flex min-h-full flex-1 flex-col justify-center rounded-[34px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-[0_24px_72px_rgba(6,14,9,0.12)] md:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Organizer Mode</p>
        <h1 className="mt-4 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
          Turn {firstName}&apos;s account into an organizer workspace
        </h1>
        <p className="mt-4 max-w-[680px] text-[15px] leading-8 text-[var(--text-secondary)]">
          Organizer Mode keeps the same GoOutside account, feed, and social graph, but unlocks a verified organizer profile, event-first analytics, scheduled content, and community management tools.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Professional dashboard", body: "Track ticket sales, reach, conversion, and event momentum in one place." },
            { title: "Organizer-first profile", body: "Show followers, hosted events, social links, and verified status instead of a personal layout." },
            { title: "Content and moderation", body: "Schedule posts, tag events, and manage comments and snippets from a single workspace." },
          ].map((item) => (
            <article key={item.title} className="rounded-[26px] bg-[var(--bg-elevated)] p-5">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-3 text-[13px] leading-7 text-[var(--text-secondary)]">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-[14px] font-semibold text-black transition hover:opacity-90" href="/profile">
            Update Profile
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-5 py-3 text-[14px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="/organizers">
            Explore organizer network
          </Link>
        </div>
      </section>
    </div>
  );
}

export function OrganizerDashboardView({ dashboard }: { dashboard: OrganizerDashboardData }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div className="p-4 md:p-6 xl:p-8">
      {/* Header */}
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-5 shadow-[0_16px_44px_rgba(6,14,9,0.08)] md:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">Dashboard</h1>
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
              <ChatsCircle size={16} /> Messages
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              href="/organizer/calendar"
            >
              <CalendarBlank size={16} /> Schedule
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:opacity-90"
              href="/organizer/events/new"
            >
              <Sparkle size={16} weight="fill" /> New Event
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3.5 py-2 text-[12px] font-medium transition ${
                activeTab === tab
                  ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "Overview" && <OverviewTab dashboard={dashboard} />}
        {activeTab === "Events" && <EventsTab dashboard={dashboard} />}
        {activeTab === "Audience" && <AudienceTab dashboard={dashboard} />}
        {activeTab === "Ad Campaigns" && <AdCampaignsTab />}
        {activeTab === "Posts & Reels" && <PostsTab dashboard={dashboard} />}
      </div>
    </div>
  );
}

export default OrganizerDashboardView;
