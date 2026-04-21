"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import Avatar from "boring-avatars";
import {
  CalendarBlank,
  Fire,
  User,
  FileText,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { SearchPillExpanded } from "../../components/search/SearchPillExpanded";
import { avatarUrl as withAvatarTransform, thumbnailUrl as withThumbnailTransform } from "../../lib/image-url";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

type SearchTab = "all" | "events" | "users" | "snippets";
type SearchEvent   = { id: string; title: string; slug: string; banner_url: string | null; start_datetime: string | null; price_label: string | null; trending_score: number | null };
type SearchUser    = { clerk_id: string; first_name: string | null; last_name: string | null; username: string | null; avatar_url: string | null; pulse_tier: string | null; pulse_score: number | null };
type SearchSnippet = { id: string; body: string; vibe_tags: string[]; created_at: string };
type SearchResult  = { events: SearchEvent[]; users: SearchUser[]; snippets: SearchSnippet[]; nextCursor: string | null };

async function fetchSearch(q: string, type: SearchTab, categories: string, cursor?: string): Promise<SearchResult> {
  const params = new URLSearchParams({ q, type, limit: "20" });
  if (cursor) params.set("cursor", cursor);
  if (categories) params.set("categories", categories);
  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json() as Promise<SearchResult>;
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ── Event card ─────────────────────────────────────────────────────────────────
function EventResult({ event }: { event: SearchEvent }) {
  const router = useRouter();
  const date = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString("en-GH", { month: "short", day: "numeric" })
    : null;

  return (
    <button
      onClick={() => router.push(`/events/${event.slug}`)}
      className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 text-left transition hover:border-[var(--border-default)] hover:shadow-sm active:scale-[0.99] w-full"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-muted)]">
        {event.banner_url && (
          <Image src={withThumbnailTransform(event.banner_url) ?? event.banner_url} alt={event.title} fill className="object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">{event.title}</p>
        {date && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
            <CalendarBlank size={10} weight="fill" /> {date}
          </p>
        )}
        <p className="mt-0.5 text-[12px] font-semibold text-[var(--brand)]">{event.price_label ?? "Free"}</p>
      </div>
      {event.trending_score && event.trending_score > 30 && (
        <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-red-500 self-start mt-0.5">
          <Fire size={9} weight="fill" /> Trending
        </span>
      )}
    </button>
  );
}

// ── User card ──────────────────────────────────────────────────────────────────
function UserResult({ user }: { user: SearchUser }) {
  const router = useRouter();
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";

  return (
    <button
      onClick={() => router.push(user.username ? `/go/${user.username}` : `/dashboard/user/${user.clerk_id}`)}
      className="flex gap-3 items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 text-left transition hover:border-[var(--border-default)] hover:shadow-sm active:scale-[0.99] w-full"
    >
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 44, height: 44 }}>
        {user.avatar_url ? (
          <Image src={withAvatarTransform(user.avatar_url) ?? user.avatar_url} alt={name} width={44} height={44} className="h-full w-full object-cover" />
        ) : (
          <Avatar size={44} name={name} variant="beam" colors={AVATAR_COLORS} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{name}</p>
        {user.username && <p className="text-[11px] text-[var(--text-tertiary)]">@{user.username}</p>}
      </div>
      {user.pulse_tier && (
        <span className="shrink-0 rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] font-medium text-[#4a9f63]">
          {user.pulse_tier}
        </span>
      )}
    </button>
  );
}

// ── Snippet card ───────────────────────────────────────────────────────────────
function SnippetResult({ snippet }: { snippet: SearchSnippet }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] line-clamp-3">{snippet.body}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {snippet.vibe_tags?.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] text-[#4a9f63]">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 animate-pulse">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--bg-muted)]" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-3/4 rounded bg-[var(--bg-muted)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--bg-muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS: { id: SearchTab; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "events",   label: "Events" },
  { id: "users",    label: "People" },
  { id: "snippets", label: "Snippets" },
];

// ── Inner search component ────────────────────────────────────────────────────
function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ    = searchParams.get("q") ?? "";
  const initialCats = searchParams.get("categories") ?? "";
  const initialWhen = searchParams.get("when") ?? "";

  const [tab, setTab] = useState<SearchTab>("all");

  const debouncedQ    = useDebounce(initialQ, 300);
  const debouncedCats = useDebounce(initialCats, 300);

  const hasQuery = debouncedQ.length >= 2 || debouncedCats.length > 0;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SearchResult>({
    queryKey: ["search", debouncedQ, tab, debouncedCats],
    queryFn: ({ pageParam }) => fetchSearch(debouncedQ || debouncedCats, tab, debouncedCats, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: hasQuery,
    staleTime: 60_000,
  });

  const allPages = data?.pages ?? [];
  const events   = allPages.flatMap((p) => p.events);
  const users    = allPages.flatMap((p) => p.users);
  const snippets = allPages.flatMap((p) => p.snippets);

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <section className="container-shell px-4 py-6 md:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl italic text-[var(--text-primary)] mb-6 md:text-4xl">
            Search
          </h1>

          {/* Desktop pill */}
          <div className="relative hidden md:block mb-8">
            <SearchPillExpanded
              initialQuery={initialQ}
              initialCategories={initialCats ? initialCats.split(",") : []}
              initialWhen={initialWhen}
            />
          </div>

          {/* Mobile simple input */}
          <div className="relative md:hidden mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const q = fd.get("q") as string;
                router.push(`/search?q=${encodeURIComponent(q)}`);
              }}
            >
              <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 shadow-sm focus-within:border-[#5FBF2A]/40 transition">
                <MagnifyingGlass size={16} weight="bold" className="text-[var(--text-tertiary)] shrink-0" />
                <input
                  name="q"
                  defaultValue={initialQ}
                  className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                  placeholder="Search events, people, snippets…"
                  type="search"
                  autoFocus
                />
              </div>
            </form>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  tab === id
                    ? "bg-[#5FBF2A] text-white"
                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {!hasQuery && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <MagnifyingGlass size={36} className="text-[var(--text-tertiary)]" weight="light" />
              <p className="text-[14px] text-[var(--text-tertiary)]">
                Use the search bar above — pick a vibe, date, or let AI surprise you
              </p>
            </div>
          )}

          {/* Results */}
          {hasQuery && (
            <div className="space-y-6">
              {isLoading ? (
                <Skeleton />
              ) : (
                <>
                  {(tab === "all" || tab === "events") && events.length > 0 && (
                    <section>
                      {tab === "all" && (
                        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Events</h2>
                      )}
                      <div className="space-y-2.5">
                        {events.map((e) => <EventResult key={e.id} event={e} />)}
                      </div>
                    </section>
                  )}

                  {(tab === "all" || tab === "users") && users.length > 0 && (
                    <section>
                      {tab === "all" && (
                        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">People</h2>
                      )}
                      <div className="space-y-2.5">
                        {users.map((u) => <UserResult key={u.clerk_id} user={u} />)}
                      </div>
                    </section>
                  )}

                  {(tab === "all" || tab === "snippets") && snippets.length > 0 && (
                    <section>
                      {tab === "all" && (
                        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Snippets</h2>
                      )}
                      <div className="space-y-2.5">
                        {snippets.map((s) => <SnippetResult key={s.id} snippet={s} />)}
                      </div>
                    </section>
                  )}

                  {events.length === 0 && users.length === 0 && snippets.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">No results found</p>
                      <p className="text-[13px] text-[var(--text-tertiary)]">Try different keywords or pick another category.</p>
                    </div>
                  )}

                  {hasNextPage && (
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)] disabled:opacity-60"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load more"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="page-grid min-h-screen pb-36 md:pb-24">
        <section className="container-shell px-4 py-6 md:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="h-10 w-48 rounded-2xl bg-[var(--bg-muted)] animate-pulse mb-6" />
            <div className="h-16 rounded-full bg-[var(--bg-muted)] animate-pulse mb-8" />
          </div>
        </section>
      </main>
    }>
      <SearchInner />
    </Suspense>
  );
}
