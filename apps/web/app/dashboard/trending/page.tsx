"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  TrendUp,
  Fire,
  CalendarBlank,
  Ticket,
  Heart,
  Users,
  ArrowRight,
  MagnifyingGlass,
  Lightning,
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

// ── API fetcher ───────────────────────────────────────────────────────────────
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
  return reasons.slice(0, 2).map((reason) => reason.value).join(" · ");
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TrendingBadge({ score }: { score: number }) {
  if (!score || score <= 0) return null;
  if (score >= 100) return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">
      <Fire size={9} weight="fill" /> Hot
    </span>
  );
  if (score >= 30) return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
      <TrendUp size={9} weight="bold" /> Rising
    </span>
  );
  return (
    <span className="flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand)]">
      <Lightning size={9} weight="fill" /> New
    </span>
  );
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
  const router = useRouter();
  const dateLabel = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" })
    : null;

  return (
    <div
      className="group relative flex w-full cursor-pointer gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left transition-all hover:border-[var(--border-default)] hover:shadow-sm"
      onClick={() => router.push(`/events/${event.slug}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/events/${event.slug}`);
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-1">
        <span className="text-[18px] font-black text-[var(--text-tertiary)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        {event.trending_score && event.trending_score > 0 && (
          <span className="text-[9px] text-[var(--brand)] font-bold">
            +{Math.round(event.trending_score)}
          </span>
        )}
      </div>

      <Link href={`/events/${event.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
        {event.banner_url && (
          <img
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={withThumbnailTransform(event.banner_url) ?? event.banner_url}
          />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <TrendingBadge score={event.trending_score} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Live rank
          </span>
        </div>

        <Link href={`/events/${event.slug}`} className="block">
          <p className="mt-0.5 text-[14px] font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">
            {event.title}
          </p>
        </Link>

        {dateLabel && (
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <CalendarBlank size={10} weight="fill" />
            <span className="truncate">{dateLabel}</span>
          </div>
        )}

        {event.reasons.length > 0 && (
          <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-tertiary)]">
            {reasonSummary(event.reasons)}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><Users size={11} weight="fill" /> {compactNumber(event.snippet_count)}</span>
            <span className="flex items-center gap-1"><Heart size={11} weight="fill" /> {compactNumber(event.saves_count)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-[var(--brand)]">{event.price_label ?? "Free"}</span>
            <Link
              className="text-[11px] font-semibold text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--brand)] hover:underline"
              href={`/dashboard/trending/events/${event.slug}`}
              onClick={(e) => e.stopPropagation()}
            >
              Why trending
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
type TabType = "events" | "organizers" | "topics";

export default function TrendingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("events");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<TrendingResponse>({
    queryKey: ["trending", tab],
    queryFn: () => fetchTrending(tab),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
              <h1 className="text-[24px] font-black text-[var(--text-primary)] tracking-tight">
                Trending
              </h1>
            </div>
            <p className="text-[14px] text-[var(--text-tertiary)]">
              What's hot in Ghana right now
            </p>
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
              Ranked using saves, shares, ticket intent, views, snippets, and recent momentum from the app.
            </p>
          </div>

          {/* Search */}
          <div className="mb-5 md:hidden">
            <MobileUnifiedSearch
              emptyLabel="Search trending events or topics…"
              onSearch={setSearch}
              subtitle="Trending events, organizers, topics"
              value={search}
            />
          </div>

          <div className="mb-5 hidden items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5 md:flex">
            <MagnifyingGlass size={15} weight="bold" className="text-[var(--text-tertiary)] shrink-0" />
            <input
              className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trending events, organizers, topics…"
              value={search}
            />
          </div>

          {/* Tabs */}
          <div className="mb-5 flex rounded-2xl bg-[var(--bg-muted)] p-1 gap-1">
            {(["events", "organizers", "topics"] as TabType[]).map((t) => (
              <button
                key={t}
                className="flex-1 rounded-xl py-2 text-[13px] font-semibold capitalize transition-all"
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "var(--bg-card)" : "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Events tab */}
          {tab === "events" && (
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              ) : filteredEvents.length === 0 ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">
                  No trending events in the last 48h yet.
                </p>
              ) : (
                <>
                  {/* Hero banner — first event */}
                  <div
                    className="relative overflow-hidden rounded-2xl cursor-pointer"
                    onClick={() => router.push(`/events/${filteredEvents[0].slug}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/events/${filteredEvents[0].slug}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    {filteredEvents[0].banner_url ? (
                      <img
                        alt={filteredEvents[0].title}
                        className="h-40 w-full object-cover"
                        src={withBannerTransform(filteredEvents[0].banner_url) ?? filteredEvents[0].banner_url}
                      />
                    ) : (
                      <div className="h-40 w-full bg-gradient-to-br from-[#0e2212] to-[#152a1a]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                          <Fire size={9} weight="fill" /> #1 Trending
                        </span>
                        <span className="text-[11px] text-white/70">
                          {Math.round(filteredEvents[0].trending_score)} trend score
                        </span>
                      </div>
                      <Link href={`/events/${filteredEvents[0].slug}`} onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-[17px] font-black text-white leading-tight">
                          {filteredEvents[0].title}
                        </h2>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[11px] text-white/70">
                        {reasonSummary(filteredEvents[0].reasons)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[12px] text-white/70">
                          <Ticket size={10} weight="fill" className="inline mr-1" />
                          {filteredEvents[0].price_label ?? "Free"}
                        </span>
                        <div className="flex items-center gap-3 text-[12px] font-semibold">
                          <Link
                            href={`/events/${filteredEvents[0].slug}`}
                            className="text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open event
                          </Link>
                          <Link
                            href={`/dashboard/trending/events/${filteredEvents[0].slug}`}
                            className="text-white/80 underline-offset-4 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Why trending
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {filteredEvents.slice(1).map((event, i) => (
                    <TrendingEventCard key={event.id} event={event} index={i + 1} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Organizers tab */}
          {tab === "organizers" && (
            <div className="space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-4">
                Hot Organizers This Week
              </p>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              ) : filteredOrgs.length === 0 ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">
                  No trending organizers yet.
                </p>
              ) : (
                filteredOrgs.map((org, i) => (
                  <div
                    key={org.id}
                    className="flex w-full cursor-pointer gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left transition hover:border-[var(--border-default)]"
                    onClick={() => router.push(org.username ? `/${org.username}` : `/dashboard/user/${org.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(org.username ? `/${org.username}` : `/dashboard/user/${org.id}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    <div className="relative shrink-0">
                      <Link
                        href={org.username ? `/${org.username}` : `/dashboard/user/${org.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-[var(--bg-muted)]">
                          {org.logo_url && (
                            <img
                              alt={org.name}
                              className="h-full w-full object-cover"
                              src={`${org.logo_url}?width=128&format=webp`}
                            />
                          )}
                        </div>
                      </Link>
                      <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-black text-[var(--text-tertiary)]">
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={org.username ? `/${org.username}` : `/dashboard/user/${org.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">{org.name}</p>
                      </Link>
                      {org.reasons.length > 0 && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-tertiary)]">
                          {reasonSummary(org.reasons)}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[12px] text-[var(--text-secondary)]">
                          {compactNumber(org.follower_count)} followers · {org.event_count} events
                        </span>
                        <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Topics tab */}
          {tab === "topics" && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-4">
                Trending Topics · Ghana
              </p>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl bg-[var(--bg-muted)] animate-pulse" />
                ))
              ) : filteredTopics.length === 0 ? (
                <p className="py-16 text-center text-[14px] text-[var(--text-tertiary)]">
                  No trending topics yet — post some snippets!
                </p>
              ) : (
                filteredTopics.map((topic, i) => (
                  <Link
                    key={topic.tag}
                    href={`/dashboard/trending/topics/${encodeURIComponent(topic.tag)}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--border-default)] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-[var(--text-tertiary)] w-5 text-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--text-primary)]">#{topic.tag}</p>
                        <p className="text-[12px] text-[var(--text-tertiary)]">
                          {topic.count} {topic.count === 1 ? "snippet" : "snippets"} · {topic.event_count} events
                        </p>
                        {topic.reasons.length > 0 && (
                          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                            {reasonSummary(topic.reasons)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {topic.count >= 10 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500 flex items-center gap-1">
                          <Fire size={9} weight="fill" /> Trending
                        </span>
                      )}
                      <ArrowRight size={14} className="text-[var(--text-tertiary)]" />
                    </div>
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
