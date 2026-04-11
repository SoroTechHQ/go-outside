"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowsOutSimple,
  BookmarkSimple,
  CalendarBlank,
  CheckCircle,
  Clock,
  HeartStraight,
  MapPin,
  PaperPlaneTilt,
  ShieldCheck,
  Star,
  Ticket,
  X,
} from "@phosphor-icons/react";
import { events, getCategoryEmoji, getEventImage } from "@gooutside/demo-data";

type EventType = (typeof events)[number];

const ALL_CATEGORY_SLUGS = [
  "music", "food", "sports", "arts", "tech", "nightlife", "culture", "outdoors",
];

function getEventImages(event: EventType): string[] {
  const baseIdx = Math.max(0, ALL_CATEGORY_SLUGS.indexOf(event.categorySlug));
  return Array.from({ length: 8 }, (_, i) =>
    getEventImage(undefined, ALL_CATEGORY_SLUGS[(baseIdx + i) % ALL_CATEGORY_SLUGS.length]),
  );
}

const LINEUPS: Record<string, string[]> = {
  music: ["DJ Kwame × Akosua Asante", "Live Band: The Accra Collective", "Open Mic Session", "Closing Set: DJ Nana"],
  food: ["Chef Abena's Signature Menu", "Wine Pairing by Sommelier Kofi", "Live Cooking Demo", "Dessert Buffet"],
  sports: ["Opening Ceremony", "Main Match / Competition", "Half-time Show", "Awards & Closing"],
  arts: ["Exhibition Tour", "Live Painting Session", "Artist Talk", "Networking Reception"],
  tech: ["Keynote Address", "Panel: Future of African Tech", "Demo Pitches", "Networking Happy Hour"],
  nightlife: ["Warm-up: DJ Esi", "Main Act: Sarkodie × Friends", "Late Night DJ", "After-party"],
  culture: ["Traditional Dance", "Cultural Showcase", "Storytelling Session", "Community Feast"],
  outdoors: ["Morning Activity", "Midday Picnic", "Group Games", "Sunset Wrap-up"],
};

const SOCIAL_POSTS = [
  {
    user: "Ama K.",
    handle: "@ama.k",
    text: "Can't believe this is happening in Accra!! 🔥 The vibes are going to be immaculate.",
    avatar: "AK",
    time: "2h ago",
  },
  {
    user: "Yaw Darko",
    handle: "@yawdarko",
    text: "Been waiting for something like this all year. Grabbed my tickets the second they dropped.",
    avatar: "YD",
    time: "5h ago",
  },
  {
    user: "Esi M.",
    handle: "@esi.m_accra",
    text: "The venue alone is worth it 📍 Adding this to my list of unmissable experiences.",
    avatar: "EM",
    time: "1d ago",
  },
];

const POLICIES = [
  { label: "Cancellation", detail: "Full refund up to 48 hours before the event. No refunds after that." },
  { label: "Age Requirement", detail: "18+ unless otherwise noted. Valid ID required at entry." },
  { label: "Photography", detail: "Personal photography allowed. Commercial use requires prior written consent." },
  { label: "Entry", detail: "Gates open 30 minutes before start time. Latecomers admitted at discretion." },
];

function PhotoModal({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <X size={18} weight="bold" />
      </button>

      {/* Prev */}
      <button
        className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
        type="button"
      >
        <ArrowLeft size={18} weight="bold" />
      </button>

      {/* Image */}
      <div
        className="relative max-h-[88vh] max-w-[88vw] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-[75vh] w-[75vw] bg-cover bg-center"
          style={{ backgroundImage: `url(${images[idx]})` }}
        />
        {/* Dot nav */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              className={`rounded-full transition-all ${i === idx ? "h-1.5 w-5 bg-white" : "h-1.5 w-1.5 bg-white/40 hover:bg-white/70"}`}
              onClick={() => setIdx(i)}
              type="button"
            />
          ))}
        </div>
      </div>

      {/* Next */}
      <button
        className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
        type="button"
      >
        <ArrowRight size={18} weight="bold" />
      </button>

      <p className="absolute bottom-5 right-6 text-xs text-white/50">
        {idx + 1} / {images.length}
      </p>
    </div>
  );
}

