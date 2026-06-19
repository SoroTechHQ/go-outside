"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarBlank,
  Fire,
  MagnifyingGlass,
  MapPin,
  Sparkle,
  Tag,
  UsersThree,
} from "@phosphor-icons/react";
import { SearchPillExpanded } from "../../components/search/SearchPillExpanded";
import { PageEntrance } from "../../components/layout/PageEntrance";
import { NaviiAvatar } from "../../components/profile/NaviiAvatar";
import { avatarUrl as withAvatarTransform, thumbnailUrl as withThumbnailTransform } from "../../lib/image-url";
import { aiSearchHref } from "../../lib/search/ai-search-href";
import type { SearchApiResponse, EventRow, UserRow, PostRow, DiscoveryModule } from "../../lib/search/types";

type SearchTab = "all" | "events" | "users" | "posts";

const GHANA_CITIES = ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"];

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchSearch(
  q: string,
  type: SearchTab,
  categories: string,
  when: string,
  city: string,
  cursor?: string,
): Promise<SearchApiResponse> {
  const params = new URLSearchParams({ type, limit: "20" });
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  if (categories) params.set("categories", categories);
  if (when) params.set("when", when);
  if (city) params.set("city", city);
  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json() as Promise<SearchApiResponse>;
}

type PeopleSuggestion = {
  id: string;
  clerkId: string;
  name: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
  pulseScore: number;
  pulseTier: string;
  city: string | null;
  interests: string[];
  followerCount: number;
  isFollowing: boolean;
};

