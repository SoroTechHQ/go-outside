"use client";

import { useState, useEffect, useRef } from "react";
import { useEventDwell } from "../../../hooks/useEventDwell";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeft as ArrowPrev,
  ArrowRight as ArrowNext,
  BookmarkSimple,
  CalendarBlank,
  CheckCircle,
  Clock,
  HeartStraight,
  Images,
  MapPin,
  ShieldCheck,
  Sparkle,
  Star,
  Ticket,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getEventImage, type EventItem, type Organizer } from "@gooutside/demo-data";
import { CategoryIcon } from "../../../lib/category-icons";
import { useEventSave } from "../../../hooks/useEventSave";
import { useTracking } from "../../../components/tracking/TrackingProvider";
import { GetTicketModal, type EventForTicket } from "../../../components/tickets/GetTicketModal";
import { EVENT_COMMUNITY_POSTS } from "../../../lib/mock-community";
import { SearchPillExpanded } from "../../../components/search/SearchPillExpanded";
import { useAppShell } from "../../../components/layout/AppShellContext";
import { EventMap } from "../../../components/maps/EventMap";
import { LiveAttendeeBanner } from "../../../components/maps/LiveAttendeeBanner";
import { EventComments } from "../../../components/events/EventComments";
import { EventPoliciesGrid } from "../../../components/events/EventPoliciesGrid";


// ── Static content ────────────────────────────────────────────────────────────
const ALL_SLUGS = ["music", "food", "sports", "arts", "tech", "nightlife", "culture", "outdoors"];

const LINEUPS: Record<string, string[]> = {
  music:     ["DJ Kwame × Akosua Asante", "Live Band: The Accra Collective", "Open Mic Session", "Closing Set: DJ Nana"],
  food:      ["Chef Abena's Signature Menu", "Wine Pairing by Sommelier Kofi", "Live Cooking Demo", "Dessert Buffet"],
  sports:    ["Opening Ceremony", "Main Match / Competition", "Half-time Show", "Awards & Closing"],
  arts:      ["Exhibition Tour", "Live Painting Session", "Artist Talk", "Networking Reception"],
  tech:      ["Keynote Address", "Panel: Future of African Tech", "Demo Pitches", "Networking Happy Hour"],
  nightlife: ["Warm-up: DJ Esi", "Main Act: Sarkodie × Friends", "Late Night DJ", "After-party"],
  culture:   ["Traditional Dance", "Cultural Showcase", "Storytelling Session", "Community Feast"],
  outdoors:  ["Morning Activity", "Midday Picnic", "Group Games", "Sunset Wrap-up"],
};

const POLICIES = [
  { label: "Cancellation",    detail: "Full refund up to 48 hours before the event. No refunds after that." },
  { label: "Age Requirement", detail: "18+ unless otherwise noted. Valid ID required at entry." },
  { label: "Photography",     detail: "Personal photography allowed. Commercial use requires prior written consent." },
  { label: "Entry",           detail: "Gates open 30 minutes before start time. Latecomers admitted at discretion." },
];

const REEL_THUMBNAILS = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&w=360&h=480&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=360&h=480&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&w=360&h=480&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=360&h=480&fit=crop",
];

function getEventImages(event: EventItem): string[] {
  // Use the real banner + gallery first; fall back to category placeholders
  const real = [event.bannerUrl, ...(event.gallery ?? [])].filter(Boolean) as string[];
  const base = Math.max(0, ALL_SLUGS.indexOf(event.categorySlug));
  while (real.length < 9) {
    real.push(getEventImage(undefined, ALL_SLUGS[(base + real.length) % ALL_SLUGS.length]));
  }
  return real;
}

// ── Check-in button — contextual, shows during event window ───────────────────

function isInCheckInWindow(startDatetime: string | null, endDatetime: string | null): boolean {
  const now = Date.now();
  if (startDatetime) {
    const start = new Date(startDatetime).getTime();
    const end = endDatetime ? new Date(endDatetime).getTime() : start + 6 * 60 * 60 * 1000;
    const windowStart = start - 2 * 60 * 60 * 1000; // 2h before
    const windowEnd = end + 2 * 60 * 60 * 1000;     // 2h after
    return now >= windowStart && now <= windowEnd;
  }
  return false;
}