export function EventSidePane({
  event,
  onClose,
  isFullScreen,
  onToggleFullScreen,
}: {
  event: EventType;
  onClose: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}) {
  const images = getEventImages(event);
  const [photoModal, setPhotoModal] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const [saved, setSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const rating = (3.8 + ((event.id?.charCodeAt(0) ?? 65) % 12) / 10).toFixed(1);
  const reviewCount = 48 + ((event.id?.charCodeAt(1) ?? 66) % 80);
  const lineup = LINEUPS[event.categorySlug] ?? LINEUPS.music ?? [];

  const mapLat = (5.6037 + (((event.id?.charCodeAt(0) ?? 65) % 10) - 5) * 0.018).toFixed(4);
  const mapLon = (-0.187 + (((event.id?.charCodeAt(1) ?? 66) % 10) - 5) * 0.018).toFixed(4);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(Number(mapLon) - 0.022).toFixed(4)}%2C${(Number(mapLat) - 0.015).toFixed(4)}%2C${(Number(mapLon) + 0.022).toFixed(4)}%2C${(Number(mapLat) + 0.015).toFixed(4)}&layer=mapnik&marker=${mapLat}%2C${mapLon}`;

  // Keyboard: Escape closes (unless photo modal is open)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !photoModal.open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, photoModal.open]);

  const paneWidth = isFullScreen ? "w-[800px]" : "w-[460px]";

  return (
    <>
      {/* Side pane */}
      <div
        className={`fixed right-0 top-0 z-40 flex h-screen flex-col border-l border-[var(--home-border)] bg-[var(--bg-card)] shadow-[-8px_0_40px_rgba(0,0,0,0.14)] transition-[width] duration-300 ease-in-out ${paneWidth}`}
      >
        {/* ── Header ── */}
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
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              onClick={onToggleFullScreen}
              title={isFullScreen ? "Collapse" : "Expand"}
              type="button"
            >
              <ArrowsOutSimple size={14} weight="bold" />
            </button>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--home-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            href={`/events/${event.slug}`}
          >
            Open full page
            <ArrowSquareOut size={11} weight="bold" />
          </Link>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          {/* Photo strip */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((img, i) => (
              <button
                key={i}
                className="relative h-28 w-44 shrink-0 overflow-hidden rounded-xl border border-[var(--home-border)] transition hover:opacity-90"
                onClick={() => setPhotoModal({ open: true, index: i })}
                type="button"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-300 hover:scale-[1.04]"
                  style={{ backgroundImage: `url(${img})` }}
                />
                {i === images.length - 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded-full border border-white/30 bg-black/40 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
                      +{images.length} photos
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-6 px-5 pb-12">
            {/* ── Title + category + rating ── */}
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2.5 py-0.5 text-[0.68rem] font-semibold text-[var(--brand)]">
                {getCategoryEmoji(event.categorySlug)} {event.eyebrow}
              </span>
              <h2 className="mt-2.5 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)]">
                {event.title}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={i < Math.floor(Number(rating)) ? "text-amber-400" : "text-[var(--text-tertiary)]"}
                      size={13}
                      weight={i < Math.floor(Number(rating)) ? "fill" : "regular"}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{rating}</span>
                <span className="text-xs text-[var(--text-tertiary)]">({reviewCount} reviews)</span>
              </div>
            </div>

            {/* ── Quick actions ── */}
            <div className="flex gap-2">
              <Link
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                href={`/events/${event.slug}`}
              >
                <Ticket size={15} weight="bold" />
                {event.priceValue === 0 ? "Get Free Tickets" : `Get Tickets · ${event.priceLabel}`}
              </Link>
              <button
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                  saved
                    ? "border-rose-400/50 bg-rose-50/10 text-rose-400"
                    : "border-[var(--home-border)] text-[var(--text-secondary)] hover:border-rose-400/50 hover:text-rose-400"
                }`}
                onClick={() => setSaved((v) => !v)}
                type="button"
              >
                <HeartStraight size={16} weight={saved ? "fill" : "regular"} />
              </button>
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--home-border)] text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                type="button"
              >
                <PaperPlaneTilt size={15} weight="regular" />
              </button>
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--home-border)] text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                type="button"
              >
                <BookmarkSimple size={15} weight="regular" />
              </button>
            </div>

            {/* ── Date / venue ── */}
            <div className="space-y-3 rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                  <CalendarBlank size={14} weight="regular" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{event.dateLabel}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{event.timeLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                  <MapPin size={14} weight="regular" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{event.venue}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{event.locationLine}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                  <Clock size={14} weight="regular" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Doors open 30 min early</p>
                  <p className="text-xs text-[var(--text-secondary)]">Arrive early to avoid queues</p>
                </div>
              </div>
            </div>

            {/* ── About ── */}
            <div>
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                About this event
              </p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {event.shortDescription ?? "An unmissable experience."} Join us for an unforgettable evening in the heart of {event.city}. This is one of those events you'll be talking about for months — curated for the culture, built for the moment.
              </p>
            </div>

            {/* ── Map ── */}
            <div>
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Location
              </p>
              <div className="overflow-hidden rounded-xl border border-[var(--home-border)]">
                <iframe
                  className="h-[180px] w-full"
                  loading="lazy"
                  src={mapSrc}
                  title={`Map for ${event.venue}`}
                />
                <div className="flex items-center justify-between border-t border-[var(--home-border)] bg-[var(--bg-surface)] px-3 py-2">
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    {event.venue}, {event.locationLine}
                  </p>
                  <a
                    className="ml-2 shrink-0 text-xs font-medium text-[var(--brand)] hover:underline"
                    href={`https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLon}#map=15/${mapLat}/${mapLon}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open maps ↗
                  </a>
                </div>
              </div>
            </div>

            {/* ── Lineup / What's happening ── */}
            <div>
              <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                What's happening
              </p>
              <div className="space-y-2">
                {lineup.map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.65rem] font-bold text-[var(--brand)]">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── About the host ── */}
            <div>
              <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                About the host
              </p>
              <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-emerald-700 text-sm font-bold text-white">
                    {(event.city ?? "AC").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[var(--text-primary)]">Accra Events Co.</p>
                      <CheckCircle size={14} weight="fill" className="text-[var(--brand)]" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Verified organizer · 47 events hosted</p>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                      One of Accra's leading event curators, bringing world-class experiences to the city since 2019.
                    </p>
                  </div>
                </div>
                <Link
                  className="mt-3 block w-full rounded-lg border border-[var(--home-border)] py-2 text-center text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  href="#"
                >
                  Visit host page →
                </Link>
              </div>
            </div>

            {/* ── What people are saying ── */}
            <div>
              <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                What people are saying
              </p>
              <div className="space-y-2.5">
                {SOCIAL_POSTS.map((post) => (
                  <div
                    key={post.handle}
                    className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.6rem] font-bold text-[var(--brand)]">
                        {post.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{post.user}</p>
                        <p className="text-[0.65rem] text-[var(--text-tertiary)]">
                          {post.handle} · {post.time}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{post.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Policies ── */}
            <div>
              <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Policies
              </p>
              <div className="divide-y divide-[var(--home-border)] overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)]">
                {POLICIES.map((policy) => (
                  <div key={policy.label} className="flex items-start gap-3 px-4 py-3">
                    <ShieldCheck
                      size={13}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-[var(--brand)]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{policy.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{policy.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {photoModal.open && (
        <PhotoModal
          images={images}
          initialIndex={photoModal.index}
          onClose={() => setPhotoModal({ open: false, index: 0 })}
        />
      )}
    </>
  );
}