async function fetchPeopleYouMayKnow(): Promise<PeopleSuggestion[]> {
  const res = await fetch("/api/users/people?limit=12");
  if (!res.ok) return [];
  const json = await res.json() as { users: PeopleSuggestion[] };
  return json.users ?? [];
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
function EventResult({ event }: { event: EventRow }) {
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

// ── User card — richer with bio, city, interests ────────────────────────────
function UserResult({ user }: { user: UserRow }) {
  const router = useRouter();
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";
  const topInterests = (user.interests ?? []).slice(0, 2);
  const bioSnippet = user.bio ? user.bio.slice(0, 72) + (user.bio.length > 72 ? "…" : "") : null;

  return (
    <button
      onClick={() => router.push(user.username ? `/go/${user.username}` : `/dashboard/user/${user.clerk_id}`)}
      className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 text-left transition hover:border-[var(--border-default)] hover:shadow-sm active:scale-[0.99] w-full"
    >
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 46, height: 46 }}>
        {user.avatar_url ? (
          <Image src={withAvatarTransform(user.avatar_url) ?? user.avatar_url} alt={name} width={46} height={46} className="h-full w-full object-cover" />
        ) : (
          <NaviiAvatar seed={user.username ?? user.clerk_id ?? name} title={name} size={46} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{name}</p>
          {user.pulse_tier && (
            <span className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] font-semibold text-[#4a9f63]">
              {user.pulse_tier}
            </span>
          )}
        </div>
        {user.username && <p className="text-[11px] text-[var(--text-tertiary)]">@{user.username}</p>}
        {bioSnippet && (
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)] line-clamp-1">{bioSnippet}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {user.city && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
              <MapPin size={9} weight="fill" className="text-[var(--brand)]" /> {user.city}
            </span>
          )}
          {topInterests.map((i) => (
            <span key={i} className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-1.5 py-0.5 text-[9px] text-[var(--text-tertiary)]">
              {i}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── People you may know card (from /api/users/people) ─────────────────────────
function PeopleCard({ person }: { person: PeopleSuggestion }) {
  const topInterests = person.interests.slice(0, 2);
  const bioSnippet = person.bio ? person.bio.slice(0, 64) + (person.bio.length > 64 ? "…" : "") : null;

  return (
    <Link
      href={person.clerkId ? `/dashboard/user/${person.clerkId}` : "#"}
      className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 transition hover:border-[var(--border-default)] hover:shadow-sm active:scale-[0.99]"
    >
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 46, height: 46 }}>
        {person.avatarUrl ? (
          <Image src={withAvatarTransform(person.avatarUrl) ?? person.avatarUrl} alt={person.name} width={46} height={46} className="h-full w-full object-cover" />
        ) : (
          <NaviiAvatar seed={person.clerkId} title={person.name} size={46} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{person.name}</p>
          <span className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] font-semibold text-[#4a9f63]">
            {person.pulseTier}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)]">{person.handle}</p>
        {bioSnippet && (
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)] line-clamp-1">{bioSnippet}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {person.city && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
              <MapPin size={9} weight="fill" className="text-[var(--brand)]" /> {person.city}
            </span>
          )}
          {topInterests.map((i) => (
            <span key={i} className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-1.5 py-0.5 text-[9px] text-[var(--text-tertiary)]">
              {i}
            </span>
          ))}
          {person.followerCount > 0 && (
            <span className="text-[10px] text-[var(--text-tertiary)]">{person.followerCount} followers</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Post card ───────────────────────────────────────────────────────────────
function PostResult({ post }: { post: PostRow }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] line-clamp-3">{post.body}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {post.vibe_tags?.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] text-[#4a9f63]">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Discovery module section ───────────────────────────────────────────────────
function DiscoverySection({ module: m }: { module: DiscoveryModule }) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{m.title}</h2>
      <div className="space-y-2.5">
        {m.items.map((e) => <EventResult key={e.id} event={e} />)}
      </div>
    </section>
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
  { id: "all",    label: "All"    },
  { id: "events", label: "Events" },
  { id: "users",  label: "People" },
  { id: "posts",  label: "Posts"  },
];

// ── Inner search component ────────────────────────────────────────────────────
function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ    = searchParams.get("q") ?? "";
  const initialCats = searchParams.get("categories") ?? "";
  const initialWhen = searchParams.get("when") ?? "";

  const [tab, setTab] = useState<SearchTab>("all");
  const [cityFilter, setCityFilter] = useState<string>("");

  // localQ tracks live typing via onQueryChange — updates results without router.push
  const [localQ, setLocalQ] = useState(initialQ);
  useEffect(() => { setLocalQ(initialQ); }, [initialQ]);

  const debouncedQ      = useDebounce(localQ, 300);
  const debouncedCats   = useDebounce(initialCats, 300);
  const debouncedCity   = useDebounce(cityFilter, 200);

  const hasQuery = debouncedQ.length >= 2 || debouncedCats.length > 0 || initialWhen.length > 0 || !!debouncedCity;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SearchApiResponse>({
    queryKey: ["search", debouncedQ, tab, debouncedCats, initialWhen, debouncedCity],
    queryFn: ({ pageParam }) =>
      fetchSearch(debouncedQ, tab, debouncedCats, initialWhen, debouncedCity, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: hasQuery,
    staleTime: 60_000,
  });

  // Empty-state discovery (no query, not People tab)
  const { data: discoveryData, isLoading: discoveryLoading } = useInfiniteQuery<SearchApiResponse>({
    queryKey: ["search-discovery"],
    queryFn: () => fetchSearch("", "all", "", "", ""),
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
    enabled: !hasQuery && tab !== "users",
    staleTime: 5 * 60_000,
  });

  // People discovery — shown when People tab open with no query
  const { data: peopleData, isLoading: peopleLoading } = useQuery({
    queryKey: ["people-discovery"],
    queryFn: fetchPeopleYouMayKnow,
    enabled: !hasQuery && tab === "users",
    staleTime: 5 * 60_000,
  });

  const allPages     = data?.pages ?? [];
  const events       = allPages.flatMap((p) => p.events);
  const users        = allPages.flatMap((p) => p.users);
  const posts        = allPages.flatMap((p) => p.posts);
  const discovery    = discoveryData?.pages?.[0]?.discovery ?? [];
  const currentIntent = allPages[0]?.intent;

  const isPeopleTab = tab === "users";

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <PageEntrance className="container-shell px-4 pb-6 pt-8 md:py-10">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* ── Search bar ── */}
          <SearchPillExpanded
            initialQuery={initialQ}
            initialCategories={initialCats ? initialCats.split(",") : []}
            initialWhen={initialWhen}
            onQueryChange={setLocalQ}
          />

          {/* ── Tabs ── */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setTab(id); if (id !== "users") setCityFilter(""); }}
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

          {/* ── City filter pills — only on People tab ── */}
          {isPeopleTab && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCityFilter("")}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                  !cityFilter
                    ? "bg-[var(--text-primary)] text-[var(--bg-surface)]"
                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                All cities
              </button>
              {GHANA_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCityFilter(c === cityFilter ? "" : c)}
                  className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                    cityFilter === c
                      ? "bg-[#5FBF2A] text-white"
                      : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                  }`}
                >
                  <MapPin size={9} weight="fill" /> {c}
                </button>
              ))}
            </div>
          )}

          {/* ── AI CTA — routes to /ai, not inline panel ── */}
          {localQ.length >= 2 && (
            <button
              type="button"
              onClick={() => router.push(aiSearchHref(localQ))}
              className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#5FBF2A]/50 bg-[#f0fae6] px-5 py-4 text-left transition hover:bg-[#e6f7d9] active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3E9E1A] to-[#5FBF2A] shadow-[0_4px_14px_rgba(95,191,42,0.32)]">
                <Sparkle size={16} weight="fill" className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#1a5c0a]">Not finding what you&rsquo;re looking for?</p>
                <p className="text-[12px] text-[#3E9E1A]/80">Ask our AI — it knows Accra&rsquo;s event scene</p>
              </div>
              <ArrowRight size={16} weight="bold" className="shrink-0 text-[#5FBF2A]" />
            </button>
          )}

          {/* ── AI offer from intent parser ── */}
          {currentIntent?.shouldOfferAi && hasQuery && events.length < 3 && (
            <button
              type="button"
              onClick={() => router.push(aiSearchHref(debouncedQ))}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#5FBF2A]/30 bg-[#f0fae6] px-4 py-3.5 text-left transition hover:bg-[#e6f7d9] active:scale-[0.99]"
            >
              <Sparkle size={15} weight="fill" className="text-[#3E9E1A]" />
              <p className="text-[13px] text-[#1a5c0a]">
                This looks like a planning query — <span className="font-semibold">let AI help</span>
              </p>
              <ArrowRight size={14} weight="bold" className="ml-auto shrink-0 text-[#5FBF2A]" />
            </button>
          )}

          {/* ── People discovery — People tab + no query ── */}
          {!hasQuery && isPeopleTab && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersThree size={15} weight="fill" className="text-[var(--brand)]" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {cityFilter ? `People in ${cityFilter}` : "People you may know"}
                  </h2>
                </div>
                <Link href="/people" className="text-[11px] font-semibold text-[var(--brand)] hover:underline">
                  Browse all
                </Link>
              </div>
              {peopleLoading ? (
                <Skeleton count={4} />
              ) : (peopleData ?? []).length > 0 ? (
                <div className="space-y-2.5">
                  {(peopleData ?? []).map((p) => <PeopleCard key={p.clerkId} person={p} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <UsersThree size={32} className="text-[var(--text-tertiary)]" weight="light" />
                  <p className="text-[13px] text-[var(--text-tertiary)]">No one found — try searching by name</p>
                </div>
              )}
            </div>
          )}

          {/* ── Empty state — discovery modules ── */}
          {!hasQuery && !isPeopleTab && (
            discoveryLoading ? (
              <Skeleton count={3} />
            ) : discovery.length > 0 ? (
              <div className="space-y-8">
                {discovery.map((m, i) => <DiscoverySection key={i} module={m} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <MagnifyingGlass size={36} className="text-[var(--text-tertiary)]" weight="light" />
                <p className="text-[14px] text-[var(--text-tertiary)]">
                  Use the search bar above — pick a vibe, date, or let AI surprise you
                </p>
              </div>
            )
          )}

          {/* ── Results ── */}
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
                      {/* City filter on People tab with results */}
                      {tab === "users" && (
                        <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
                          <button
                            onClick={() => setCityFilter("")}
                            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                              !cityFilter
                                ? "bg-[var(--text-primary)] text-[var(--bg-surface)]"
                                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                            }`}
                          >
                            All cities
                          </button>
                          {GHANA_CITIES.map((c) => (
                            <button
                              key={c}
                              onClick={() => setCityFilter(c === cityFilter ? "" : c)}
                              className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                                cityFilter === c
                                  ? "bg-[#5FBF2A] text-white"
                                  : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                              }`}
                            >
                              <MapPin size={9} weight="fill" /> {c}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2.5">
                        {users.map((u) => <UserResult key={u.clerk_id} user={u} />)}
                      </div>
                    </section>
                  )}

                  {(tab === "all" || tab === "posts") && posts.length > 0 && (
                    <section>
                      {tab === "all" && (
                        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Posts</h2>
                      )}
                      <div className="space-y-2.5">
                        {posts.map((s) => <PostResult key={s.id} post={s} />)}
                      </div>
                    </section>
                  )}

                  {events.length === 0 && users.length === 0 && posts.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">No results found</p>
                      <p className="text-[13px] text-[var(--text-tertiary)]">Try different keywords or pick another category.</p>
                      {!isPeopleTab && (
                        <button
                          type="button"
                          onClick={() => router.push(aiSearchHref(localQ))}
                          className="mt-2 flex items-center gap-2 rounded-full bg-[#5FBF2A] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#4da823]"
                        >
                          <Sparkle size={13} weight="fill" /> Ask AI instead
                        </button>
                      )}
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

          {/* ── People tab footer CTA ── */}
          {isPeopleTab && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Tag size={12} className="text-[var(--text-tertiary)]" />
              <Link href="/people" className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--brand)]">
                Browse the full community directory
              </Link>
            </div>
          )}

        </div>
      </PageEntrance>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="page-grid min-h-screen pb-36 md:pb-24">
        <section className="container-shell px-4 py-6 md:py-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="h-16 rounded-full bg-[var(--bg-muted)] animate-pulse" />
            <div className="h-64 rounded-3xl bg-[var(--bg-muted)] animate-pulse" />
          </div>
        </section>
      </main>
    }>
      <SearchInner />
    </Suspense>
  );
}