function CheckInButton({ eventSlug, startDatetime, endDatetime }: {
  eventSlug: string;
  startDatetime: string | null;
  endDatetime: string | null;
}) {
  const inWindow = isInCheckInWindow(startDatetime, endDatetime);
  const [flashPoints, setFlashPoints] = useState(false);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["check-in", eventSlug],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventSlug}/checkin`);
      return res.json() as Promise<{ checked_in: boolean }>;
    },
    staleTime: 5 * 60_000,
    enabled: inWindow,
  });

  const checkedIn = statusData?.checked_in ?? false;

  const checkIn = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${eventSlug}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return res.json() as Promise<{ checked_in: boolean; already_checked_in: boolean; points_awarded: number }>;
    },
    onSuccess: (data) => {
      if (!data.already_checked_in && data.points_awarded > 0) {
        setFlashPoints(true);
        setTimeout(() => setFlashPoints(false), 3000);
      }
    },
  });

  if (!inWindow || statusLoading) return null;

  return (
    <div className="relative">
      <button
        onClick={() => !checkedIn && !checkIn.isPending && checkIn.mutate()}
        disabled={checkedIn || checkIn.isPending}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
          checkedIn
            ? "border border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--brand)] cursor-default"
            : "border border-[var(--home-border)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)] active:scale-[0.98]"
        } disabled:opacity-70`}
        type="button"
      >
        {checkedIn || checkIn.data?.checked_in ? (
          <>
            <CheckCircle size={16} weight="fill" />
            Checked In
          </>
        ) : checkIn.isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
            Checking in…
          </>
        ) : (
          <>
            <MapPin size={16} weight="bold" />
            Check In · Earn 50 PP
          </>
        )}
      </button>

      {/* Points flash */}
      {flashPoints && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-[fadeUp_0.8s_ease-out_forwards] flex items-center gap-1 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Sparkle size={11} weight="fill" />
            +50 Pulse Points
          </span>
        </div>
      )}
    </div>
  );
}

