"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracking } from "../tracking/TrackingProvider";
import Link from "next/link";
import { NaviiAvatar } from "../profile/NaviiAvatar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookmarkSimple,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  Fire,
  HeartStraight,
  Images,
  Lightning,
  MapPin,
  Rows,
  SquaresFour,
  Sparkle,
  Ticket,
  TrendUp,
  UserCirclePlus,
  UsersThree,
  Warning,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { WeekendAssistant } from "../ai/WeekendAssistant";
import { EventSidePane } from "./EventSidePane";
import { FollowingFeed } from "./FollowingFeed";
import { PlansFeed } from "./PlansFeed";
import { useAppShell } from "../layout/AppShellContext";
import {
  useInfiniteEvents,
  useSaveEvent,
  useSavedEvents,
  getFilteredEvents,
  useCategories,
} from "../../hooks/useEventsQuery";
import { CategoryIcon } from "../../lib/category-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import type { FeedEventItem } from "../../lib/app-contracts";
import { pickSectionHeaders } from "../../lib/feed-sections";

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

type PulseData = {
  pulse_score: number;
  pulse_tier: string;
  progress_pct: number;
  pts_to_next_tier: number | null;
  next_tier_label: string | null;
  city_rank_label: string | null;
};

const CARDS_PER_SECTION = 4;

type SponsoredSpotlight = {
  href: string;
  external?: boolean;
  label: string;
  eyebrow: string;
  title: string;
  teaser: string;
  dateLabel: string;
  venue: string;
  locationLine: string;
  priceLabel: string;
  bannerUrl: string | null;
  bannerTone: string;
};

export type SponsoredEventRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  banner_url: string | null;
  location_name: string | null;
  location_address: string | null;
  start_datetime: string | null;
  category_slug: string | null;
  sponsored_until: string | null;
};

const SUPERCAR_SPECTACLE_SPOTLIGHT: SponsoredSpotlight = {
  href: "https://supercarspectacle.com/",
  external: true,
  label: "Sponsored",
  eyebrow: "Motorsport Showcase",
  title: "Supercar Spectacle 2026",
  teaser: "Supercars, drifting, vendors, merch, car registration, and a full fan experience coming to Accra.",
  dateLabel: "December 2026",
  venue: "Borteyman Sports Complex",
  locationLine: "Borteyman Sports Complex, Accra",
  priceLabel: "Tickets & Registration",
  bannerUrl: "https://szobygsvdlzypuspcafu.supabase.co/storage/v1/object/public/event-banners/sponsored/supercar-spectacle-hero.jpg",
  bannerTone: "from-[#20120a] via-[#111111] to-[#050505]",
};

// ── Scarcity pill from DB data ────────────────────────────────

function ScarcityBadge({ scarcity }: { scarcity: FeedEventItem["scarcity"] }) {
  if (!scarcity || scarcity.state === "normal") return null;

  const styles = {
    critical: "bg-red-500 text-white",
    low:      "bg-orange-500 text-white",
    sold_out: "bg-[var(--text-tertiary)] text-white",
  } as const;

  const ScarcityIcon = scarcity.state === "sold_out" ? XCircle : Ticket;
  const label = scarcity.state === "sold_out"
    ? "Sold out"
    : scarcity.label ?? (scarcity.ticketsRemaining != null ? `${scarcity.ticketsRemaining} left` : "Selling fast");

  return (
    <div className="mb-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.63rem] font-bold shadow-sm ${styles[scarcity.state as keyof typeof styles] ?? styles.low}`}>
        <ScarcityIcon size={10} weight="fill" /> {label}
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

// ── Event hover — prefetch + algorithm signals + admin tracking ──

function useEventHover(event: { id: string; slug: string }) {
  const qc = useQueryClient();
  const { trackHoverStart } = useTracking();
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingCleanup = useRef<(() => void) | null>(null);

  const onMouseEnter = useCallback(() => {
    // Prefetch event detail at 800ms
    prefetchTimer.current = setTimeout(() => {
      void qc.prefetchQuery({
        queryKey: ["event", event.slug],
        queryFn: async () => {
          const res = await fetch(`/api/events/${event.slug}`);
          if (!res.ok) return null;
          return res.json();
        },
        staleTime: 5 * 60_000,
      });
    }, 800);

    // Fire card_long_dwell at 3.5s — writes to graph_edges, boosts algorithm velocity
    dwellTimer.current = setTimeout(() => {
      void fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, edgeType: "card_long_dwell" }),
      });
    }, 3500);

    // Admin micro-event tracking — writes to user_micro_events for behavioral profile
    trackingCleanup.current = trackHoverStart(event.id, "event");
  }, [event.id, event.slug, qc, trackHoverStart]);

  const onMouseLeave = useCallback(() => {
    if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    trackingCleanup.current?.();
    trackingCleanup.current = null;
  }, []);

  return { onMouseEnter, onMouseLeave };
}

