"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookmarkSimple,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  Fire,
  HeartStraight,
  Images,
  MapPin,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import {
  categories,
  events,
  getCategoryEmoji,
  getEventImage,
} from "@gooutside/demo-data";
import HomeSearchHero from "../search/HomeSearchHero";
import { EventSidePane } from "./EventSidePane";

// ── Unsplash avatar pool ──────────────────────────────────────────────────────
const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&w=64&h=64&fit=crop&crop=faces",
];

const SOCIAL_PROOF_SETS = [
  { text: "Ama + Yaw are going", avatarCount: 2 },
  { text: "Esi + 2 friends saved", avatarCount: 3 },
  { text: "Jojo + 4 going", avatarCount: 3 },
  { text: "Kofi thinks you'd love this", avatarCount: 1 },
  { text: "Nana + 1 friend saved", avatarCount: 2 },
  { text: "Your crew is going", avatarCount: 3 },
  { text: "Trending with friends", avatarCount: 2 },
  { text: "Akosua + Kwame going", avatarCount: 2 },
];

const URGENCY_SETS: (string | null)[] = [
  "24 tickets left",
  null,
  "Selling fast",
  null,
  "Only 12 left!",
  null,
  "Almost sold out",
  null,
];

const FRIEND_CLUSTERS = [
  { labels: ["Ama", "Yaw"], note: "bought tickets together" },
  { labels: ["Kofi", "Esi"], note: "saved this event" },
  { labels: ["Jojo"], note: "rated it 5 stars" },
];

const PULSE_BADGES = ["Gold badge x3", "Night owl"];

const INITIAL_COUNT = 6;
const PAGE_SIZE = 4;
const CARDS_PER_SECTION = 3;

const FEED_SECTIONS = [
  { eyebrow: "For you", title: "Picked just for you" },
  { eyebrow: "Happening now", title: "What's happening here" },
  { eyebrow: "You'll love this", title: "Things you'll like" },
];

const ALL_CATEGORY_SLUGS = [
  "music", "food", "sports", "arts", "tech", "nightlife", "culture", "outdoors",
];

function getEventImages(event: (typeof events)[number]): [string, string, string, string, string] {
  const baseIdx = Math.max(0, ALL_CATEGORY_SLUGS.indexOf(event.categorySlug));
  return Array.from({ length: 5 }, (_, i) =>
    getEventImage(undefined, ALL_CATEGORY_SLUGS[(baseIdx + i) % ALL_CATEGORY_SLUGS.length]),
  ) as [string, string, string, string, string];
}

function buildResultList(source: typeof events, limit: number, excludeSlugs: string[] = []) {
  return source.filter((e) => !excludeSlugs.includes(e.slug)).slice(0, limit);
}

function CardHoverActions() {
  return (
    <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition duration-200 group-hover:opacity-100">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-[var(--brand)]"
        onClick={(e) => e.stopPropagation()}
        type="button"
      >
        <HeartStraight size={14} weight="regular" />
      </button>
      <button
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-[var(--brand)]"
        onClick={(e) => e.stopPropagation()}
        type="button"
      >
        <BookmarkSimple size={14} weight="regular" />
      </button>
    </div>
  );
}

