"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CalendarBlank,
  Fire,
  Hash,
  Heart,
  Lightning,
  MagnifyingGlass,
  Minus,
  Ticket,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import { thumbnailUrl as withThumbnailTransform, bannerUrl as withBannerTransform } from "../../../lib/image-url";
import MobileUnifiedSearch from "../../../components/search/MobileUnifiedSearch";
import type {
  TrendReason,
  TrendingEvent,
  TrendingOrganizer,
  TrendingResponse,
  TrendingTopic,
} from "../../../lib/trending/types";

async function fetchTrending(section: string): Promise<TrendingResponse> {
  const res = await fetch(`/api/trending?section=${section}&limit=20`);
  if (!res.ok) throw new Error("Failed to fetch trending");
  return res.json() as Promise<TrendingResponse>;
}

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function reasonSummary(reasons: TrendReason[]) {
  return reasons.slice(0, 2).map((r) => r.value).join(" · ");
}

function HeatBadge({ score }: { score: number }) {
  if (!score || score <= 0) return null;
  if (score >= 100) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">
      <Fire size={9} weight="fill" /> Hot
    </span>
  );
  if (score >= 30) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
      <TrendUp size={9} weight="bold" /> Rising
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand)]">
      <Lightning size={9} weight="fill" /> New
    </span>
  );
}

function RankArrow({ change }: { change: "up" | "same" | "down" }) {
  if (change === "up") return <ArrowUp size={11} weight="bold" className="text-emerald-500" />;
  if (change === "down") return <ArrowDown size={11} weight="bold" className="text-red-400" />;
  return <Minus size={11} weight="bold" className="text-[var(--text-tertiary)]" />;
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 animate-pulse">
      <div className="h-20 w-20 shrink-0 rounded-xl bg-[var(--bg-muted)]" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-1/3 rounded bg-[var(--bg-muted)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--bg-muted)]" />
        <div className="h-3 w-1/2 rounded bg-[var(--bg-muted)]" />
      </div>
    </div>
  );
}