// ── ImageCard — main event card with real DB banner ───────────

function ImageCard({
  event,
  feedIndex = 0,
  onCardClick,
  compact = false,
}: {
  event: FeedEventItem;
  feedIndex?: number;
  onCardClick?: () => void;
  compact?: boolean;
}) {
  const { onMouseEnter, onMouseLeave } = useEventHover(event);
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
      <div className={`relative flex overflow-hidden rounded-t-[var(--radius-card-lg)] ${compact ? "aspect-[4/3]" : "aspect-[3/2] sm:aspect-[8/3]"}`}>

        {/* Hero image — full-width in compact mode, left 56% on sm+ otherwise */}
        <div className={`relative shrink-0 overflow-hidden ${compact ? "w-full" : "w-full sm:w-[56%]"}`}>
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
            <CategoryIcon slug={event.categorySlug} size={10} weight="bold" />
            {event.eyebrow}
          </div>

          {/* Bottom text block */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            {/* Social proof — green-tinted when real friend data, neutral otherwise */}
            <div className="mb-2 flex items-center gap-1.5">
              <div className="flex items-center">
                {avatars.map((url, i) => (
                  <img
                    key={i}
                    alt=""
                    className={`h-[26px] w-[26px] rounded-full border-[1.5px] object-cover ${i > 0 ? "-ml-2" : ""} ${friendNames.length > 0 ? "border-[var(--brand)]/80" : "border-white/80"}`}
                    src={url}
                  />
                ))}
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold backdrop-blur-sm ${friendNames.length > 0 ? "bg-[var(--brand)]/28 text-white ring-1 ring-[var(--brand)]/40" : "bg-black/52 text-white"}`}>
                {friendNames.length > 0 && <UsersThree size={9} weight="fill" className="shrink-0" />}
                {socialProofText}
              </span>
            </div>

            {/* Real scarcity badge from DB */}
            <ScarcityBadge scarcity={event.scarcity} />

            {/* Title */}
            <p className={`font-semibold leading-tight tracking-[-0.03em] ${compact ? "text-[1rem]" : "text-[1.1rem] sm:text-[1.3rem]"}`}>
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

        {/* 2×2 image grid — real gallery from DB, hidden in compact mode */}
        <div className={`flex-1 grid-cols-2 grid-rows-2 gap-0.5 ${compact ? "hidden" : "hidden sm:grid"}`}>
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

function SponsoredAdCard({ spotlight }: { spotlight: SponsoredSpotlight }) {
  const bannerUrl = spotlight.bannerUrl;
  return (
    <a
      className="group block overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow-strong)] active:scale-[0.99]"
      href={spotlight.href}
      rel={spotlight.external ? "noreferrer noopener" : undefined}
      target={spotlight.external ? "_blank" : undefined}
    >
      <div className="relative min-h-[148px] overflow-hidden sm:min-h-[166px] md:aspect-[5/1] md:min-h-0">
        {/* Background image */}
        {bannerUrl ? (
          <div
            aria-label={spotlight.title}
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
            role="img"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${spotlight.bannerTone}`} />
        )}
        {/* Gradient: heavy on left (text), fades right (CTAs breathe) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(4,7,5,0.96)_0%,rgba(4,7,5,0.82)_38%,rgba(4,7,5,0.45)_62%,rgba(4,7,5,0.08)_100%)]" />

        {/* Ad badge */}
        <div className="absolute right-3 top-3">
          <span className="rounded-md border border-white/20 bg-black/55 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/65 backdrop-blur-sm">
            Ad
          </span>
        </div>

        {/* Content row: text left · CTAs right */}
        <div className="absolute inset-0 flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          {/* Left — all text */}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/90">
                {spotlight.label}
              </span>
              <span className="rounded-full border border-[var(--brand)]/60 bg-[rgba(47,143,69,0.2)] px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#a3e9a7]">
                {spotlight.eyebrow}
              </span>
            </div>
            <h3 className="truncate text-[1.05rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[1.2rem] md:text-[1.5rem]">
              {spotlight.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-[0.76rem] text-white/78 sm:line-clamp-2 md:text-[0.88rem]">
              {spotlight.teaser}
            </p>
            <p className="mt-1 truncate text-[0.72rem] text-white/65 md:text-[0.84rem]">
              {spotlight.dateLabel} · {spotlight.venue}
            </p>
          </div>

          {/* Right — CTA buttons stacked */}
          <div className="shrink-0 flex flex-col items-stretch gap-2">
            <span className="whitespace-nowrap rounded-full border border-white/22 bg-white/10 px-3 py-1.5 text-center text-[0.72rem] font-semibold text-white backdrop-blur-sm md:px-4 md:py-2 md:text-[0.84rem]">
              {spotlight.priceLabel}
            </span>
            <span className="whitespace-nowrap rounded-full bg-[#7ed03d] px-3 py-1.5 text-center text-[0.72rem] font-semibold text-white md:px-4 md:py-2 md:text-[0.84rem]">
              View Event →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── Skeleton primitives ────────────────────────────────────────

function SponsoredSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)]">
      <div className="min-h-[148px] bg-[var(--bg-muted)] sm:min-h-[172px] md:aspect-[5/1] md:min-h-0" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1, 2].map((section) => (
        <div key={section}>
          <div className="animate-pulse mb-4 space-y-2">
            <div className="h-2.5 w-20 rounded-full bg-[var(--bg-muted)]" />
            <div className="h-7 w-52 rounded-full bg-[var(--bg-muted)]" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--home-border)] bg-[var(--bg-card)]">
                <div className="aspect-[4/3] w-full bg-[var(--bg-muted)]" />
                <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded-full bg-[var(--bg-muted)]" />
                    <div className="h-3 w-24 rounded-full bg-[var(--bg-muted)]" />
                  </div>
                  <div className="h-8 w-16 rounded-full bg-[var(--bg-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Following posts strip ────────────────────────────────────────────────────

