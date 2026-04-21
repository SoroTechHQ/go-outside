"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GetTicketModal, type EventForTicket } from "../tickets/GetTicketModal";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsOutSimple,
  BookmarkSimple,
  CalendarBlank,
  CheckCircle,
  Clock,
  HeartStraight,
  Images,
  MapPin,
  PaperPlaneTilt,
  ShieldCheck,
  Star,
  Ticket,
  X,
} from "@phosphor-icons/react";
import {
  getCategoryEmoji,
  type Organizer,
} from "@gooutside/demo-data";
import type { FeedEventItem } from "../../lib/app-contracts";
import { EVENT_COMMUNITY_POSTS } from "../../lib/mock-community";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type EventItem = FeedEventItem;

// ── Image helpers ─────────────────────────────────────────────────────────────
const ALL_SLUGS = ["music", "food", "sports", "arts", "tech", "nightlife", "culture", "outdoors"];

function getEventImages(event: EventItem): string[] {
  const images = [event.bannerUrl, ...(event.gallery || [])].filter(Boolean) as string[];
  while (images.length < 9) {
    images.push(`https://source.unsplash.com/800x600/?${event.categorySlug},event&sig=${images.length}`);
  }
  return images;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
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
  { label: "Cancellation",   detail: "Full refund up to 48 hours before the event. No refunds after that." },
  { label: "Age Requirement",detail: "18+ unless otherwise noted. Valid ID required at entry." },
  { label: "Photography",    detail: "Personal photography allowed. Commercial use requires prior written consent." },
  { label: "Entry",          detail: "Gates open 30 minutes before start time. Latecomers admitted at discretion." },
];

const REEL_THUMBNAILS = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&w=360&h=480&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=360&h=480&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&w=360&h=480&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=360&h=480&fit=crop",
];

const SOCIAL_REELS = [
  { platform: "instagram" as const, user: "@accra.vibes",  likes: "12.4K", caption: "This event is gonna go OFF 🔥 who's coming?",                  thumbIdx: 0 },
  { platform: "tiktok"    as const, user: "@kofi_events",  likes: "8.2K",  caption: "POV: you're about to have the time of your life",                thumbIdx: 1 },
  { platform: "instagram" as const, user: "@nightlife_gh", likes: "5.7K",  caption: "Already have my tickets 🎟️ see you there!",                      thumbIdx: 2 },
  { platform: "tiktok"    as const, user: "@accra_out",    likes: "3.1K",  caption: "This city never sleeps and I'm here for it",                     thumbIdx: 3 },
];

const DEFAULT_WIDTH = 480;
const MIN_WIDTH = 420;
const MAX_WIDTH = 960;

// ── Photo modal ───────────────────────────────────────────────────────────────
function PhotoModal({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")  setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 backdrop-blur-sm" onClick={onClose}>
      <button className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose} type="button">
        <X size={18} weight="bold" />
      </button>
      <button className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }} type="button">
        <ArrowLeft size={18} weight="bold" />
      </button>
      <div className="relative max-h-[88vh] max-w-[88vw] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-[75vh] w-[75vw] bg-cover bg-center" style={{ backgroundImage: `url(${images[idx]})` }} />
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button key={i} className={`rounded-full transition-all ${i === idx ? "h-1.5 w-5 bg-white" : "h-1.5 w-1.5 bg-white/40 hover:bg-white/70"}`} onClick={() => setIdx(i)} type="button" />
          ))}
        </div>
      </div>
      <button className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }} type="button">
        <ArrowRight size={18} weight="bold" />
      </button>
      <p className="absolute bottom-5 right-6 text-xs text-white/50">{idx + 1} / {images.length}</p>
    </div>
  );
}