function ImageCard({
  event,
  feedIndex = 0,
  onCardClick,
}: {
  event: (typeof events)[number];
  feedIndex?: number;
  onCardClick?: () => void;
}) {
  const images = getEventImages(event);
  const socialProof = SOCIAL_PROOF_SETS[feedIndex % SOCIAL_PROOF_SETS.length]!;
  const urgency = URGENCY_SETS[feedIndex % URGENCY_SETS.length];
  const synopsis = event.shortDescription ?? "";
  const truncated = synopsis.length > 120 ? synopsis.slice(0, 120).trimEnd() + "…" : synopsis;

  const avatarStart = (feedIndex * 2) % AVATAR_POOL.length;
  const avatars = Array.from(
    { length: socialProof.avatarCount },
    (_, i) => AVATAR_POOL[(avatarStart + i) % AVATAR_POOL.length]!,
  );

  return (
    <div
      className="group cursor-pointer self-start overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--home-shadow-strong)]"
      onClick={onCardClick}
      onKeyDown={(e) => e.key === "Enter" && onCardClick?.()}
      role="button"
      tabIndex={0}
    >
      {/* ── Photo grid ── */}
      <div className="relative flex aspect-8/3 overflow-hidden rounded-t-[var(--radius-card-lg)]">

        {/* Hero image — left 56% */}
        <div className="relative w-[56%] shrink-0 overflow-hidden">
          <div
            aria-label={event.title}
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
            role="img"
            style={{ backgroundImage: `url(${images[0]})` }}
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.93)_0%,rgba(0,0,0,0.5)_42%,rgba(0,0,0,0.06)_68%,transparent_100%)]" />

          {/* Category pill */}
          <div className="absolute left-3 top-3 rounded-full border border-white/18 bg-black/28 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            {getCategoryEmoji(event.categorySlug)} {event.eyebrow}
          </div>

          {/* Bottom text block — grows upward on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            {/* Social proof: stacked avatars + text */}
            <div className="mb-2 flex items-center gap-1.5">
              <div className="flex items-center">
                {avatars.map((url, i) => (
                  <img
                    key={i}
                    alt=""
                    className={`h-[26px] w-[26px] rounded-full border-[1.5px] border-white/80 object-cover ${i > 0 ? "-ml-2" : ""}`}
                    src={url}
                  />
                ))}
              </div>
              <span className="rounded-full bg-black/52 px-2 py-0.5 text-[0.62rem] font-semibold text-white backdrop-blur-sm">
                {socialProof.text}
              </span>
            </div>

            {/* Urgency */}
            {urgency && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-[0.63rem] font-bold text-white shadow-sm">
                  🎫 {urgency}
                </span>
              </div>
            )}

            {/* Title */}
            <p className="text-[1.3rem] font-semibold leading-tight tracking-[-0.03em]">
              {event.title}
            </p>

            {/* Synopsis — slides open on hover */}
            {truncated && (
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <p className="pt-1.5 text-[0.8rem] leading-relaxed text-white/88">
                    {truncated}
                    {synopsis.length > 120 && (
                      <span className="ml-1 font-semibold text-[var(--brand)]">read more →</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Date / time */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.78rem] text-white/80">
              <span className="inline-flex items-center gap-1">
                <CalendarBlank size={11} weight="regular" />
                {event.dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} weight="regular" />
                {event.timeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 2×2 image grid — right 44% */}
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-0.5">
          {([images[1], images[2], images[3], images[4]] as string[]).map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                style={{ backgroundImage: `url(${img})` }}
              />
              {i === 3 && (
                <div className="absolute inset-0 flex items-end justify-end bg-black/32 p-1.5">
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-white/25 bg-white/15 px-1.5 py-0.5 text-[0.58rem] font-semibold text-white backdrop-blur-sm">
                    <Images size={8} weight="regular" />
                    All photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <CardHoverActions />
      </div>

      {/* ── Card body — venue + price only ── */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-medium text-[var(--text-primary)]">{event.venue}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[0.8rem] text-[var(--text-secondary)]">
            <MapPin size={12} weight="regular" />
            {event.locationLine}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--brand-dim)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--brand)]">
          {event.priceLabel}
        </span>
      </div>
    </div>
  );
}

function SponsoredAdCard({ event }: { event: (typeof events)[number] }) {
  const imageUrl = getEventImage(undefined, event.categorySlug);
  return (
    <Link
      className="group block overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow-strong)]"
      href={`/events/${event.slug}`}
    >
      <div className="relative aspect-4/1 min-h-45 overflow-hidden">
        <div
          aria-label={event.title}
          className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
          role="img"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,6,0.76)_0%,rgba(5,8,6,0.42)_42%,rgba(5,8,6,0.18)_100%)]" />
        <div className="absolute right-5 top-5 flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/22 text-white backdrop-blur-sm">
            <ArrowRight className="rotate-180" size={20} weight="bold" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/22 text-white backdrop-blur-sm">
            <ArrowRight size={20} weight="bold" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-black/45 px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-white">Sponsored</span>
            <span className="rounded-full border border-[var(--brand)] bg-[rgba(47,143,69,0.18)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-[#8bd98f]">Tech</span>
          </div>
          <h3 className="max-w-135 text-[1.65rem] font-semibold tracking-[-0.04em] text-white md:text-[1.85rem]">{event.title}</h3>
          <p className="mt-2 max-w-155 text-[0.92rem] text-white/82">{event.dateLabel} · {event.timeLabel} · {event.venue}, {event.city}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/12 px-4 py-2.5 text-[0.95rem] font-semibold text-white backdrop-blur-sm">{event.priceValue === 0 ? "Free" : event.priceLabel}</span>
            <span className="rounded-full bg-[#7ed03d] px-6 py-2.5 text-[0.95rem] font-semibold text-white">Get Tickets →</span>
          </div>
        </div>
        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
          <span className="h-3 w-3 rounded-full bg-white/45" />
          <span className="h-3 w-3 rounded-full bg-[#7ed03d]" />
          <span className="h-3 w-3 rounded-full bg-white/45" />
        </div>
      </div>
    </Link>
  );
}