type FollowingPost = {
  id: string;
  body: string;
  created_at: string;
  users: { first_name: string; last_name: string | null; username: string | null; avatar_url: string | null; clerk_id: string };
  events: { title: string; slug: string } | null;
};

const AVATAR_COLORS_FP = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

function FollowingPostsStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ["following-posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts/following");
      if (!res.ok) return { posts: [] };
      return res.json() as Promise<{ posts: FollowingPost[] }>;
    },
    staleTime: 2 * 60_000,
  });

  const posts = data?.posts ?? [];
  if (isLoading || posts.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <UsersThree size={13} weight="fill" className="text-[var(--brand)]" />
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            From your network
          </p>
        </div>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {posts.map((post) => {
          const author = post.users;
          const name = `${author.first_name} ${author.last_name ?? ""}`.trim();
          const href = author.username ? `/go/${author.username}` : `/go/${author.clerk_id}`;
          return (
            <Link
              key={post.id}
              href={href}
              className="group shrink-0 w-[200px] overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 transition hover:border-[var(--brand)]/30 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 28, height: 28 }}>
                  {author.avatar_url ? (
                    <Image src={author.avatar_url} alt={name} width={28} height={28} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#4a9f63]/20 text-[10px] font-bold text-[#4a9f63]">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{name}</p>
                  {author.username && (
                    <p className="truncate text-[10px] text-[var(--text-tertiary)]">@{author.username}</p>
                  )}
                </div>
              </div>
              <p className="line-clamp-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {post.body}
              </p>
              {post.events && (
                <p className="mt-2 truncate text-[10px] font-semibold text-[var(--brand)]">
                  @ {post.events.title}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── This Weekend / This Week — Instagram-style stories row ─────

function getSmartDateLabel(iso: string | null): string {
  if (!iso) return "";
  const event = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toDateString();
  if (event.toDateString() === todayStr) return "Today";
  if (event.toDateString() === tomorrowStr) return "Tomorrow";
  return event.toLocaleDateString("en-GB", { weekday: "short" }); // Mon, Tue…
}

function ThisWeekendRow({ events, onCardClick }: { events: FeedEventItem[]; onCardClick: (e: FeedEventItem) => void }) {
  if (events.length === 0) return null;
  const isWeekend = [0, 6].includes(new Date().getDay());
  const sectionLabel = isWeekend ? "Happening This Weekend" : "Happening This Week";

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightning size={13} weight="fill" className="text-[var(--brand)]" />
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {sectionLabel}
          </p>
        </div>
        <Link href="/?when=this+weekend" className="text-[11px] font-semibold text-[var(--brand)]">
          See all
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {events.map((event) => {
          const smartDate = getSmartDateLabel(event.startDatetime);
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onCardClick(event)}
              className="group flex shrink-0 flex-col items-center gap-1.5 transition active:scale-[0.95]"
            >
              {/* Gradient ring */}
              <div
                className="rounded-[24px] p-[2.5px] shadow-sm transition duration-300 group-hover:shadow-md"
                style={{ background: "linear-gradient(135deg,#bbf451 0%,#4ade80 35%,#22d3ee 65%,#818cf8 100%)" }}
              >
                {/* Dark gap — the Instagram-style breathing room between ring and image */}
                <div className="rounded-[22px] bg-[var(--bg-base,#080d09)] p-[3px]">
                  {/* Square image */}
                  <div className="relative h-[80px] w-[80px] overflow-hidden rounded-[19px] bg-[var(--bg-muted)]">
                    {event.bannerUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.07]"
                        style={{ backgroundImage: `url(${event.bannerUrl})` }}
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${event.bannerTone}`} />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.22)_100%)]" />
                    {event._aiPicked && (
                      <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] shadow">
                        <Sparkle size={7} weight="fill" className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title — single line, truncated with ellipsis so date stays aligned */}
              <p className="w-[92px] truncate text-center text-[0.63rem] font-semibold leading-tight text-[var(--text-primary)]">
                {event.title}
              </p>

              {/* Smart date — always same row, aligned across all cards */}
              <p className="h-[14px] text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {smartDate}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── People you may know — right rail widget ───────────────────

type SidebarPerson = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  reason: string | null;
  isFollowing: boolean;
  followedBy: boolean;
  pulseTier: string | null;
  city: string | null;
  mutualCount: number;
  followerCount: number;
};

function PeopleSidebarWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["people-sidebar"],
    queryFn: async () => {
      const res = await fetch("/api/social/people?limit=4");
      if (!res.ok) return { users: [] };
      const json = await res.json() as { users: SidebarPerson[] };
      return json;
    },
    staleTime: 5 * 60_000,
  });

  const people = (data?.users ?? []).slice(0, 4);

  if (!isLoading && people.length === 0) return null;

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[var(--home-shadow)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <UserCirclePlus size={13} weight="fill" className="text-[var(--brand)]" />
            <h3 className="text-[0.88rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">People you may know</h3>
          </div>
          <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">Based on your interests and connections</p>
        </div>
        <Link className="shrink-0 text-[11px] font-semibold text-[var(--brand)]" href="/people">See all</Link>
      </div>

      {/* Cards */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--bg-muted)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded-full bg-[var(--bg-muted)]" />
                <div className="h-2.5 w-20 rounded-full bg-[var(--bg-muted)]" />
                <div className="h-4 w-16 rounded-full bg-[var(--bg-muted)]" />
              </div>
              <div className="h-7 w-16 shrink-0 rounded-full bg-[var(--bg-muted)]" />
            </div>
          ))
        ) : (
          people.map((person) => (
            <PersonSidebarRow key={person.id} person={person} />
          ))
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-3">
        <Link
          href="/people"
          className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
        >
          Explore the community
          <ArrowRight size={11} weight="bold" />
        </Link>
      </div>
    </section>
  );
}

function PersonSidebarRow({ person }: { person: SidebarPerson }) {
  const [following, setFollowing] = useState(person.isFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    setLoading(true);
    const next = !following;
    setFollowing(next);
    try {
      await fetch("/api/social/follows", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: person.id }),
      });
    } catch {
      setFollowing(!next);
    } finally {
      setLoading(false);
    }
  }, [following, person.id]);

  const href = person.username ? `/go/${person.username}` : `/dashboard/user/${person.id}`;

  // Pick a reason icon based on the reason text
  const reasonIcon = person.reason?.toLowerCase().includes("mutual")
    ? <UsersThree size={9} weight="fill" />
    : person.reason?.toLowerCase().includes("follows")
      ? <UserCirclePlus size={9} weight="fill" />
      : <MapPin size={9} weight="fill" />;

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--bg-elevated)]">
      {/* NaviiAvatar or real photo */}
      <Link href={href} className="shrink-0 mt-0.5">
        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-transparent transition group-hover:ring-[var(--brand)]/25">
          {person.avatarUrl ? (
            <Image src={person.avatarUrl} alt={person.name} width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            <NaviiAvatar seed={person.username ?? person.name} size={40} title={person.name} className="h-full w-full" />
          )}
          {/* Online-style pulse dot if they follow back */}
          {person.followedBy && !following && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--bg-card)] bg-[var(--brand)]" />
          )}
        </div>
      </Link>

      {/* Info block */}
      <div className="min-w-0 flex-1">
        {/* Name row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={href}>
            <p className="text-[12px] font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors">{person.name}</p>
          </Link>
          {person.pulseTier && (
            <span className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-1.5 py-0.5 text-[9px] font-bold text-[var(--brand)]">
              {person.pulseTier}
            </span>
          )}
        </div>

        {/* Username + city */}
        <div className="mt-0.5 flex items-center gap-1 flex-wrap">
          {person.username && (
            <span className="text-[10px] text-[var(--text-tertiary)]">@{person.username}</span>
          )}
          {person.city && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
              {person.username && <span>·</span>}
              <MapPin size={8} weight="fill" className="text-[var(--brand)]/60" />
              {person.city}
            </span>
          )}
        </div>

        {/* Reason chip — why they're suggested */}
        {person.reason && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
            {reasonIcon}
            {person.reason}
          </span>
        )}
      </div>

      {/* Follow button */}
      <button
        onClick={toggle}
        disabled={loading}
        className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 disabled:opacity-50 ${
          following
            ? "border border-[var(--border-default)] bg-transparent text-[var(--text-tertiary)] hover:border-red-400/40 hover:text-red-400"
            : person.followedBy
              ? "border border-[var(--brand)] bg-transparent text-[var(--brand)] hover:bg-[var(--brand)] hover:text-black"
              : "bg-[var(--brand)] text-black hover:opacity-85"
        }`}
        type="button"
      >
        {following ? "Following" : person.followedBy ? "Follow back" : "Follow"}
      </button>
    </div>
  );
}


// ── Main HomeClient component ──────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  music: "Music & Concerts",
  arts: "Arts & Culture",
  food: "Food & Drink",
  sports: "Sports & Fitness",
  networking: "Business & Networking",
  comedy: "Comedy",
  fashion: "Fashion",
  film: "Film & Media",
  tech: "Tech & Innovation",
  wellness: "Wellness & Lifestyle",
  entertainment: "Entertainment",
  community: "Community & Social",
  motorsport: "Motorsport",
};

function dbEventToSpotlight(event: SponsoredEventRow): SponsoredSpotlight {
  const date = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "Coming soon";
  const locationLine = [event.location_name, event.location_address].filter(Boolean).join(", ");
  return {
    href: `/events/${event.slug}`,
    external: false,
    label: "Sponsored",
    eyebrow: CATEGORY_LABELS[event.category_slug ?? ""] ?? "Event",
    title: event.title,
    teaser: event.short_description || event.description || "",
    dateLabel: date,
    venue: event.location_name ?? "",
    locationLine,
    priceLabel: "Tickets & Registration",
    bannerUrl: event.banner_url ?? null,
    bannerTone: "from-[#0a1a12] via-[#0d1a10] to-[#050a05]",
  };
}

export function HomeClient({ sponsoredEvent }: { sponsoredEvent: SponsoredEventRow | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPeekPanelWidth } = useAppShell();

  const [selectedEvent, setSelectedEvent] = useState<FeedEventItem | null>(null);
  const [feedLayout, setFeedLayout] = useState<"single" | "grid">("single");
  const [feedMode, setFeedMode] = useState<"for-you" | "following" | "plans">("for-you");

  // Real categories from DB (replaces hardcoded demo-data)
  const { data: dbCategories = [] } = useCategories();

  const { data: pulseData } = useQuery<PulseData>({
    queryKey: ["pulse", "me"],
    queryFn: () => fetch("/api/users/me/pulse").then((r) => r.json()),
    staleTime: 60_000,
  });

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

  const sponsoredSpotlight = sponsoredEvent ? dbEventToSpotlight(sponsoredEvent) : SUPERCAR_SPECTACLE_SPOTLIGHT;

  // Trending cards for sidebar
  const trendingCards = useMemo(
    () => visibleEvents.filter((e) => e.trending).slice(0, 3),
    [visibleEvents],
  );

  // Weekend events — filter by dateLabel containing weekend day names
  const weekendEvents = useMemo(() => {
    const WEEKEND_TERMS = ["fri", "sat", "sun", "weekend", "dec", "jan", "feb"];
    const candidates = visibleEvents.filter((e) => {
      const label = e.dateLabel.toLowerCase();
      return WEEKEND_TERMS.some((t) => label.includes(t));
    });
    // Fallback to trending if no weekend matches
    return (candidates.length >= 3 ? candidates : visibleEvents.filter((e) => e.trending)).slice(0, 8);
  }, [visibleEvents]);

  // Dynamic section headers — seeded per page load, stable during scroll
  const sessionSeed = useMemo(() => Math.floor(Date.now() / 1000 / 60), []);
  const now = useMemo(() => new Date(), []);

  const sectionHeaders = useMemo(() => {
    const numSections = Math.ceil(visibleEvents.length / CARDS_PER_SECTION);
    const hour = now.getHours();
    const day = now.getDay();
    // Collect friend names across all visible events for the friend-template sections
    const allFriendNames = [...new Set(visibleEvents.flatMap((e) => e._friendNames ?? []))];
    // Pick N unique headers — no repeats across the entire feed
    return pickSectionHeaders(numSections, sessionSeed, allFriendNames, hour, day);
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
          <div className="container-shell px-4 pt-1 md:px-6">
            {hasFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--home-highlight-border)] bg-[var(--brand-dim)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--home-shadow)]">
                <span className="font-medium text-[var(--text-primary)]">
                  {filteredEvents.length} result{filteredEvents.length === 1 ? "" : "s"}
                  {selectedCategories.length > 0
                    ? ` in ${selectedCategories.map((s) => dbCategories.find((c) => c.slug === s)?.name ?? s).join(", ")}`
                    : query
                      ? ` matching "${query}"`
                      : ""}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--home-highlight-border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)]"
                  onClick={clearFilters}
                  type="button"
                >
                  <X size={11} weight="bold" />
                  Clear filter
                </button>
              </div>
            )}
          </div>

          <div
            className={`container-shell grid gap-4 px-4 pt-0 md:px-6 xl:grid-cols-[minmax(0,1fr)] ${!isPaneOpen ? "xl:pr-[320px]" : ""}`}
          >
            <div className="min-w-0">
              {/* Sponsored banner — skeleton while loading */}
              <section className="mt-1">
                {isLoading ? (
                  <SponsoredSkeleton />
                ) : (
                  <SponsoredAdCard spotlight={sponsoredSpotlight} />
                )}
              </section>

              {/* This Weekend / This Week stories row — directly below ad */}
              {!isLoading && weekendEvents.length > 0 && (
                <ThisWeekendRow
                  events={weekendEvents}
                  onCardClick={(event) => {
                    setSelectedEvent(event);
                    fireInteraction(event.id, "peek_open");
                  }}
                />
              )}

              {/* Feed mode tabs: For You | Following | Plans */}
              <div className="mt-4 mb-1 flex gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
                {(["for-you", "following", "plans"] as const).map((mode) => {
                  const labels = { "for-you": "For You", following: "Following", plans: "Plans" };
                  const active = feedMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setFeedMode(mode)}
                      className={`flex-1 rounded-[14px] py-2 text-[13px] font-semibold transition ${
                        active
                          ? "bg-[var(--brand)] text-black shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>

              {/* Following feed */}
              {feedMode === "following" && (
                <div className="mt-2">
                  <FollowingFeed />
                </div>
              )}

              {/* Plans feed */}
              {feedMode === "plans" && (
                <div className="mt-2">
                  <PlansFeed />
                </div>
              )}

              {/* For You feed — only shown when mode is for-you */}
              {feedMode === "for-you" && (
                <>
              {/* Posts from people you follow */}
              <FollowingPostsStrip />

              {/* Category filter chips + layout toggle */}
              <section className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="no-scrollbar -mx-0 flex flex-1 flex-nowrap gap-2 overflow-x-auto pb-1">
                    <button
                      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${selectedCategories.length === 0 ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
                      onClick={clearFilters}
                      type="button"
                    >
                      All events
                    </button>
                    {dbCategories.map((category) => {
                      const active = selectedCategories.includes(category.slug);
                      return (
                        <button
                          key={category.slug}
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${active ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--home-highlight-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
                          onClick={() => updateCategory(category.slug)}
                          type="button"
                        >
                          <CategoryIcon slug={category.slug} iconKey={category.icon_key} size={13} weight="bold" />
                          {category.name}
                          {active && <X size={12} weight="bold" className="ml-0.5 opacity-80" />}
                        </button>
                      );
                    })}
                  </div>
                  {/* Layout toggle — desktop only */}
                  <div className="hidden shrink-0 items-center gap-0.5 rounded-full border border-[var(--home-highlight-border)] bg-[var(--bg-card)] p-1 md:flex">
                    <button
                      type="button"
                      aria-label="Single column"
                      onClick={() => setFeedLayout("single")}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${feedLayout === "single" ? "bg-[var(--brand)] text-white shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
                    >
                      <Rows size={13} weight="bold" />
                    </button>
                    <button
                      type="button"
                      aria-label="Grid view"
                      onClick={() => setFeedLayout("grid")}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${feedLayout === "grid" ? "bg-[var(--brand)] text-white shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
                    >
                      <SquaresFour size={13} weight="bold" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Infinite scroll feed */}
              <section className="mt-4 space-y-10">
                {isLoading && <FeedSkeleton />}

                {isError && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Warning size={32} className="text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Couldn't load events. Try refreshing.</p>
                  </div>
                )}

                {!isLoading && (() => {
                  const grouped: FeedEventItem[][] = [];
                  for (let i = 0; i < visibleEvents.length; i += CARDS_PER_SECTION) {
                    grouped.push(visibleEvents.slice(i, i + CARDS_PER_SECTION));
                  }
                  return grouped.map((sectionEvents, sectionIdx) => {
                    const section = sectionHeaders[sectionIdx];
                    return (
                      <Fragment key={`section-${sectionIdx}`}>
                        {section && (
                          <div className={sectionIdx === 0 ? "mb-3 mt-2" : "mb-3"}>
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                              {section.resolvedEyebrow}
                            </p>
                            <h2 className="mt-1.5 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.85rem]">
                              {section.resolvedTitle}
                            </h2>
                            {section.subtext && (
                              <p className="mt-1 text-[0.8rem] text-[var(--text-secondary)]">{section.subtext}</p>
                            )}
                          </div>
                        )}
                        <div className={feedLayout === "grid" ? "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4" : "flex flex-col gap-3"}>
                          {sectionEvents.map((event) => (
                            <div key={event._feedKey} className="min-w-0">
                              <ImageCard
                                event={event}
                                feedIndex={event._feedIndex}
                                onCardClick={() => {
                                  setSelectedEvent(event);
                                  fireInteraction(event.id, "peek_open");
                                }}
                                compact={feedLayout === "grid"}
                              />
                            </div>
                          ))}
                        </div>
                      </Fragment>
                    );
                  });
                })()}

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
                </>
              )}
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
                  {/* Pulse score widget */}
                  <Link href="/dashboard/rewards" className="block">
                    <section className="rounded-[var(--radius-card-lg)] border border-[var(--pulse-gold-border)] bg-[linear-gradient(180deg,#fffdf9,#fbf6ed)] p-5 shadow-[var(--home-shadow)] transition hover:brightness-[0.97] dark:bg-[linear-gradient(180deg,#1c1506,#0f0d02)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pulse-gold)]">Your Pulse</p>
                          <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                            {pulseData?.pulse_tier ?? "—"}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {pulseData?.pts_to_next_tier != null
                              ? `${pulseData.pts_to_next_tier} pts to ${pulseData.next_tier_label}`
                              : pulseData ? "You've reached the top tier" : "Loading…"}
                          </p>
                        </div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--pulse-gold)] bg-white/80 dark:bg-[var(--pulse-gold-soft)]">
                          <span className="text-[1.3rem] font-semibold text-[var(--pulse-gold)]">
                            {pulseData?.pulse_score?.toLocaleString() ?? "—"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                          <span>{pulseData?.pulse_tier ?? ""}</span>
                          <span>{pulseData?.next_tier_label ?? "Max"}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[rgba(var(--pulse-gold-rgb),0.12)]">
                          <div
                            className="h-2 rounded-full bg-[var(--pulse-gold)] transition-all duration-700"
                            style={{ width: `${pulseData?.progress_pct ?? 0}%` }}
                          />
                        </div>
                      </div>
                      {pulseData?.city_rank_label && (
                        <div className="mt-4">
                          <span className="rounded-full border border-[var(--pulse-gold-border)] bg-[var(--pulse-gold-soft)] px-3 py-1 text-[0.68rem] font-semibold text-[var(--pulse-gold)]">
                            {pulseData.city_rank_label}
                          </span>
                        </div>
                      )}
                    </section>
                  </Link>

                  {/* Weekend AI assistant */}
                  <WeekendAssistant />

                  {/* Social signals — friends + trending combined */}
                  <section className="rounded-[var(--radius-card)] border border-[var(--home-border)] bg-[var(--bg-card)] p-4 shadow-[var(--home-shadow)]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-[1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">What's moving</h3>
                      <Link className="text-xs font-medium text-[var(--brand)]" href="/dashboard/activity">See all</Link>
                    </div>
                    <div className="space-y-2">
                      {(trendingCards.length > 0 ? trendingCards : visibleEvents).slice(0, 3).map((event, index) => {
                        const cluster = FRIEND_CLUSTERS[index % FRIEND_CLUSTERS.length]!;
                        return (
                          <Link key={event.id} className="flex items-center gap-3 rounded-[12px] bg-[var(--bg-elevated)] p-2.5 transition hover:bg-[var(--bg-muted)]" href={`/events/${event.slug}`}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--home-avatar-bg)] text-[var(--brand)]">
                              {index === 0 ? <Fire size={14} weight="fill" /> : <UsersThree size={14} weight="regular" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{event.title}</p>
                              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{cluster.labels.join(", ")} · {cluster.note}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>

                  {/* People you may know */}
                  <PeopleSidebarWidget />
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
