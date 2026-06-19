"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PageEntrance } from "../../../components/layout/PageEntrance";
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
  Sparkle,
  Ticket,
  TrendUp,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { thumbnailUrl as withThumbnailTransform } from "../../../lib/image-url";
import { AIChatPanel } from "../../../components/search/AIChatPanel";
import { NaviiAvatar } from "../../../components/profile/NaviiAvatar";
import type {
  TrendReason,
  TrendingEvent,
  TrendingOrganizer,
  TrendingResponse,
  TrendingTopic,
} from "../../../lib/trending/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type SearchTab    = "all" | "events" | "users" | "posts";
type TrendingTab  = "events" | "organizers" | "topics";
type SearchEvent  = { id: string; title: string; slug: string; banner_url: string | null; start_datetime: string | null; price_label: string | null; trending_score: number | null };
type SearchUser   = { clerk_id: string; first_name: string | null; last_name: string | null; username: string | null; avatar_url: string | null; pulse_tier: string | null; pulse_score: number | null };
type SearchSnip   = { id: string; body: string; vibe_tags: string[]; created_at: string };
type SearchResult = { events: SearchEvent[]; users: SearchUser[]; posts: SearchSnip[]; nextCursor: string | null };

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useDebounce<T>(val: T, ms: number): T {
  const [d, setD] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setD(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return d;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchSearch(q: string, type: SearchTab): Promise<SearchResult> {
  const p = new URLSearchParams({ type, limit: "20" });
  if (q) p.set("q", q);
  const r = await fetch(`/api/search?${p}`);
  if (!r.ok) throw new Error("Search failed");
  return r.json() as Promise<SearchResult>;
}

async function fetchTrending(section: string): Promise<TrendingResponse> {
  const r = await fetch(`/api/trending?section=${section}&limit=15`);
  if (!r.ok) throw new Error("Failed");
  return r.json() as Promise<TrendingResponse>;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function reasonSummary(reasons: TrendReason[]) {
  return reasons.slice(0, 2).map((r) => r.value).join(" · ");
}

// ─── Shared small components ──────────────────────────────────────────────────
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
  if (change === "up")   return <ArrowUp   size={11} weight="bold" className="text-emerald-500" />;
  if (change === "down") return <ArrowDown size={11} weight="bold" className="text-red-400" />;
  return <Minus size={11} weight="bold" className="text-[var(--text-tertiary)]" />;
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 animate-pulse">
      <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--bg-muted)]" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-1/3 rounded bg-[var(--bg-muted)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--bg-muted)]" />
        <div className="h-3 w-1/2 rounded bg-[var(--bg-muted)]" />
      </div>
    </div>
  );
}

// ─── Search result cards ──────────────────────────────────────────────────────
function EventCard({ e }: { e: SearchEvent }) {
  const date = e.start_datetime
    ? new Date(e.start_datetime).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" })
    : null;
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 transition hover:border-[var(--brand)]/30 active:scale-[0.99]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
        {e.banner_url && (
          <img
            alt={e.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={withThumbnailTransform(e.banner_url) ?? e.banner_url}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-bold leading-tight text-[var(--text-primary)]">{e.title}</p>
        {date && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
            <CalendarBlank size={9} weight="fill" />{date}
          </p>
        )}
        <p className="mt-1 text-[11px] font-medium text-[var(--brand)]">{e.price_label ?? "Free"}</p>
      </div>
    </Link>
  );
}

function UserCard({ u }: { u: SearchUser }) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "User";
  const href = u.username ? `/${u.username}` : "#";
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 transition hover:border-[var(--brand)]/30 active:scale-[0.99]"
    >
      {u.avatar_url ? (
        <img alt={name} src={u.avatar_url} className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
          <NaviiAvatar seed={u.username ?? u.clerk_id ?? name} title={name} size={44} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">{name}</p>
        {u.username && <p className="text-[11px] text-[var(--text-tertiary)]">@{u.username}</p>}
        {u.pulse_tier && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">{u.pulse_tier}</p>
        )}
      </div>
    </Link>
  );
}

