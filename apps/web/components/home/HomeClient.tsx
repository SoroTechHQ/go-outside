"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookmarkSimple,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  Fire,
  HeartStraight,
  Images,
  MapPin,
  Sparkle,
  TrendUp,
  UsersThree,
  Warning,
} from "@phosphor-icons/react";
import { categories, getCategoryEmoji } from "@gooutside/demo-data";
import HomeSearchHero from "../search/HomeSearchHero";
import { EventSidePane } from "./EventSidePane";
import { useAppShell } from "../layout/AppShellContext";
import {
  useInfiniteEvents,
  useSaveEvent,
  useSavedEvents,
  getFilteredEvents,
} from "../../hooks/useEventsQuery";
import { WeekendAssistant } from "../ai/WeekendAssistant";
import { useQueryClient } from "@tanstack/react-query";
import type { FeedEventItem } from "../../lib/app-contracts";
import { pickSectionHeader } from "../../lib/feed-sections";

// ── Unsplash avatar pool (social proof) ──────────────────────────────────────
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

const FRIEND_CLUSTERS = [
  { labels: ["Ama", "Yaw"], note: "bought tickets together" },
  { labels: ["Kofi", "Esi"], note: "saved this event" },
  { labels: ["Jojo"], note: "rated it 5 stars" },
];

const PULSE_BADGES = ["Gold badge x3", "Night owl"];

const CARDS_PER_SECTION = 3;

// ── Scarcity pill from DB data ────────────────────────────────

function ScarcityBadge({ scarcity }: { scarcity: FeedEventItem["scarcity"] }) {
  if (!scarcity || scarcity.state === "normal") return null;

  const styles = {
    critical: "bg-red-500 text-white",
    low:      "bg-orange-500 text-white",
    sold_out: "bg-[var(--text-tertiary)] text-white",
  } as const;

  const icon = scarcity.state === "sold_out" ? "🚫" : "🎫";
  const label = scarcity.state === "sold_out"
    ? "Sold out"
    : scarcity.label ?? (scarcity.ticketsRemaining != null ? `${scarcity.ticketsRemaining} left` : "Selling fast");

  return (
    <div className="mb-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.63rem] font-bold shadow-sm ${styles[scarcity.state as keyof typeof styles] ?? styles.low}`}>
        {icon} {label}
      </span>
    </div>
  );
}

// ── Save button — connected to TanStack mutation ───────────────

