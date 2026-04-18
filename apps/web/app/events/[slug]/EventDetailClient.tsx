"use client";

import { useState, useEffect } from "react";
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
  PaperPlaneTilt,
  ShieldCheck,
  Star,
  Ticket,
  X,
} from "@phosphor-icons/react";
import { getCategoryEmoji, getEventImage } from "@gooutside/demo-data";
import type { events } from "@gooutside/demo-data";
import { SearchBar } from "../../../components/search/SearchBar";
import { useAppShell } from "../../../components/layout/AppShellContext";

type EventItem = (typeof events)[number];

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

const SOCIAL_POSTS = [
  { user: "Ama K.",    handle: "@ama.k",       text: "Can't believe this is happening in Accra!! 🔥 The vibes are going to be immaculate.", avatar: "AK", time: "2h ago" },
  { user: "Yaw Darko", handle: "@yawdarko",    text: "Been waiting for something like this all year. Grabbed my tickets the second they dropped.",  avatar: "YD", time: "5h ago" },
  { user: "Esi M.",    handle: "@esi.m_accra", text: "The venue alone is worth it 📍 Adding this to my list of unmissable experiences.",            avatar: "EM", time: "1d ago" },
];

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

const ORG_AVATARS = [
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&w=80&h=80&fit=crop&crop=faces",
];

function getEventImages(event: EventItem): string[] {
  const base = Math.max(0, ALL_SLUGS.indexOf(event.categorySlug));
  return Array.from({ length: 9 }, (_, i) =>
    getEventImage(undefined, ALL_SLUGS[(base + i) % ALL_SLUGS.length]),
  );
}