function PostCard({ s }: { s: SearchSnip }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
      <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">{s.body}</p>
      {s.vibe_tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {s.vibe_tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand)]">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Search results section ───────────────────────────────────────────────────
function SearchResults({
  q,
  tab,
  onTabChange,
}: {
  q: string;
  tab: SearchTab;
  onTabChange: (t: SearchTab) => void;
}) {
  const { data, isLoading, isError } = useQuery<SearchResult>({
    queryKey: ["explore-search", q, tab],
    queryFn: () => fetchSearch(q, tab),
    enabled: q.trim().length >= 1,
    staleTime: 30_000,
  });

  const TABS: { id: SearchTab; label: string }[] = [
    { id: "all",      label: "All" },
    { id: "events",   label: "Events" },
    { id: "users",    label: "People" },
    { id: "posts", label: "Vibes" },
  ];

  if (!q.trim()) return null;

  const events   = data?.events   ?? [];
  const users    = data?.users    ?? [];
  const posts = data?.posts ?? [];
  const isEmpty  = !isLoading && !isError && events.length === 0 && users.length === 0 && posts.length === 0;

  return (
    <div className="mt-3">
      {/* Type filter tabs */}
      <div className="mb-4 flex gap-0 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${
              tab === id
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2.5">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      )}

      {isError && (
        <p className="py-10 text-center text-[13px] text-[var(--text-tertiary)]">Something went wrong — try again.</p>
      )}

      {isEmpty && (
        <div className="py-16 text-center">
          <MagnifyingGlass size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" weight="regular" />
          <p className="text-[14px] font-semibold text-[var(--text-secondary)]">No results for &ldquo;{q}&rdquo;</p>
          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Try searching something else</p>
        </div>
      )}

      {!isLoading && !isError && !isEmpty && (
        <div className="space-y-6">
          {(tab === "all" || tab === "events") && events.length > 0 && (
            <section>
              {tab === "all" && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Events</p>
              )}
              <div className="space-y-2.5">
                {events.slice(0, tab === "all" ? 3 : 20).map((e) => <EventCard key={e.id} e={e} />)}
              </div>
              {tab === "all" && events.length > 3 && (
                <button
                  onClick={() => onTabChange("events")}
                  className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] py-2.5 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand)]"
                >
                  See all {events.length} events →
                </button>
              )}
            </section>
          )}

          {(tab === "all" || tab === "users") && users.length > 0 && (
            <section>
              {tab === "all" && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">People</p>
              )}
              <div className="space-y-2.5">
                {users.slice(0, tab === "all" ? 3 : 20).map((u) => <UserCard key={u.clerk_id} u={u} />)}
              </div>
              {tab === "all" && users.length > 3 && (
                <button
                  onClick={() => onTabChange("users")}
                  className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] py-2.5 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand)]"
                >
                  See all {users.length} people →
                </button>
              )}
            </section>
          )}

          {(tab === "all" || tab === "posts") && posts.length > 0 && (
            <section>
              {tab === "all" && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Vibes</p>
              )}
              <div className="space-y-2.5">
                {posts.slice(0, tab === "all" ? 3 : 20).map((s) => <PostCard key={s.id} s={s} />)}
              </div>
              {tab === "all" && posts.length > 3 && (
                <button
                  onClick={() => onTabChange("posts")}
                  className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] py-2.5 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand)]"
                >
                  See all {posts.length} vibes →
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Trending section (shown when search is empty) ────────────────────────────
function TrendingPane() {
  const [tab, setTab] = useState<TrendingTab>("events");

  const { data, isLoading, isError } = useQuery<TrendingResponse>({
    queryKey: ["explore-trending", tab],
    queryFn: () => fetchTrending(tab),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const TABS: { id: TrendingTab; label: string; icon: typeof Fire }[] = [
    { id: "events",     label: "Events",     icon: Fire },
    { id: "organizers", label: "Organizers", icon: UsersThree },
    { id: "topics",     label: "Topics",     icon: Hash },
  ];

  return (
    <div className="mt-5">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
        <Fire size={10} weight="fill" className="text-red-500" /> Trending now
      </p>

      {/* Tabs */}
      <div className="mb-4 flex gap-0 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${
              tab === id
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon size={11} weight={tab === id ? "fill" : "regular"} />
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      )}
      {isError && (
        <p className="py-10 text-center text-[13px] text-[var(--text-tertiary)]">Could not load — try again.</p>
      )}

      {!isLoading && !isError && tab === "events" && (
        <div className="space-y-2.5">
          {(data?.events ?? []).slice(0, 10).map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 transition hover:border-[var(--brand)]/30 active:scale-[0.99]"
            >
              <div className="flex w-6 shrink-0 flex-col items-center gap-1 pt-0.5">
                <span className="text-[12px] font-black text-[var(--text-tertiary)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <RankArrow change={event.rank_change} />
              </div>
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
                {event.banner_url && (
                  <img
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={withThumbnailTransform(event.banner_url) ?? event.banner_url}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <HeatBadge score={event.trending_score} />
                <p className="mt-1 line-clamp-2 text-[13px] font-bold leading-tight text-[var(--text-primary)]">
                  {event.title}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1"><Heart size={10} weight="fill" />{compact(event.saves_count)}</span>
                  <span className="flex items-center gap-1"><Ticket size={10} weight="fill" />{event.price_label ?? "Free"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !isError && tab === "organizers" && (
        <div className="space-y-2.5">
          {(data?.organizers ?? []).map((org, i) => (
            <Link
              key={org.id}
              href={org.username ? `/${org.username}` : `/dashboard/user/${org.id}`}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 transition hover:border-[var(--brand)]/30 active:scale-[0.99]"
            >
              <div className="relative shrink-0">
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
                  {org.logo_url && (
                    <img alt={org.name} className="h-full w-full object-cover" src={org.logo_url} />
                  )}
                </div>
                <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[9px] font-black text-[var(--text-tertiary)]">
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">{org.name}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {compact(org.follower_count)} followers · {org.event_count} events
                </p>
              </div>
              <HeatBadge score={org.trending_score} />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !isError && tab === "topics" && (
        <div className="space-y-2">
          {(data?.topics ?? []).map((topic, i) => (
            <Link
              key={topic.tag}
              href={`/dashboard/trending/topics/${encodeURIComponent(topic.tag)}`}
              className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--brand)]/30 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-[11px] font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                <div>
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">#{topic.tag}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {topic.count} posts · {topic.event_count} events
                  </p>
                </div>
              </div>
              <HeatBadge score={topic.trending_score} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [query, setQuery]         = useState("");
  const [searchTab, setSearchTab] = useState<SearchTab>("all");
  const [showAI, setShowAI]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQ = useDebounce(query, 280);
  const hasQuery = debouncedQ.trim().length >= 1;

  // Reset to "all" when query changes
  useEffect(() => { setSearchTab("all"); }, [debouncedQ]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setShowAI(false);
    inputRef.current?.focus();
  }, []);

  return (
    <main className="page-grid min-h-screen pb-28">
      <PageEntrance className="container-shell px-4 pt-6 pb-6">
        <div className="mx-auto max-w-2xl">

          {/* ── Search bar ─────────────────────────────────────────────────── */}
          <div
            className={`flex items-center gap-3 rounded-2xl border bg-[var(--bg-card)] px-4 py-3.5 shadow-sm transition-all ${
              query
                ? "border-[var(--brand)]/50 shadow-[0_0_0_3px_rgba(74,159,99,0.08)]"
                : "border-[var(--border-subtle)]"
            }`}
          >
            <MagnifyingGlass
              size={18}
              weight={query ? "bold" : "regular"}
              className={`shrink-0 transition-colors ${query ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}`}
            />
            <input
              ref={inputRef}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="flex-1 bg-transparent text-[15px] font-medium text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-tertiary)]"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Events, people, vibes…"
              type="search"
              value={query}
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] transition hover:bg-[var(--border-subtle)]"
              >
                <X size={12} weight="bold" className="text-[var(--text-secondary)]" />
              </button>
            )}
          </div>

          {/* ── AI toggle ──────────────────────────────────────────────────── */}
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowAI((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                showAI
                  ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--brand)]"
              }`}
            >
              <Sparkle size={11} weight={showAI ? "fill" : "regular"} />
              AI Search
            </button>
          </div>

          {/* ── AI chat ────────────────────────────────────────────────────── */}
          {showAI && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <AIChatPanel initialQuery="" />
            </div>
          )}

          {/* ── Results or trending ─────────────────────────────────────────── */}
          {hasQuery ? (
            <SearchResults q={debouncedQ} tab={searchTab} onTabChange={setSearchTab} />
          ) : (
            <TrendingPane />
          )}

        </div>
      </PageEntrance>
    </main>
  );
}
