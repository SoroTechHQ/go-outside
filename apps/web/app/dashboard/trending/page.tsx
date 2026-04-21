"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendUp,
  Fire,
  MapPin,
  Ticket,
  Heart,
  Users,
  ArrowRight,
  MagnifyingGlass,
  Lightning,
  BookmarkSimple,
} from "@phosphor-icons/react";
import { thumbnailUrl as withThumbnailTransform, bannerUrl as withBannerTransform } from "../../../lib/image-url";

// ── Types ─────────────────────────────────────────────────────────────────────
type TrendingEvent = {
  id: string;
  title: string;
  slug: string;
  banner_url: string | null;
  start_datetime: string | null;
  price_label: string | null;
  trending_score: number | null;
};

type TrendingOrganizer = {
  id: string;
  name: string;
  logo_url: string | null;
  follower_count: number | null;
};

type TrendingTopic = {
  tag: string;
  count: number;
};

type TrendingResponse = {
  section: string;
  events: TrendingEvent[];
  organizers: TrendingOrganizer[];
  topics: TrendingTopic[];
};

// ── API fetcher ───────────────────────────────────────────────────────────────
async function fetchTrending(section: string): Promise<TrendingResponse> {
  const res = await fetch(`/api/trending?section=${section}&limit=20`);
  if (!res.ok) throw new Error("Failed to fetch trending");
  return res.json() as Promise<TrendingResponse>;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TrendingBadge({ score }: { score: number | null }) {
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
  const [saved, setSaved] = useState(false);

  const dateLabel = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" })
    : null;

  return (
    <div className="group relative flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm">
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

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <TrendingBadge score={event.trending_score} />
          <button
            className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors"
            onClick={() => setSaved((v) => !v)}
            type="button"
          >
            <BookmarkSimple
              size={16}
              weight={saved ? "fill" : "regular"}
              className={saved ? "text-[var(--brand)]" : ""}
            />
          </button>
        </div>

        <p className="mt-0.5 text-[14px] font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">
          {event.title}
        </p>

        {dateLabel && (
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <MapPin size={10} weight="fill" />
            <span className="truncate">{dateLabel}</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><Users size={11} weight="fill" /> —</span>
            <span className="flex items-center gap-1"><Heart size={11} weight="fill" /> —</span>
          </div>
          <span className="text-[12px] font-bold text-[var(--brand)]">{event.price_label ?? "Free"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
type TabType = "events" | "organizers" | "topics";

export default function TrendingPage() {
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
      <div className="container-shell px-4 py-6 md:py-10">
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
              What's hot in Ghana right now · Updated every 30 min
            </p>
          </div>

          {/* Search */}
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5">
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
                  <div className="relative overflow-hidden rounded-2xl">
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                          <Fire size={9} weight="fill" /> #1 Trending
                        </span>
                        {filteredEvents[0].trending_score && (
                          <span className="text-[11px] text-white/70">
                            {Math.round(filteredEvents[0].trending_score)} interactions
                          </span>
                        )}
                      </div>
                      <h2 className="text-[17px] font-black text-white leading-tight">
                        {filteredEvents[0].title}
                      </h2>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[12px] text-white/70">
                          <Ticket size={10} weight="fill" className="inline mr-1" />
                          {filteredEvents[0].price_label ?? "Free"}
                        </span>
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
                    className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-default)]"
                  >
                    <div className="relative shrink-0">
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-[var(--bg-muted)]">
                        {org.logo_url && (
                          <img
                            alt={org.name}
                            className="h-full w-full object-cover"
                            src={`${org.logo_url}?width=128&format=webp`}
                          />
                        )}
                      </div>
                      <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-black text-[var(--text-tertiary)]">
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">{org.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[12px] text-[var(--text-secondary)]">
                          {org.follower_count?.toLocaleString() ?? "—"} followers
                        </span>
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)]">
                          <TrendUp size={12} weight="bold" /> Trending
                        </span>
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
                  <div
                    key={topic.tag}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--border-default)] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-[var(--text-tertiary)] w-5 text-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--text-primary)]">#{topic.tag}</p>
                        <p className="text-[12px] text-[var(--text-tertiary)]">
                          {topic.count} {topic.count === 1 ? "snippet" : "snippets"}
                        </p>
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
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