// ── Photo lightbox ─────────────────────────────────────────────────────────────
function PhotoLightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft")  setIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const strip = thumbsRef.current;
    const active = strip?.querySelector(`[data-idx="${idx}"]`) as HTMLElement | null;
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [idx]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <button className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition" onClick={onClose} type="button">
        <X size={18} weight="bold" />
      </button>
      <p className="absolute right-6 top-5 pr-12 text-sm text-white/40">{idx + 1} / {images.length}</p>

      {/* Main image row */}
      <div className="relative flex w-full flex-1 items-center justify-center px-16" onClick={e => e.stopPropagation()}>
        <button
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
          type="button"
        >
          <ArrowPrev size={20} weight="bold" />
        </button>
        <div className="max-h-[72vh] max-w-[80vw] overflow-hidden rounded-2xl shadow-2xl">
          <img src={images[idx]} alt="" className="max-h-[72vh] w-auto max-w-[80vw] object-cover" />
        </div>
        <button
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
          type="button"
        >
          <ArrowNext size={20} weight="bold" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        ref={thumbsRef}
        className="flex w-full shrink-0 gap-2 overflow-x-auto px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={e => e.stopPropagation()}
      >
        {images.map((src, i) => (
          <button
            key={i}
            data-idx={i}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 ${i === idx ? "border-white opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"}`}
            onClick={() => setIdx(i)}
            type="button"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function EventDetailClient({
  event,
  organizer,
}: {
  event: EventItem;
  organizer: Organizer;
}) {
  // Resolve coordinates: use real venue coords if available, else derive from event id (demo fallback)
  const resolvedLat = event.venueLat ?? (5.6037 + (((event.id?.charCodeAt(0) ?? 65) % 10) - 5) * 0.018);
  const resolvedLng = event.venueLng ?? (-0.187  + (((event.id?.charCodeAt(1) ?? 66) % 10) - 5) * 0.018);
  useEventDwell(event.id);
  const images = getEventImages(event);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { isSaved, toggleSave } = useEventSave(event.id);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const { sidebarWidth } = useAppShell();
  const { trackEvent } = useTracking();
  const ticketSectionRef = useRef<HTMLDivElement>(null);
  const priceRevealFired = useRef(false);

  // price_reveal: fire once when ticket section enters viewport
  useEffect(() => {
    if (!ticketSectionRef.current || priceRevealFired.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !priceRevealFired.current) {
          priceRevealFired.current = true;
          fetch("/api/interactions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ eventId: event.id, edgeType: "price_reveal" }),
            keepalive: true,
          }).catch(() => undefined);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(ticketSectionRef.current);
    return () => observer.disconnect();
  }, [event.id]);

  function trackShare() {
    trackEvent({ event_type: "share_tap", target_entity_id: event.id, entity_type: "event" });
    fetch("/api/interactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, edgeType: "share_tap" }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function trackOrganizerTap() {
    fetch("/api/interactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, edgeType: "organizer_tap" }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function trackGalleryScroll() {
    trackEvent({ event_type: "image_scroll", target_entity_id: event.id, entity_type: "event" });
    fetch("/api/interactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, edgeType: "image_scroll" }),
      keepalive: true,
    }).catch(() => undefined);
  }

  const rating = (3.8 + ((event.id?.charCodeAt(0) ?? 65) % 12) / 10).toFixed(1);
  const reviewCount = 48 + ((event.id?.charCodeAt(1) ?? 66) % 80);
  const lineup = LINEUPS[event.categorySlug] ?? LINEUPS.music ?? [];
  const ticketEvent: EventForTicket = {
    id: event.id,
    title: event.title,
    date: event.dateLabel,
    time: event.timeLabel,
    venue: event.venue,
    city: event.city,
    imageUrl: images[0],
    organizer: organizer.name,
    ticketTypes:
      event.ticketTypes.length > 0
        ? event.ticketTypes.map((ticketType) => ({
            id: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            priceType: ticketType.priceType,
            description: ticketType.remainingLabel,
            maxPerUser: 4,
          }))
        : [
            {
              id: `${event.id}-general`,
              name: event.priceValue === 0 ? "Free Entry" : "General Admission",
              price: event.priceValue,
              priceType: event.priceValue === 0 ? "free" : "paid",
              description: "Tickets available",
              maxPerUser: 4,
            },
          ],
  };


  return (
    <>
      <div
        className="fixed right-0 top-0 z-50 hidden md:block"
        style={{ left: sidebarWidth > 0 ? sidebarWidth : 0 }}
      >
        <div className="px-6 py-4">
          <div className="mx-auto w-full max-w-[1320px]">
            <SearchPillExpanded />
          </div>
        </div>

        <div className="border-b border-[var(--home-border)] bg-[var(--bg-glass)] px-6 py-3 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface)]"
            >
              <ArrowLeft size={16} weight="bold" />
              Back
            </Link>

            <p className="min-w-0 flex-1 truncate text-center text-[1rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {event.title}
            </p>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🎉 *${event.title}*\n📅 ${event.dateLabel} · ${event.timeLabel}\n📍 ${event.venue}, ${event.city}\n\nCheck it out on GoOutside 👇\nhttps://gooutside.club/events/${event.slug}\n\n_Let's go outside_ 🟢`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackShare}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[#25D366] hover:text-[#25D366]"
              >
                <WhatsappLogo size={14} weight="fill" />
                Share
              </a>
              <button
                className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg-surface)] ${
                  isSaved ? "text-rose-500" : "text-[var(--text-primary)]"
                }`}
                onClick={toggleSave}
                type="button"
              >
                <HeartStraight size={14} weight={isSaved ? "fill" : "bold"} />
                {isSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 top-0 z-50 border-b border-[var(--home-border)] bg-[var(--bg-glass)] px-4 py-3 shadow-[var(--card-shadow)] backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)]"
          >
            <ArrowLeft size={14} weight="bold" />
            Back
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-[var(--text-primary)]">
            {event.title}
          </p>
          <button
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] ${
              isSaved ? "text-rose-500" : "text-[var(--text-primary)]"
            }`}
            onClick={toggleSave}
            type="button"
          >
            <HeartStraight size={16} weight={isSaved ? "fill" : "regular"} />
          </button>
        </div>
      </div>

      {/* ── Photo grid (Airbnb-style) ─────────────────────────────────────────── */}
      <div
        className="pt-[74px] md:pt-[148px] transition-[padding] duration-300"
        style={{ paddingLeft: `max(1rem, calc(${sidebarWidth}px + 1.5rem))`, paddingRight: "1.5rem" }}
      >
      <div className="relative hidden md:grid md:h-[56vh] md:min-h-[340px] md:max-h-[560px] md:grid-cols-4 md:grid-rows-2 md:gap-2 md:overflow-hidden md:rounded-[28px]">
        {/* Main hero — spans 2 cols × 2 rows */}
        <button
          className="relative col-span-2 row-span-2 overflow-hidden rounded-tl-[28px] rounded-bl-[28px]"
          onClick={() => { setLightboxIdx(0); trackGalleryScroll(); }}
          type="button"
        >
          <img src={images[0]} alt={event.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" />
        </button>
        {/* 4 smaller photos */}
        {[1, 2, 3, 4].map((i, pos) => (
          <button
            key={i}
            className={`relative overflow-hidden ${pos === 1 ? "rounded-tr-[28px]" : ""} ${pos === 3 ? "rounded-br-[28px]" : ""}`}
            onClick={() => setLightboxIdx(i)}
            type="button"
          >
            <img src={images[i]} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" />
            {/* "Show all photos" on last cell */}
            {pos === 3 && (
              <div className="absolute inset-0 flex items-end justify-end bg-black/20 p-3">
                <span className="flex items-center gap-1.5 rounded-lg border border-[var(--home-border-strong)] bg-[var(--bg-glass)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--card-shadow)] backdrop-blur-md">
                  <Images size={13} />
                  Show all photos
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        className="relative block h-[54vw] min-h-[240px] max-h-[360px] w-full overflow-hidden rounded-[24px] md:hidden"
        onClick={() => setLightboxIdx(0)}
        type="button"
      >
        <img src={images[0]} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/8 to-transparent" />
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-[var(--home-border-strong)] bg-[var(--bg-glass)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--card-shadow)] backdrop-blur-md">
          <Images size={12} />
          Show all photos
        </div>
      </button>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_380px]">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="min-w-0">
            {/* Title + category */}
            <div className="border-b border-[var(--home-border)] pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-dim)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  <CategoryIcon slug={event.categorySlug} size={12} weight="bold" />
                  {event.eyebrow}
                </span>
                {event.isAgeRestricted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    18+
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-[2.4rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--text-primary)] sm:text-[3rem]">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star size={14} weight="fill" className="text-amber-400" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{rating}</span>
                  <span className="text-sm text-[var(--text-secondary)]">· {reviewCount} reviews</span>
                </div>
                <span className="text-[var(--text-tertiary)]">·</span>
                <span className="text-sm text-[var(--text-secondary)]">{event.locationLine}</span>
              </div>
            </div>

            {/* Host */}
            <Link
              onClick={trackOrganizerTap}
              className="flex items-center gap-4 border-b border-[var(--home-border)] py-8 transition hover:opacity-90"
              href={`/organizers/${organizer.id}`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-emerald-700 text-[0.9rem] font-bold text-white">
                {organizer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[0.92rem] text-[var(--text-secondary)]">Hosted by</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    {organizer.name}
                  </p>
                  {organizer.verified ? (
                    <CheckCircle size={16} weight="fill" className="text-[var(--brand)]" />
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                  {organizer.followersLabel} · {organizer.eventsLabel}
                </p>
              </div>
            </Link>

            {/* Date & venue quick-look */}
            <div className="grid gap-4 border-b border-[var(--home-border)] py-8 sm:grid-cols-2">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-dim)] text-[var(--brand)]">
                  <CalendarBlank size={20} weight="regular" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{event.dateLabel}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                    <Clock size={12} weight="regular" />
                    {event.timeLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-dim)] text-[var(--brand)]">
                  <MapPin size={20} weight="regular" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{event.venue}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{event.locationLine}</p>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="border-b border-[var(--home-border)] py-8">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">About this event</h2>
              <p className="mt-4 text-[1rem] leading-[1.8] text-[var(--text-secondary)]">
                {event.shortDescription ?? "An unmissable experience."} Join us for an unforgettable evening in the heart of {event.city}. This is one of those events you'll be talking about for months — curated for the culture, built for the moment.
              </p>
              {event.description && event.description !== event.shortDescription && (
                <p className="mt-3 text-[1rem] leading-[1.8] text-[var(--text-secondary)]">{event.description}</p>
              )}
            </div>

            {/* What's happening (activities timeline) */}
            {(event as any).activities?.length > 0 && (
              <div className="border-b border-[var(--home-border)] py-8">
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">What's happening</h2>
                <div className="relative mt-5 pl-6">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[var(--home-border)]" />
                  <div className="space-y-5">
                    {(event as any).activities.map((act: { title: string; time?: string }, i: number) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div className="absolute -left-6 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--brand)] bg-[var(--bg-card)]" />
                        <div className="min-w-0">
                          {act.time && (
                            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--brand)]">{act.time}</p>
                          )}
                          <p className="text-[0.95rem] font-medium text-[var(--text-primary)]">{act.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live attendee banner */}
            {event.startDatetime && event.endDatetime && (
              <div className="py-4">
                <LiveAttendeeBanner
                  eventId={event.id}
                  eventName={event.title}
                  venueLat={resolvedLat}
                  venueLng={resolvedLng}
                  startDatetime={event.startDatetime}
                  endDatetime={event.endDatetime}
                />
              </div>
            )}

            {/* Map */}
            <div className="border-b border-[var(--home-border)] py-8">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Location</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.venue}, {event.locationLine}</p>
              <div className="mt-5">
                <EventMap
                  lat={resolvedLat}
                  lng={resolvedLng}
                  venueName={event.venue}
                  locationLine={event.locationLine}
                  eventTitle={event.title}
                  eventSlug={event.slug}
                />
              </div>
            </div>

            {/* Social buzz — only shown when organizer has added links */}
            {(event as any).socialLinks?.length > 0 && (
              <div className="border-b border-[var(--home-border)] py-8">
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Buzz online</h2>
                <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {(event as any).socialLinks.map((reel: { platform: string; url: string; caption?: string; likes?: number }, i: number) => (
                    <a
                      key={i}
                      className="group flex w-[160px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)] transition hover:-translate-y-1 hover:shadow-lg"
                      href={reel.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="flex h-[200px] items-center justify-center" style={{ backgroundColor: reel.platform === "instagram" ? "#E1306C22" : "#01010122" }}>
                        <div className="rounded-full px-3 py-1.5" style={{ backgroundColor: reel.platform === "instagram" ? "#E1306C" : "#010101" }}>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">{reel.platform === "instagram" ? "Instagram" : "TikTok"}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        {reel.likes != null && (
                          <div className="mb-1 flex items-center gap-1">
                            <HeartStraight size={11} weight="fill" className="text-rose-400" />
                            <span className="text-[0.65rem] font-semibold text-[var(--text-tertiary)]">{reel.likes.toLocaleString()} likes</span>
                          </div>
                        )}
                        {reel.caption && (
                          <p className="line-clamp-2 text-[0.75rem] text-[var(--text-secondary)]">{reel.caption}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="border-b border-[var(--home-border)] py-8">
              <h2 className="mb-5 text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Comments</h2>
              <EventComments eventSlug={event.slug} eventId={event.id} />
            </div>

            {/* Policies */}
            <div className="py-8">
              <h2 className="mb-5 text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Policies</h2>
              <EventPoliciesGrid policies={(event as any).policies} />
            </div>
          </div>

          {/* ── Right column — sticky ticket card ──────────────────────────── */}
          <aside className="lg:sticky lg:top-[168px] lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--bg-card)] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
              {/* Price header */}
              <div className="border-b border-[var(--home-border)] px-6 pt-6 pb-5">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                      {event.priceValue === 0 ? "Free" : event.priceLabel}
                    </span>
                    {event.priceValue > 0 && <span className="ml-1.5 text-sm text-[var(--text-secondary)]">per person</span>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                    <Star size={12} weight="fill" className="text-amber-400" />
                    {rating} ({reviewCount})
                  </div>
                </div>
              </div>

              {/* Date / time summary */}
              <div className="border-b border-[var(--home-border)] px-6 py-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <CalendarBlank size={14} weight="regular" />
                  <span>{event.dateLabel} · {event.timeLabel}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <MapPin size={14} weight="regular" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>

              {/* Ticket tiers */}
              <div ref={ticketSectionRef} className="space-y-2 px-6 py-4">
                {(event.ticketTypes?.length > 0 ? event.ticketTypes : [
                  { name: "General Admission", priceLabel: event.priceLabel, remainingLabel: "Tickets available" },
                  { name: "VIP", priceLabel: event.priceValue === 0 ? "Free" : `GHS ${(event.priceValue * 2.5).toFixed(0)}`, remainingLabel: "Limited seats" },
                ]).map((tt) => (
                  <div key={tt.name} className="flex items-center justify-between rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{tt.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{tt.remainingLabel}</p>
                    </div>
                    <span className="rounded-full bg-[var(--brand-dim)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">{tt.priceLabel}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="space-y-3 px-6 pb-6">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
                  onClick={() => setTicketModalOpen(true)}
                  type="button"
                >
                  <Ticket size={16} weight="bold" />
                  {event.priceValue === 0 ? "Register for Free" : `Get Tickets · ${event.priceLabel}`}
                </button>

                {/* Check-in — only shows during event window */}
                <CheckInButton
                  eventSlug={event.slug}
                  startDatetime={event.startDatetime ?? null}
                  endDatetime={event.endDatetime ?? null}
                />

                <div className="flex gap-2">
                  <button
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition ${isSaved ? "border-rose-400/50 bg-rose-50/10 text-rose-400" : "border-[var(--home-border)] text-[var(--text-secondary)] hover:border-rose-400/50 hover:text-rose-400"}`}
                    onClick={toggleSave}
                    type="button"
                  >
                    <HeartStraight size={15} weight={isSaved ? "fill" : "regular"} />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`🎉 *${event.title}*\n📅 ${event.dateLabel} · ${event.timeLabel}\n📍 ${event.venue}, ${event.city}\n\nCheck it out on GoOutside 👇\nhttps://gooutside.club/events/${event.slug}\n\n_Let's go outside_ 🟢`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--home-border)] py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[#25D366] hover:text-[#25D366]"
                  >
                    <WhatsappLogo size={15} weight="fill" />
                    Share
                  </a>
                </div>
                <p className="text-center text-xs text-[var(--text-tertiary)]">You won't be charged yet</p>
              </div>

              {/* Organizer mini-card */}
              <div className="border-t border-[var(--home-border)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <Link
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-emerald-700 text-sm font-bold text-white transition hover:scale-105"
                    href={`/organizers/${organizer.id}`}
                  >
                    {organizer.name.slice(0, 2).toUpperCase()}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <Link
                        className="truncate text-sm font-semibold text-[var(--text-primary)] transition hover:text-[var(--brand)]"
                        href={`/organizers/${organizer.id}`}
                      >
                        {organizer.name}
                      </Link>
                      {organizer.verified ? (
                        <CheckCircle size={13} weight="fill" className="shrink-0 text-[var(--brand)]" />
                      ) : null}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {organizer.followersLabel} · {organizer.eventsLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save/share below card */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold underline transition ${isSaved ? "text-[var(--brand)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={toggleSave}
                type="button"
              >
                <BookmarkSimple size={14} weight={isSaved ? "fill" : "regular"} />
                {isSaved ? "Saved to wishlist" : "Add to wishlist"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <PhotoLightbox images={images} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {ticketModalOpen && (
        <GetTicketModal event={ticketEvent} onClose={() => setTicketModalOpen(false)} />
      )}
    </>
  );
}