// ── Shared pane content ──────────────────────────────────────────────────────
function PaneContent({
  event,
  organizer,
  images,
  onSetPhotoModal,
  onClose,
  saved,
  onToggleSaved,
}: {
  event: EventItem;
  organizer: Organizer;
  images: string[];
  onSetPhotoModal: (v: { open: boolean; index: number }) => void;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const rating = (3.8 + ((event.id?.charCodeAt(0) ?? 65) % 12) / 10).toFixed(1);
  const reviewCount = 48 + ((event.id?.charCodeAt(1) ?? 66) % 80);
  const lineup = LINEUPS[event.categorySlug] ?? LINEUPS.music ?? [];
  const mapLat = (5.6037 + (((event.id?.charCodeAt(0) ?? 65) % 10) - 5) * 0.018).toFixed(4);
  const mapLon = (-0.187 + (((event.id?.charCodeAt(1) ?? 66) % 10) - 5) * 0.018).toFixed(4);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(Number(mapLon) - 0.022).toFixed(4)}%2C${(Number(mapLat) - 0.015).toFixed(4)}%2C${(Number(mapLon) + 0.022).toFixed(4)}%2C${(Number(mapLat) + 0.015).toFixed(4)}&layer=mapnik&marker=${mapLat}%2C${mapLon}`;

  return (
    <>
      {/* Airbnb-style photo grid */}
      <div className="relative">
        <div className="flex h-[260px] gap-0.5 overflow-hidden">
          <button
            className="relative flex-1 overflow-hidden"
            onClick={() => onSetPhotoModal({ open: true, index: 0 })}
            type="button"
          >
            <div className="absolute inset-0 bg-cover bg-center transition duration-300 hover:opacity-90" style={{ backgroundImage: `url(${images[0]})` }} />
          </button>
          <div className="flex w-[38%] flex-col gap-0.5">
            <button className="relative flex-1 overflow-hidden" onClick={() => onSetPhotoModal({ open: true, index: 1 })} type="button">
              <div className="absolute inset-0 bg-cover bg-center transition duration-300 hover:opacity-90" style={{ backgroundImage: `url(${images[1]})` }} />
            </button>
            <button className="relative flex-1 overflow-hidden" onClick={() => onSetPhotoModal({ open: true, index: 2 })} type="button">
              <div className="absolute inset-0 bg-cover bg-center transition duration-300 hover:opacity-90" style={{ backgroundImage: `url(${images[2]})` }} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="rounded-full bg-black/40 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
                  +{images.length - 3} more
                </span>
              </div>
            </button>
          </div>
        </div>
        <button
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl border border-white/40 bg-white/90 px-3.5 py-2 text-[0.75rem] font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
          onClick={() => onSetPhotoModal({ open: true, index: 0 })}
          type="button"
        >
          <Images size={13} weight="regular" />
          View all photos
        </button>
      </div>

      <div className="space-y-6 px-5 pb-4 pt-5">
        {/* Title + category */}
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--brand)]">
            {getCategoryEmoji(event.categorySlug)} {event.eyebrow}
          </span>
          <h2 className="mt-2.5 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)]">
            {event.title}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={i < Math.floor(Number(rating)) ? "text-amber-400" : "text-[var(--text-tertiary)]"} size={13} weight={i < Math.floor(Number(rating)) ? "fill" : "regular"} />
              ))}
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{rating}</span>
            <span className="text-xs text-[var(--text-tertiary)]">({reviewCount} reviews)</span>
          </div>
          <div className="mt-3 flex items-center gap-2.5 border-t border-[var(--home-border)] pt-3">
            <Link
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-emerald-700 text-xs font-bold text-white transition hover:scale-105"
              href={`/organizers/${organizer.id}`}
            >
              {organizer.name.slice(0, 2).toUpperCase()}
            </Link>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-medium text-[var(--text-tertiary)]">Hosted by</p>
              <div className="flex items-center gap-1">
                <Link
                  className="truncate text-sm font-semibold text-[var(--text-primary)] transition hover:text-[var(--brand)]"
                  href={`/organizers/${organizer.id}`}
                >
                  {organizer.name}
                </Link>
                {organizer.verified ? (
                  <CheckCircle size={13} weight="fill" className="text-[var(--brand)]" />
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {organizer.followersLabel} · {organizer.eventsLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Date / Venue */}
        <div className="space-y-3 rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
              <CalendarBlank size={14} weight="regular" />
            </div>
            <div>
              <p className="text-[0.95rem] font-medium text-[var(--text-primary)]">{event.dateLabel}</p>
              <p className="text-sm text-[var(--text-secondary)]">{event.timeLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
              <MapPin size={14} weight="regular" />
            </div>
            <div>
              <p className="text-[0.95rem] font-medium text-[var(--text-primary)]">{event.venue}</p>
              <p className="text-sm text-[var(--text-secondary)]">{event.locationLine}</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">About this event</p>
          <p className="text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
            {event.shortDescription ?? "An unmissable experience."} Join us for an unforgettable evening in the heart of {event.city}. This is one of those events you'll be talking about for months — curated for the culture, built for the moment.
          </p>
        </div>

        {/* Map */}
        <div>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Location</p>
          <div className="overflow-hidden rounded-xl border border-[var(--home-border)]">
            <iframe className="h-[180px] w-full" loading="lazy" src={mapSrc} title={`Map for ${event.venue}`} />
            <div className="flex items-center justify-between border-t border-[var(--home-border)] bg-[var(--bg-surface)] px-3 py-2">
              <p className="truncate text-xs text-[var(--text-secondary)]">{event.venue}, {event.locationLine}</p>
              <a className="ml-2 shrink-0 text-xs font-medium text-[var(--brand)] hover:underline" href={`https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLon}#map=15/${mapLat}/${mapLon}`} rel="noopener noreferrer" target="_blank">Open maps ↗</a>
            </div>
          </div>
        </div>

        {/* What's happening */}
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">What's happening</p>
          <div className="space-y-2">
            {lineup.map((item, i) => (
              <div key={item} className="flex items-center gap-0 overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)]">
                <div className="relative h-16 w-16 shrink-0">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${images[(i + 3) % images.length]})` }} />
                </div>
                <div className="flex flex-1 items-center gap-2.5 px-3 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.6rem] font-bold text-[var(--brand)]">{i + 1}</span>
                  <span className="text-sm text-[var(--text-primary)]">{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buzz online */}
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Buzz online</p>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SOCIAL_REELS.map((reel, i) => (
              <a
                key={i}
                className="group flex w-[148px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
                href={reel.platform === "instagram" ? "https://instagram.com" : "https://tiktok.com"}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="relative h-[190px] overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${REEL_THUMBNAILS[reel.thumbIdx]})` }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/65" />
                  <div
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: reel.platform === "instagram" ? "#E1306C" : "#010101" }}
                  >
                    <span className="text-[0.58rem] font-bold uppercase tracking-wider text-white">
                      {reel.platform === "instagram" ? "Insta" : "TikTok"}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white">
                    <HeartStraight size={11} weight="fill" />
                    <span className="text-[0.65rem] font-semibold">{reel.likes}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[0.68rem] font-semibold text-[var(--text-tertiary)]">{reel.user}</p>
                  <p className="mt-0.5 line-clamp-2 text-[0.72rem] text-[var(--text-secondary)]">{reel.caption}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* About the host */}
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">About the host</p>
          <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-start gap-3">
              <Link
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-emerald-700 text-sm font-bold text-white transition hover:scale-105"
                href={`/organizers/${organizer.id}`}
              >
                {organizer.name.slice(0, 2).toUpperCase()}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Link
                    className="font-semibold text-[var(--text-primary)] transition hover:text-[var(--brand)]"
                    href={`/organizers/${organizer.id}`}
                  >
                    {organizer.name}
                  </Link>
                  {organizer.verified ? (
                    <CheckCircle size={14} weight="fill" className="text-[var(--brand)]" />
                  ) : null}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {organizer.followersLabel} · {organizer.eventsLabel}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {organizer.tag}. Hosting events in {organizer.city} with a dedicated profile
                  page for their audience, listings, and recent event activity.
                </p>
              </div>
            </div>
            <Link
              className="mt-3 block w-full rounded-lg border border-[var(--home-border)] py-2 text-center text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              href={`/organizers/${organizer.id}`}
            >
              Visit host page →
            </Link>
          </div>
        </div>

        {/* What people are saying */}
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">What people are saying</p>
          <div className="space-y-2.5">
            {EVENT_COMMUNITY_POSTS.map((post) => (
              <div key={post.handle} className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-3.5">
                <div className="flex items-center gap-2.5">
                  <Link
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.6rem] font-bold text-[var(--brand)] transition hover:scale-105"
                    href={`/dashboard/user/${post.userId}`}
                  >
                    {post.avatar}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      className="text-xs font-semibold text-[var(--text-primary)] transition hover:text-[var(--brand)]"
                      href={`/dashboard/user/${post.userId}`}
                    >
                      {post.user}
                    </Link>
                    <p className="text-[0.65rem] text-[var(--text-tertiary)]">{post.handle} · {post.time}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{post.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Policies</p>
          <div className="divide-y divide-[var(--home-border)] overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)]">
            {POLICIES.map((policy) => (
              <div key={policy.label} className="flex items-start gap-3 px-4 py-3">
                <ShieldCheck size={13} weight="fill" className="mt-0.5 shrink-0 text-[var(--brand)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{policy.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{policy.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </>
  );
}

// ── Shared sticky footer ──────────────────────────────────────────────────────
function PaneFooter({
  event,
  saved,
  onToggleSaved,
  onGetTickets,
}: {
  event: EventItem;
  saved: boolean;
  onToggleSaved: () => void;
  onGetTickets: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-[var(--home-border)] bg-[var(--bg-card)] px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          onClick={onGetTickets}
          type="button"
        >
          <Ticket size={15} weight="bold" />
          {event.priceValue === 0 ? "Get Free Tickets" : `Get Tickets · ${event.priceLabel}`}
        </button>
        <button
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${saved ? "border-rose-400/50 bg-rose-50/10 text-rose-400" : "border-[var(--home-border)] text-[var(--text-secondary)] hover:border-rose-400/50 hover:text-rose-400"}`}
          onClick={onToggleSaved}
          type="button"
        >
          <HeartStraight size={17} weight={saved ? "fill" : "regular"} />
        </button>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--home-border)] text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          type="button"
        >
          <PaperPlaneTilt size={16} weight="regular" />
        </button>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--home-border)] text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          type="button"
        >
          <BookmarkSimple size={15} weight="regular" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function EventSidePane({
  event,
  organizer = {
    id: event.organizerId,
    name: "GoOutside Host",
    tag: "Community host",
    city: event.city,
    verified: false,
    followersLabel: "Community host",
    eventsLabel: "Active event page",
  },
  onClose,
  onWidthChange,
}: {
  event: EventItem;
  organizer?: Organizer;
  onClose: () => void;
  onWidthChange?: (w: number) => void;
}) {
  const images = getEventImages(event);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [paneWidth, setPaneWidth] = useState(DEFAULT_WIDTH);
  const [mounted, setMounted] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const [saved, setSaved] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Mobile bottom sheet state
  const SNAP_PEEK = 66;   // vh — half-open
  const SNAP_FULL = 95;   // vh — full-open
  const [sheetHeight, setSheetHeight] = useState(SNAP_PEEK);
  const [isSnapping, setIsSnapping] = useState(true);
  const touchRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const dragRef = useRef<{ active: boolean; startX: number; startWidth: number }>({ active: false, startX: 0, startWidth: DEFAULT_WIDTH });

  // Slide-in / mount animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Reset sheet when event changes
  useEffect(() => { setSheetHeight(SNAP_PEEK); }, [event]);

  // Sync width to parent (desktop only)
  useEffect(() => {
    if (isDesktop) onWidthChange?.(paneWidth);
    else onWidthChange?.(0);
  }, [paneWidth, onWidthChange, isDesktop]);

  // Escape key
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !photoModal.open) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, photoModal.open]);

  // Desktop drag-to-resize (mouse)
  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startWidth: paneWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const delta = dragRef.current.startX - e.clientX;
      setPaneWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + delta)));
    };
    const onUp = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  const toggleFullScreen = () =>
    setPaneWidth((w) => (w >= MAX_WIDTH - 100 ? DEFAULT_WIDTH : MAX_WIDTH));

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startY: e.touches[0]!.clientY, startHeight: sheetHeight };
    setIsSnapping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dy = touchRef.current.startY - e.touches[0]!.clientY;
    const dhPct = (dy / window.innerHeight) * 100;
    const next = Math.min(97, Math.max(8, touchRef.current.startHeight + dhPct));
    setSheetHeight(next);
  };

  const handleTouchEnd = () => {
    setIsSnapping(true);
    touchRef.current = null;
    if (sheetHeight < 28) {
      onClose();
    } else if (sheetHeight < 80) {
      setSheetHeight(SNAP_PEEK);
    } else {
      setSheetHeight(SNAP_FULL);
    }
  };

  // ── Mobile bottom sheet ──
  if (!isDesktop) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease" }}
          onClick={onClose}
        />

        {/* Bottom sheet */}
        <div
          className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--home-border)] bg-[var(--bg-card)] shadow-[0_-8px_48px_rgba(0,0,0,0.22)]"
          style={{
            height: `${sheetHeight}vh`,
            transition: isSnapping ? "height 0.38s cubic-bezier(0.22,1,0.36,1)" : "none",
          }}
        >
          {/* Drag handle area */}
          <div
            className="flex shrink-0 touch-none flex-col items-center pt-3 pb-1"
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
          >
            <div className="h-1 w-10 rounded-full bg-[var(--border-default)] opacity-60" />
          </div>

          {/* Sheet header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--home-border)] px-4 pb-3">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-tertiary)] transition active:scale-95"
              onClick={onClose}
              type="button"
            >
              <X size={15} weight="bold" />
            </button>
            <button
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95 ${
                sheetHeight >= SNAP_FULL - 5
                  ? "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                  : "bg-[var(--brand-dim)] text-[var(--brand)]"
              }`}
              onClick={() => {
                setIsSnapping(true);
                setSheetHeight(sheetHeight >= SNAP_FULL - 5 ? SNAP_PEEK : SNAP_FULL);
              }}
              type="button"
            >
              {sheetHeight >= SNAP_FULL - 5 ? "Collapse" : "Expand"}
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <PaneContent
              event={event}
              organizer={organizer}
              images={images}
              onClose={onClose}
              onSetPhotoModal={setPhotoModal}
              onToggleSaved={() => setSaved((v) => !v)}
              saved={saved}
            />
          </div>

          {/* Sticky footer */}
          <PaneFooter event={event} onToggleSaved={() => setSaved((v) => !v)} saved={saved} onGetTickets={() => setTicketModalOpen(true)} />
        </div>

        {photoModal.open && (
          <PhotoModal
            images={images}
            initialIndex={photoModal.index}
            onClose={() => setPhotoModal({ open: false, index: 0 })}
          />
        )}

        {ticketModalOpen && (
          <GetTicketModal
            event={{
              id: event.id,
              title: event.title,
              date: event.dateLabel,
              time: event.timeLabel,
              venue: event.venue,
              imageUrl: images[0],
              organizer: organizer.name,
              ticketTypes: event.ticketTypes.map((t) => ({
                id: t.id,
                name: t.name,
                price: t.price,
                priceType: t.priceType,
                description: t.remainingLabel,
                maxPerUser: 4,
              })),
            }}
            onClose={() => setTicketModalOpen(false)}
          />
        )}
      </>
    );
  }

  // ── Desktop side panel ──
  return (
    <>
      <div
        className="fixed right-0 top-0 z-50 flex h-screen flex-col border-l border-[var(--home-border)] bg-[var(--bg-card)] shadow-[-8px_0_48px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out"
        style={{ width: paneWidth, transform: mounted ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Drag handle */}
        <div
          className="absolute left-0 top-0 z-10 h-full w-2 cursor-col-resize opacity-0 transition-opacity hover:bg-[var(--brand)]/20 hover:opacity-100"
          onMouseDown={onDragStart}
        />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--home-border)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              onClick={onClose}
              title="Close"
              type="button"
            >
              <X size={15} weight="bold" />
            </button>
            <Link
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              href={`/events/${event.slug}`}
              title="Open full page"
            >
              <ArrowsOutSimple size={14} weight="bold" />
            </Link>
          </div>
          <p className="text-xs font-medium text-[var(--text-tertiary)] opacity-60">Drag edge to resize</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <PaneContent
            event={event}
            organizer={organizer}
            images={images}
            onClose={onClose}
            onSetPhotoModal={setPhotoModal}
            onToggleSaved={() => setSaved((v) => !v)}
            saved={saved}
          />
        </div>

        {/* Sticky footer */}
        <PaneFooter event={event} onToggleSaved={() => setSaved((v) => !v)} saved={saved} onGetTickets={() => setTicketModalOpen(true)} />
      </div>

      {photoModal.open && (
        <PhotoModal
          images={images}
          initialIndex={photoModal.index}
          onClose={() => setPhotoModal({ open: false, index: 0 })}
        />
      )}

      {ticketModalOpen && (
        <GetTicketModal
          event={{
            id: event.id,
            title: event.title,
            date: event.dateLabel,
            time: event.timeLabel,
            venue: event.venue,
            imageUrl: images[0],
            organizer: organizer.name,
            ticketTypes: event.ticketTypes.map((t) => ({
              id: t.id,
              name: t.name,
              price: t.price,
              priceType: t.priceType,
              description: t.remainingLabel,
              maxPerUser: 4,
            })),
          }}
          onClose={() => setTicketModalOpen(false)}
        />
      )}
    </>
  );
}