function SaveButton({ event, className = "" }: { event: FeedEventItem; className?: string }) {
  const { mutate: toggleSave, isPending } = useSaveEvent();
  const { data: savedEventIds } = useSavedEvents();
  const isSaved = savedEventIds?.includes(event.id) ?? event.saved;

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSave({ eventId: event.id, saved: !isSaved });
    },
    [event.id, isSaved, toggleSave]
  );

  return (
    <button
      aria-label={isSaved ? "Remove from saved" : "Save event"}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-[var(--brand)] ${isPending ? "opacity-50" : ""} ${className}`}
      disabled={isPending}
      onClick={handleSave}
      type="button"
    >
      <BookmarkSimple
        size={14}
        weight={isSaved ? "fill" : "regular"}
        className={isSaved ? "text-[var(--brand)]" : ""}
      />
    </button>
  );
}

// ── Card hover actions ─────────────────────────────────────────

function CardHoverActions({ event }: { event: FeedEventItem }) {
  return (
    <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition duration-200 group-hover:opacity-100">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-[var(--brand)]"
        onClick={(e) => e.stopPropagation()}
        type="button"
      >
        <HeartStraight size={14} weight="regular" />
      </button>
      <SaveButton event={event} />
    </div>
  );
}

// ── Hover prefetch for event detail ──────────────────────────

function useHoverPrefetch(slug: string) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      void qc.prefetchQuery({
        queryKey:  ["event", slug],
        queryFn:   async () => {
          const res = await fetch(`/api/events/${slug}`);
          if (!res.ok) return null;
          return res.json();
        },
        staleTime: 5 * 60_000,
      });
    }, 800);
  };

  const onMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { onMouseEnter, onMouseLeave };
}

// ── ImageCard — main event card with real DB banner ───────────

function ImageCard({
  event,
  feedIndex = 0,
  onCardClick,
}: {
  event: FeedEventItem;
  feedIndex?: number;
  onCardClick?: () => void;
}) {
  const { onMouseEnter, onMouseLeave } = useHoverPrefetch(event.slug);
  // Real banner from Supabase Storage, with category-colour fallback
  const bannerUrl = event.bannerUrl || event.gallery?.[0];
  // Gallery images from DB (up to 4 extra slots)
  const galleryImages = event.gallery?.slice(1, 5) ?? [];

  const fallbackProof = SOCIAL_PROOF_SETS[feedIndex % SOCIAL_PROOF_SETS.length]!;
  const friendNames = event._friendNames ?? [];
  const socialProofText = friendNames.length > 0
    ? friendNames.length === 1
      ? `${friendNames[0]} is going`
      : `${friendNames[0]} + ${friendNames.length - 1} friend${friendNames.length > 2 ? "s" : ""} going`
    : fallbackProof.text;
  const avatarCount = friendNames.length > 0 ? Math.min(friendNames.length, 3) : fallbackProof.avatarCount;

  const synopsis = event.shortDescription ?? "";
  const truncated = synopsis.length > 120 ? synopsis.slice(0, 120).trimEnd() + "…" : synopsis;

  const avatarStart = (feedIndex * 2) % AVATAR_POOL.length;
  const avatars = Array.from(
    { length: avatarCount },
    (_, i) => AVATAR_POOL[(avatarStart + i) % AVATAR_POOL.length]!,
  );

  return (
    <div
      className="group w-full min-w-0 cursor-pointer overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow)] transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-[var(--home-shadow-strong)]"
      onClick={onCardClick}
      onKeyDown={(e) => e.key === "Enter" && onCardClick?.()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
    >
      {/* ── Photo grid ── */}
      <div className="relative flex aspect-[3/2] overflow-hidden rounded-t-[var(--radius-card-lg)] sm:aspect-[8/3]">

        {/* Hero image — full-width on mobile, left 56% on sm+ */}
        <div className="relative w-full shrink-0 overflow-hidden sm:w-[56%]">
          {bannerUrl ? (
            <div
              aria-label={event.title}
              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
              role="img"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
          ) : (
            // Category-colour fallback — always beautiful with no image
            <div
              className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`}
              role="img"
              aria-label={event.title}
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.93)_0%,rgba(0,0,0,0.5)_42%,rgba(0,0,0,0.06)_68%,transparent_100%)]" />

          {/* Category pill — AI-picked events get a Sparkle accent */}
          <div className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm ${event._aiPicked ? "border-[var(--brand)]/50 bg-[var(--brand)]/25" : "border-white/18 bg-black/28"}`}>
            {event._aiPicked && <Sparkle size={9} weight="fill" className="text-[var(--brand)] shrink-0" />}
            {getCategoryEmoji(event.categorySlug)} {event.eyebrow}
          </div>

          {/* Bottom text block */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            {/* Social proof */}
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
                {socialProofText}
              </span>
            </div>

            {/* Real scarcity badge from DB */}
            <ScarcityBadge scarcity={event.scarcity} />

            {/* Title */}
            <p className="text-[1.1rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[1.3rem]">
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

            {/* Date / time — real from DB */}
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

        {/* 2×2 image grid — real gallery from DB */}
        <div className="hidden sm:grid flex-1 grid-cols-2 grid-rows-2 gap-0.5">
          {Array.from({ length: 4 }, (_, i) => {
            const img = galleryImages[i] ?? bannerUrl;
            return (
              <div key={i} className="relative overflow-hidden">
                {img ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone} opacity-80`} />
                )}
                {i === 3 && (
                  <div className="absolute inset-0 flex items-end justify-end bg-black/32 p-1.5">
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-white/25 bg-white/15 px-1.5 py-0.5 text-[0.58rem] font-semibold text-white backdrop-blur-sm">
                      <Images size={8} weight="regular" />
                      All photos
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <CardHoverActions event={event} />
      </div>

      {/* ── Card body — venue + price ── */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-semibold text-[var(--text-primary)]">{event.venue}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[0.78rem] text-[var(--text-secondary)]">
            <MapPin size={12} weight="regular" />
            {event.locationLine}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-[var(--brand-dim)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--brand)]">
            {event.priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sponsored ad card ──────────────────────────────────────────

function SponsoredAdCard({ event }: { event: FeedEventItem }) {
  const bannerUrl = event.gallery?.[0] ?? (event as FeedEventItem & { bannerUrl?: string }).bannerUrl;
  return (
    <Link
      className="group block overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow-strong)] active:scale-[0.99]"
      href={`/events/${event.slug}`}
    >
      <div className="relative min-h-[180px] overflow-hidden sm:min-h-[220px] md:aspect-[4/1] md:min-h-0">
        {bannerUrl ? (
          <div
            aria-label={event.title}
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
            role="img"
            style={{ backgroundImage: `url(${bannerUrl})`, aspectRatio: "3/1" }}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(5,8,6,0.82)_0%,rgba(5,8,6,0.38)_60%,rgba(5,8,6,0.14)_100%)] md:bg-[linear-gradient(90deg,rgba(5,8,6,0.76)_0%,rgba(5,8,6,0.42)_42%,rgba(5,8,6,0.18)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-7">
          <div className="mb-2.5 flex flex-wrap items-center gap-2 md:mb-4 md:gap-3">
            {event.featured && (
              <span className="rounded-full bg-black/45 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white md:px-4 md:py-2 md:text-[0.74rem]">Featured</span>
            )}
            <span className="rounded-full border border-[var(--brand)] bg-[rgba(47,143,69,0.18)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8bd98f] md:px-4 md:py-2 md:text-[0.74rem]">
              {event.eyebrow}
            </span>
          </div>
          <h3 className="text-[1.25rem] font-semibold leading-tight tracking-[-0.03em] text-white md:max-w-[540px] md:text-[1.85rem]">{event.title}</h3>
          <p className="mt-1.5 text-[0.8rem] text-white/75 md:mt-2 md:text-[0.92rem]">{event.dateLabel} · {event.venue}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-5 md:gap-3">
            <span className="rounded-full border border-white/20 bg-white/12 px-3.5 py-2 text-[0.82rem] font-semibold text-white backdrop-blur-sm md:px-4 md:py-2.5 md:text-[0.95rem]">{event.priceLabel}</span>
            <span className="rounded-full bg-[#7ed03d] px-4 py-2 text-[0.82rem] font-semibold text-white md:px-6 md:py-2.5 md:text-[0.95rem]">Get Tickets →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Feed skeleton ──────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)]">
          <div className="aspect-[8/3] w-full bg-[var(--bg-muted)]" />
          <div className="flex items-center justify-between gap-3 px-3.5 py-3">
            <div className="space-y-2">
              <div className="h-4 w-48 rounded-full bg-[var(--bg-muted)]" />
              <div className="h-3 w-32 rounded-full bg-[var(--bg-muted)]" />
            </div>
            <div className="h-8 w-20 rounded-full bg-[var(--bg-muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main HomeClient component ──────────────────────────────────

export function HomeClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPeekPanelWidth } = useAppShell();

  const [selectedEvent, setSelectedEvent] = useState<FeedEventItem | null>(null);

  const fireInteraction = useCallback((eventId: string, edgeType: string) => {
    void fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, edgeType }),
    });
  }, []);
  const [paneWidth, setPaneWidth] = useState(520);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedCategories = useMemo(
    () => searchParams.get("category")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const when = (searchParams.get("when") ?? "").trim().toLowerCase();

  const filters = useMemo(
    () => ({ categories: selectedCategories, query, when }),
    [selectedCategories, query, when],
  );

  // ── Real data from Supabase via TanStack Query ────────────────
  const { data, fetchNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteEvents(filters);

  const visibleEvents = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  // Filtered events for sidebar widgets (same source, client-side filter)
  const filteredEvents = useMemo(() => getFilteredEvents(filters, visibleEvents), [filters, visibleEvents]);

  // Featured / sponsored card — first featured event in the feed
  const sponsoredEvent = useMemo(
    () => visibleEvents.find((e) => e.featured) ?? visibleEvents[0],
    [visibleEvents],
  );

  // Trending cards for sidebar
  const trendingCards = useMemo(
    () => visibleEvents.filter((e) => e.trending).slice(0, 3),
    [visibleEvents],
  );

  // Dynamic section headers — seeded per page load, stable during scroll
  const sessionSeed = useMemo(() => Math.floor(Date.now() / 1000 / 60), []);
  const now = useMemo(() => new Date(), []);

  const sectionHeaders = useMemo(() => {
    const numSections = Math.ceil(visibleEvents.length / CARDS_PER_SECTION);
    const hour = now.getHours();
    const day = now.getDay();
    return Array.from({ length: numSections }, (_, sectionIdx) => {
      const sectionEvents = visibleEvents.slice(
        sectionIdx * CARDS_PER_SECTION,
        (sectionIdx + 1) * CARDS_PER_SECTION,
      );
      const friendNames = [...new Set(sectionEvents.flatMap((e) => e._friendNames ?? []))];
      return pickSectionHeader(sectionIdx, sessionSeed, friendNames, hour, day);
    });
  }, [visibleEvents, sessionSeed, now]);

  // Sync pane width to AppShellContext
  useEffect(() => { setPeekPanelWidth(selectedEvent ? paneWidth : 0); }, [selectedEvent, paneWidth, setPeekPanelWidth]);
  useEffect(() => () => { setPeekPanelWidth(0); }, [setPeekPanelWidth]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) void fetchNextPage(); },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

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
  const isPaneOpen = selectedEvent !== null;

  return (
    <>
      <div className="w-full overflow-x-hidden">
        <main className="page-grid min-h-screen overflow-x-hidden pb-32 md:pb-16">
          <div className="px-3 pt-5 md:hidden">
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

          <div
            className={`container-shell grid gap-8 px-4 pt-2 md:px-6 xl:grid-cols-[minmax(0,1fr)] ${!isPaneOpen ? "xl:pr-[320px]" : ""}`}
          >
            <div className="min-w-0">
              {/* Featured ad banner — real DB event */}
              {sponsoredEvent && !isLoading && (
                <motion.section
                  className="mt-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SponsoredAdCard event={sponsoredEvent} />
                </motion.section>
              )}

              {/* Category filter chips — from @gooutside/demo-data (matches DB slugs) */}
              <section className="mt-5">
                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
                  <button
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${selectedCategories.length === 0 ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
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
                        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${active ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
                        onClick={() => updateCategory(category.slug)}
                        type="button"
                      >
                        {getCategoryEmoji(category.slug)} {category.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Infinite scroll feed */}
              <section className="mt-4 space-y-4">
                {isLoading && <FeedSkeleton />}

                {isError && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Warning size={32} className="text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Couldn't load events. Try refreshing.</p>
                  </div>
                )}

                {!isLoading && visibleEvents.map((event, idx) => {
                  const isFirstInSection = idx % CARDS_PER_SECTION === 0;
                  const sectionIdx = Math.floor(idx / CARDS_PER_SECTION);
                  const section = sectionHeaders[sectionIdx];
                  return (
                    <Fragment key={event._feedKey}>
                      {isFirstInSection && section && (
                        <motion.div
                          className={idx === 0 ? "mb-1 mt-4" : "mb-1 mt-10"}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                            {section.resolvedEyebrow}
                          </p>
                          <h2 className="mt-1.5 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.85rem]">
                            {section.resolvedTitle}
                          </h2>
                          {section.subtext && (
                            <p className="mt-1 text-[0.8rem] text-[var(--text-secondary)]">{section.subtext}</p>
                          )}
                        </motion.div>
                      )}
                      <motion.div
                        className="min-w-0"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: (idx % CARDS_PER_SECTION) * 0.06 }}
                      >
                        <ImageCard
                          event={event}
                          feedIndex={event._feedIndex}
                          onCardClick={() => {
                            setSelectedEvent(event);
                            fireInteraction(event.id, "peek_open");
                          }}
                        />
                      </motion.div>
                    </Fragment>
                  );
                })}

                {/* Loading more spinner */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                  </div>
                )}

                {/* Intersection sentinel */}
                <div ref={sentinelRef} className="flex items-center justify-center py-6">
                  {!isFetchingNextPage && visibleEvents.length > 0 && (
                    <span className="inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:0ms]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:150ms]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </section>
            </div>

            {/* ── Right sidebar — desktop only (xl+) ── */}
            <div className="hidden xl:block">
            <AnimatePresence initial={false}>
              {!isPaneOpen ? (
                <motion.aside
                  key="home-rail"
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 xl:fixed xl:top-[118px] xl:right-6 xl:w-[288px] xl:max-h-[calc(100vh-134px)] xl:overflow-y-auto xl:[scrollbar-width:none] xl:[&::-webkit-scrollbar]:hidden"
                  exit={{ opacity: 0, x: 24 }}
                  initial={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Weekend AI assistant */}
                  <WeekendAssistant />

                  {/* Pulse score widget */}
                  <section className="rounded-[var(--radius-card-lg)] border border-[var(--pulse-gold-border)] bg-[linear-gradient(180deg,#fffdf9,#fbf6ed)] p-5 shadow-[var(--home-shadow)] dark:bg-[linear-gradient(180deg,#1c1506,#0f0d02)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pulse-gold)]">Your Pulse</p>
                        <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Scene Kid</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">153 pts to City Native</p>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--pulse-gold)] bg-white/80 dark:bg-[var(--pulse-gold-soft)]">
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

                  {/* Friendtivities — real events from feed */}
                  <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Friendtivities</p>
                        <h3 className="mt-1 text-[1.1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Plans in motion</h3>
                      </div>
                      <Link className="text-xs font-medium text-[var(--brand)]" href="/notifications">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                      {(trendingCards.length > 0 ? trendingCards : visibleEvents).slice(0, 2).map((event, index) => {
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

                  {/* Trending now — real feed data */}
                  {trendingCards.length > 0 && (
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
                  )}

                  {/* Messages shortcut */}
                  <Link className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--home-shadow-strong)]" href="/dashboard/messages">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--home-avatar-bg)] text-[var(--brand)]">
                      <ChatCircleDots size={20} weight="regular" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Messages</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">Open your inbox</p>
                    </div>
                  </Link>
                </motion.aside>
              ) : null}
            </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {selectedEvent && (
        <EventSidePane
          event={selectedEvent}
          organizer={undefined}
          onClose={() => setSelectedEvent(null)}
          onWidthChange={setPaneWidth}
        />
      )}
    </>
  );
}

export default HomeClient;