function TrendingEventCard({ event, index }: { event: TrendingEvent; index: number }) {
  const dateLabel = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" })
    : null;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex w-full gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left transition-all hover:border-[var(--border-default)] hover:shadow-sm"
    >
      {/* Rank + movement */}
      <div className="flex w-8 shrink-0 flex-col items-center gap-1.5 pt-1">
        <span className="text-[18px] font-black leading-none text-[var(--text-tertiary)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <RankArrow change={event.rank_change} />
      </div>

      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
        {event.banner_url && (
          <img
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={withThumbnailTransform(event.banner_url) ?? event.banner_url}
          />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <HeatBadge score={event.trending_score} />
        </div>

        <p className="mt-1 line-clamp-2 text-[14px] font-bold leading-tight text-[var(--text-primary)]">
          {event.title}
        </p>

        {dateLabel && (
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <CalendarBlank size={10} weight="fill" />
            <span className="truncate">{dateLabel}</span>
          </div>
        )}

        {event.reasons.length > 0 && (
          <p className="mt-1 line-clamp-1 text-[11px] text-[var(--text-tertiary)]">
            {reasonSummary(event.reasons)}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <UsersThree size={11} weight="fill" /> {compactNumber(event.snippet_count)}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={11} weight="fill" /> {compactNumber(event.saves_count)}
            </span>
            <span className="flex items-center gap-1">
              <Ticket size={11} weight="fill" /> {event.price_label ?? "Free"}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[var(--brand)]">
            {Math.round(event.trending_score)} pts
          </span>
        </div>
      </div>
    </Link>
  );
}

type TabType = "events" | "organizers" | "topics";

const TABS: { id: TabType; label: string; icon: typeof Fire }[] = [
  { id: "events",     label: "Events",     icon: Fire },
  { id: "organizers", label: "Organizers", icon: UsersThree },
  { id: "topics",     label: "Topics",     icon: Hash },
];

export default function TrendingPage() {
  const [tab, setTab] = useState<TabType>("events");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery<TrendingResponse>({
    queryKey: ["trending", tab],
    queryFn: () => fetchTrending(tab),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const filteredEvents = (data?.events ?? []).filter((e) =>
    search === "" || e.title.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredOrgs = (data?.organizers ?? []).filter((o) =>
    search === "" || o.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredTopics = (data?.topics ?? []).filter((t) =>
    search === "" || t.tag.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="page-grid min-h-screen pb-28">
      <div className="container-shell px-4 pb-6 pt-8 md:py-10">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Fire size={22} weight="fill" className="text-red-500" />
              <h1 className="text-[24px] font-black tracking-tight text-[var(--text-primary)]">
                Trending
              </h1>
            </div>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Ranked by interactions, saves, snippets, tickets, and your location.
            </p>
          </div>

          {/* Search */}
          <div className="mb-5 md:hidden">
            <MobileUnifiedSearch
              emptyLabel="Search trending…"
              onSearch={setSearch}
              subtitle="Events, organizers, topics"
              value={search}
            />
          </div>
          <div className="mb-5 hidden items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5 md:flex">
            <MagnifyingGlass size={15} weight="bold" className="shrink-0 text-[var(--text-tertiary)]" />
            <input
              className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trending…"
              value={search}
            />
          </div>

          {/* Underline tabs — no white pill background */}
          <div className="mb-6 flex gap-6 border-b border-[var(--border-subtle)]">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 pb-3 text-[13px] font-semibold transition-colors ${
                  tab === id
                    ? "border-b-2 border-[var(--brand)] text-[var(--brand)] -mb-px"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={13} weight={tab === id ? "fill" : "regular"} />
                {label}
              </button>
            ))}
          </div>

          {/* Events */}
          {tab === "events" && (
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              ) : isError ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">Could not load — please try again.</p>
              ) : filteredEvents.length === 0 ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">No trending events in the last 48h yet.</p>
              ) : (
                <>
                  {/* Hero — #1 event */}
                  <Link
                    href={`/events/${filteredEvents[0].slug}`}
                    className="relative block overflow-hidden rounded-2xl"
                  >
                    {filteredEvents[0].banner_url ? (
                      <img
                        alt={filteredEvents[0].title}
                        className="h-44 w-full object-cover"
                        src={withBannerTransform(filteredEvents[0].banner_url) ?? filteredEvents[0].banner_url}
                      />
                    ) : (
                      <div className="h-44 w-full bg-gradient-to-br from-[#0e2212] to-[#152a1a]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <Fire size={9} weight="fill" /> #1 Trending
                        </span>
                        <RankArrow change={filteredEvents[0].rank_change} />
                      </div>
                      <h2 className="text-[17px] font-black leading-tight text-white">
                        {filteredEvents[0].title}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-[11px] text-white/70">
                        {reasonSummary(filteredEvents[0].reasons)}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[12px] font-semibold text-white/80">
                        <span className="flex items-center gap-1">
                          <Ticket size={10} weight="fill" />
                          {filteredEvents[0].price_label ?? "Free"}
                        </span>
                        <span>{Math.round(filteredEvents[0].trending_score)} trend pts</span>
                      </div>
                    </div>
                  </Link>

                  {filteredEvents.slice(1).map((event, i) => (
                    <TrendingEventCard key={event.id} event={event} index={i + 1} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Organizers */}
          {tab === "organizers" && (
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              ) : isError ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">Could not load — please try again.</p>
              ) : filteredOrgs.length === 0 ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">No trending organizers yet.</p>
              ) : (
                filteredOrgs.map((org, i) => (
                  <Link
                    key={org.id}
                    href={org.username ? `/${org.username}` : `/dashboard/user/${org.id}`}
                    className="flex w-full gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-default)]"
                  >
                    <div className="relative shrink-0">
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
                        {org.logo_url && (
                          <img alt={org.name} className="h-full w-full object-cover" src={`${org.logo_url}?width=128&format=webp`} />
                        )}
                      </div>
                      <div className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[11px] font-black text-[var(--text-tertiary)]">
                        {i + 1}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[var(--text-primary)]">{org.name}</p>
                      {org.reasons.length > 0 && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-tertiary)]">{reasonSummary(org.reasons)}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
                        <span>{compactNumber(org.follower_count)} followers · {org.event_count} events</span>
                        <HeatBadge score={org.trending_score} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Topics */}
          {tab === "topics" && (
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--bg-muted)]" />
                ))
              ) : isError ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">Could not load — please try again.</p>
              ) : filteredTopics.length === 0 ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">No trending topics yet — post some snippets!</p>
              ) : (
                filteredTopics.map((topic, i) => (
                  <Link
                    key={topic.tag}
                    href={`/dashboard/trending/topics/${encodeURIComponent(topic.tag)}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--border-default)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-[13px] font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--text-primary)]">#{topic.tag}</p>
                        <p className="text-[12px] text-[var(--text-tertiary)]">
                          {topic.count} {topic.count === 1 ? "snippet" : "snippets"} · {topic.event_count} events
                        </p>
                      </div>
                    </div>
                    <HeatBadge score={topic.trending_score} />
                  </Link>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