// ── Photo lightbox ─────────────────────────────────────────────────────────────
function PhotoLightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft")  setIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <button className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition" onClick={onClose} type="button">
        <X size={18} weight="bold" />
      </button>
      <button
        className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
        type="button"
      >
        <ArrowPrev size={20} weight="bold" />
      </button>
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="h-[80vh] w-auto max-w-[90vw] object-cover" />
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.slice(0, 9).map((_, i) => (
            <button key={i} className={`rounded-full transition-all ${i === idx ? "h-1.5 w-5 bg-white" : "h-1.5 w-1.5 bg-white/40 hover:bg-white/70"}`} onClick={() => setIdx(i)} type="button" />
          ))}
        </div>
      </div>
      <button
        className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
        type="button"
      >
        <ArrowNext size={20} weight="bold" />
      </button>
      <p className="absolute bottom-5 right-6 text-sm text-white/50">{idx + 1} / {images.length}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function EventDetailClient({ event }: { event: EventItem }) {
  const images = getEventImages(event);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { sidebarWidth } = useAppShell();

  const rating = (3.8 + ((event.id?.charCodeAt(0) ?? 65) % 12) / 10).toFixed(1);
  const reviewCount = 48 + ((event.id?.charCodeAt(1) ?? 66) % 80);
  const lineup = LINEUPS[event.categorySlug] ?? LINEUPS.music ?? [];

  const mapLat = (5.6037 + (((event.id?.charCodeAt(0) ?? 65) % 10) - 5) * 0.018).toFixed(4);
  const mapLon = (-0.187 + (((event.id?.charCodeAt(1) ?? 66) % 10) - 5) * 0.018).toFixed(4);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(Number(mapLon) - 0.022).toFixed(4)}%2C${(Number(mapLat) - 0.015).toFixed(4)}%2C${(Number(mapLon) + 0.022).toFixed(4)}%2C${(Number(mapLat) + 0.015).toFixed(4)}&layer=mapnik&marker=${mapLat}%2C${mapLon}`;

  return (
    <>
      <div
        className="fixed right-0 top-0 z-50 hidden md:block"
        style={{ left: sidebarWidth > 0 ? sidebarWidth : 0 }}
      >
        <div className="border-b border-[var(--home-border)] bg-[var(--bg-glass)] px-6 py-3 shadow-[var(--card-shadow)] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[1320px]">
            <SearchBar
              isCompact={false}
              isFocused={searchFocused}
              isMini={false}
              onFocusChange={setSearchFocused}
            />
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
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface)]"
                type="button"
              >
                <PaperPlaneTilt size={14} weight="bold" />
                Share
              </button>
              <button
                className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg-surface)] ${
                  saved ? "text-rose-500" : "text-[var(--text-primary)]"
                }`}
                onClick={() => setSaved(v => !v)}
                type="button"
              >
                <HeartStraight size={14} weight={saved ? "fill" : "bold"} />
                {saved ? "Saved" : "Save"}
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
              saved ? "text-rose-500" : "text-[var(--text-primary)]"
            }`}
            onClick={() => setSaved(v => !v)}
            type="button"
          >
            <HeartStraight size={16} weight={saved ? "fill" : "regular"} />
          </button>
        </div>
      </div>

      {/* ── Photo grid (Airbnb-style) ─────────────────────────────────────────── */}
      <div className="px-4 pt-[74px] md:px-6 md:pt-[148px]">
      <div className="relative hidden md:grid md:h-[56vh] md:min-h-[340px] md:max-h-[560px] md:grid-cols-4 md:grid-rows-2 md:gap-2 md:overflow-hidden md:rounded-[28px]">
        {/* Main hero — spans 2 cols × 2 rows */}
        <button
          className="relative col-span-2 row-span-2 overflow-hidden"
          onClick={() => setLightboxIdx(0)}
          type="button"
        >
          <img src={images[0]} alt={event.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" />
        </button>
        {/* 4 smaller photos */}
        {[1, 2, 3, 4].map((i, pos) => (
          <button
            key={i}
            className="relative overflow-hidden"
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-dim)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                {getCategoryEmoji(event.categorySlug)} {event.eyebrow}
              </span>
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
            <div className="flex items-center gap-4 border-b border-[var(--home-border)] py-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-emerald-700 text-[0.9rem] font-bold text-white">
                {(event.city ?? "AC").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[0.92rem] text-[var(--text-secondary)]">Hosted by</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Accra Events Co.</p>
                  <CheckCircle size={16} weight="fill" className="text-[var(--brand)]" />
                </div>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Verified · 47 events · Since 2019</p>
              </div>
            </div>

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

            {/* What's happening (lineup) */}
            <div className="border-b border-[var(--home-border)] py-8">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">What's happening</h2>
              <div className="mt-5 space-y-3">
                {lineup.map((item, i) => (
                  <div key={item} className="flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)]">
                    <div className="relative h-20 w-20 shrink-0">
                      <img src={images[(i + 3) % images.length]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 items-center gap-3 py-3 pr-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.65rem] font-bold text-[var(--brand)]">{i + 1}</span>
                      <span className="text-[0.95rem] text-[var(--text-primary)]">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="border-b border-[var(--home-border)] py-8">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Location</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.venue}, {event.locationLine}</p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--home-border)]">
                <iframe className="h-[280px] w-full" loading="lazy" src={mapSrc} title={`Map for ${event.venue}`} />
                <div className="flex items-center justify-between border-t border-[var(--home-border)] bg-[var(--bg-surface)] px-4 py-3">
                  <p className="truncate text-sm text-[var(--text-secondary)]">{event.venue}, {event.locationLine}</p>
                  <a className="ml-3 shrink-0 text-sm font-semibold text-[var(--brand)] hover:underline" href={`https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLon}#map=15/${mapLat}/${mapLon}`} rel="noopener noreferrer" target="_blank">Open maps ↗</a>
                </div>
              </div>
            </div>

            {/* Social buzz */}
            <div className="border-b border-[var(--home-border)] py-8">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Buzz online</h2>
              <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { platform: "instagram" as const, user: "@accra.vibes",  likes: "12.4K", caption: "This event is gonna go OFF 🔥 who's coming?",     thumbIdx: 0 },
                  { platform: "tiktok"    as const, user: "@kofi_events",  likes: "8.2K",  caption: "POV: you're about to have the time of your life",   thumbIdx: 1 },
                  { platform: "instagram" as const, user: "@nightlife_gh", likes: "5.7K",  caption: "Already have my tickets 🎟️ see you there!",           thumbIdx: 2 },
                  { platform: "tiktok"    as const, user: "@accra_out",    likes: "3.1K",  caption: "This city never sleeps and I'm here for it",         thumbIdx: 3 },
                ].map((reel, i) => (
                  <a
                    key={i}
                    className="group flex w-[160px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)] transition hover:-translate-y-1 hover:shadow-lg"
                    href={reel.platform === "instagram" ? "https://instagram.com" : "https://tiktok.com"}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <div className="relative h-[200px] overflow-hidden" style={{ background: `url(${REEL_THUMBNAILS[reel.thumbIdx]}) center/cover` }}>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                      <div className="absolute left-2 top-2 rounded-full px-2 py-0.5" style={{ backgroundColor: reel.platform === "instagram" ? "#E1306C" : "#010101" }}>
                        <span className="text-[0.58rem] font-bold uppercase tracking-wider text-white">{reel.platform === "instagram" ? "Insta" : "TikTok"}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white">
                        <HeartStraight size={11} weight="fill" />
                        <span className="text-[0.65rem] font-semibold">{reel.likes}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[0.7rem] font-semibold text-[var(--text-tertiary)]">{reel.user}</p>
                      <p className="mt-0.5 line-clamp-2 text-[0.75rem] text-[var(--text-secondary)]">{reel.caption}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="border-b border-[var(--home-border)] py-8">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Reviews</h2>
                <div className="flex items-center gap-1">
                  <Star size={14} weight="fill" className="text-amber-400" />
                  <span className="text-sm font-semibold">{rating} · {reviewCount} reviews</span>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {SOCIAL_POSTS.map(post => (
                  <div key={post.handle} className="rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.65rem] font-bold text-[var(--brand)]">{post.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{post.user}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{post.time}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">{post.text}</p>
                    <div className="mt-3 flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={12} weight={i < 5 ? "fill" : "regular"} className="text-amber-400" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div className="py-8">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Policies</h2>
              <div className="mt-5 divide-y divide-[var(--home-border)] overflow-hidden rounded-2xl border border-[var(--home-border)] bg-[var(--bg-surface)]">
                {POLICIES.map(policy => (
                  <div key={policy.label} className="flex items-start gap-4 px-5 py-4">
                    <ShieldCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-[var(--brand)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{policy.label}</p>
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{policy.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-2 px-6 py-4">
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
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]" type="button">
                  <Ticket size={16} weight="bold" />
                  {event.priceValue === 0 ? "Register for Free" : `Get Tickets · ${event.priceLabel}`}
                </button>
                <div className="flex gap-2">
                  <button
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition ${saved ? "border-rose-400/50 bg-rose-50/10 text-rose-400" : "border-[var(--home-border)] text-[var(--text-secondary)] hover:border-rose-400/50 hover:text-rose-400"}`}
                    onClick={() => setSaved(v => !v)}
                    type="button"
                  >
                    <HeartStraight size={15} weight={saved ? "fill" : "regular"} />
                    {saved ? "Saved" : "Save"}
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--home-border)] py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]" type="button">
                    <PaperPlaneTilt size={15} weight="regular" />
                    Share
                  </button>
                </div>
                <p className="text-center text-xs text-[var(--text-tertiary)]">You won't be charged yet</p>
              </div>

              {/* Organizer mini-card */}
              <div className="border-t border-[var(--home-border)] px-6 py-5">
                <div className="flex items-center gap-3">
                  {ORG_AVATARS.slice(0, 2).map((url, i) => (
                    <img key={i} alt="" className={`h-9 w-9 rounded-full border-2 border-[var(--bg-card)] object-cover ${i > 0 ? "-ml-3" : ""}`} src={url} />
                  ))}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">Accra Events Co.</p>
                      <CheckCircle size={13} weight="fill" className="shrink-0 text-[var(--brand)]" />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">Verified organizer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save/share below card */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] underline hover:text-[var(--text-primary)] transition" type="button">
                <BookmarkSimple size={14} />
                Add to wishlist
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <PhotoLightbox images={images} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}