export function HomeClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [selectedEvent, setSelectedEvent] = useState<(typeof events)[number] | null>(null);
  const [paneWidth, setPaneWidth] = useState(520);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedCategories = useMemo(
    () => searchParams.get("category")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const when = (searchParams.get("when") ?? "").trim().toLowerCase();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(event.categorySlug);
      const queryMatch = query.length === 0 || `${event.title} ${event.venue} ${event.city} ${event.shortDescription}`.toLowerCase().includes(query);
      const whenMatch = when.length === 0 || `${event.dateLabel} ${event.timeLabel} ${event.eyebrow}`.toLowerCase().includes(when);
      return categoryMatch && queryMatch && whenMatch;
    });
  }, [query, selectedCategories, when]);

  useEffect(() => { setVisibleCount(INITIAL_COUNT); }, [searchParams]);

  const sponsoredEvent = filteredEvents.find((e) => e.categorySlug === "tech") ?? filteredEvents[0] ?? events[0];

  const allFeedEvents = useMemo(() => {
    const base = filteredEvents.length > 0 ? filteredEvents : events;
    return base.filter((e) => e.slug !== sponsoredEvent?.slug);
  }, [filteredEvents, sponsoredEvent]);

  const visibleEvents = useMemo(() => {
    if (allFeedEvents.length === 0) return [];
    return Array.from({ length: Math.min(visibleCount, allFeedEvents.length * 8) }, (_, i) => {
      const event = allFeedEvents[i % allFeedEvents.length]!;
      return { ...event, _feedIndex: i, _feedKey: `${event.id}-${Math.floor(i / allFeedEvents.length)}` };
    });
  }, [allFeedEvents, visibleCount]);

  const trendingCards = buildResultList(
    filteredEvents.filter((e) => e.trending).length > 0
      ? filteredEvents.filter((e) => e.trending)
      : events.filter((e) => e.trending),
    2,
  );

  const loadMore = useCallback(() => setVisibleCount((p) => p + PAGE_SIZE), []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const updateCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(selectedCategories);
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    if (next.size > 0) params.set("category", Array.from(next).join(","));
    else params.delete("category");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const clearFilters = () => router.push(pathname, { scroll: false });
  const hasFilters = selectedCategories.length > 0 || query.length > 0 || when.length > 0;

  return (
    <>
      <div
        className="transition-[padding-right] duration-300 ease-in-out"
        style={{ paddingRight: selectedEvent ? paneWidth : 0 }}
      >
        <main className="page-grid min-h-screen pb-28">
          <div className="container-shell px-4 pt-6 md:hidden">
            <HomeSearchHero mode="mobile" />
          </div>

          <div className="container-shell px-4 pt-3 md:px-6">
            {hasFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--home-shadow)]">
                <span className="font-medium text-[var(--text-primary)]">
                  {filteredEvents.length} result{filteredEvents.length === 1 ? "" : "s"} for your current plan
                </span>
                <button
                  className="rounded-full border border-[var(--home-highlight-border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]"
                  onClick={clearFilters}
                  type="button"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="container-shell grid gap-8 px-4 pt-2 md:px-6 xl:grid-cols-[minmax(0,1fr)_288px]">
            <div>
              {sponsoredEvent && (
                <section className="mt-6">
                  <SponsoredAdCard event={sponsoredEvent} />
                </section>
              )}

              {/* Category filters */}
              <section className="mt-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedCategories.length === 0 ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
                    onClick={clearFilters}
                    type="button"
                  >
                    All events
                  </button>
                  {categories.map((category) => {
                    const active = selectedCategories.includes(category.slug);
                    return (
                      <button
                        key={category.slug}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
                        onClick={() => updateCategory(category.slug)}
                        type="button"
                      >
                        {getCategoryEmoji(category.slug)} {category.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Infinite scroll feed with section headings */}
              <section className="mt-4 space-y-4">
                {visibleEvents.map((event, idx) => {
                  const isFirstInSection = idx % CARDS_PER_SECTION === 0;
                  const sectionIdx = Math.floor(idx / CARDS_PER_SECTION);
                  const section = FEED_SECTIONS[sectionIdx % FEED_SECTIONS.length]!;
                  return (
                    <Fragment key={event._feedKey}>
                      {isFirstInSection && (
                        <div className={idx === 0 ? "mb-1 mt-4" : "mb-1 mt-10"}>
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                            {section.eyebrow}
                          </p>
                          <h2 className="mt-1.5 text-[1.6rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.85rem]">
                            {section.title}
                          </h2>
                        </div>
                      )}
                      <ImageCard
                        event={event}
                        feedIndex={event._feedIndex}
                        onCardClick={() => setSelectedEvent(event)}
                      />
                    </Fragment>
                  );
                })}

                <div ref={sentinelRef} className="flex items-center justify-center py-6">
                  <span className="inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:0ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:300ms]" />
                  </span>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 xl:sticky xl:top-[118px] xl:self-start">
              <section className="rounded-[var(--radius-card-lg)] border border-[var(--pulse-gold-border)] bg-[linear-gradient(180deg,#fffdf9,#fbf6ed)] p-5 shadow-[var(--home-shadow)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pulse-gold)]">Your Pulse</p>
                    <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Scene Kid</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">153 pts to City Native</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--pulse-gold)] bg-white/80">
                    <span className="text-[1.3rem] font-semibold text-[var(--pulse-gold)]">847</span>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    <span>Scene Kid</span><span>City Native</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgba(var(--pulse-gold-rgb),0.12)]">
                    <div className="h-2 w-[62%] rounded-full bg-[var(--pulse-gold)]" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PULSE_BADGES.map((badge) => (
                    <span key={badge} className="rounded-full border border-[var(--pulse-gold-border)] bg-[var(--pulse-gold-soft)] px-3 py-1 text-[0.68rem] font-semibold text-[var(--pulse-gold)]">{badge}</span>
                  ))}
                </div>
              </section>

              <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Friendtivities</p>
                    <h3 className="mt-1 text-[1.1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Plans in motion</h3>
                  </div>
                  <Link className="text-xs font-medium text-[var(--brand)]" href="/dashboard/notifications">See all</Link>
                </div>
                <div className="space-y-2.5">
                  {(trendingCards.length > 0 ? trendingCards : events.slice(0, 2)).map((event, index) => {
                    const cluster = FRIEND_CLUSTERS[index % FRIEND_CLUSTERS.length]!;
                    return (
                      <Link key={event.id} className="block rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--brand)]/30" href={`/events/${event.slug}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--home-avatar-bg)] text-[var(--brand)]">
                            <UsersThree size={16} weight="regular" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{cluster.labels.join(", ")}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{cluster.note}</p>
                            <p className="mt-2 truncate text-xs font-medium text-[var(--text-primary)]">{event.title}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendUp size={18} weight="bold" className="text-[var(--brand)]" />
                    <h3 className="text-[1.1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Trending now</h3>
                  </div>
                  <Link className="text-xs font-medium text-[var(--brand)]" href="/events">See all</Link>
                </div>
                <div className="space-y-2.5">
                  {trendingCards.map((event, index) => (
                    <Link key={event.id} className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--brand)]/30" href={`/events/${event.slug}`}>
                      <span className="text-lg font-semibold text-[var(--text-tertiary)]">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{event.locationLine}</p>
                      </div>
                      <Fire size={15} weight="fill" className="text-[var(--brand)]" />
                    </Link>
                  ))}
                </div>
              </section>

              <Link className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--home-shadow-strong)]" href="/dashboard/notifications">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--home-avatar-bg)] text-[var(--brand)]">
                  <ChatCircleDots size={20} weight="regular" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Messages</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">4 unread conversations</p>
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">4</div>
              </Link>
            </aside>
          </div>
        </main>
      </div>

      {selectedEvent && (
        <EventSidePane
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onWidthChange={setPaneWidth}
        />
      )}
    </>
  );
}

export default HomeClient;
