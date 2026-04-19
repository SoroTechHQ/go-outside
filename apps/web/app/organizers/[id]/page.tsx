"use client";

import { Fragment, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Avatar from "boring-avatars";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  CalendarBlank,
  DotsThreeVertical,
  ShieldCheck,
  Ticket,
  Users,
  Star,
  ArrowSquareOut,
  ShareNetwork,
  Fire,
  Trophy,
  Lightning,
  SealCheck,
  Heart,
  CheckCircle,
  ArrowRight,
  X,
  Code,
  ForkKnife,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  events as demoEvents,
  getOrganizerById,
  getEventImage,
} from "@gooutside/demo-data";

/* ── Constants ────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

/* ── Organizer metadata ───────────────────────────────────────────────────── */

type OrgMeta = {
  coverUrl: string;
  followers: number;
  totalAttendees: number;
  avgRating: number;
  eventsHosted: number;
  foundedAt: string;
  description: string;
  specialties: string[];
  mission: string;
  achievements: { icon: React.ReactNode; label: string; color: string }[];
  reviews: { id: string; reviewer: string; handle: string; rating: number; body: string; time: string }[];
};

const ORG_META: Record<string, OrgMeta> = {
  "org-sankofa-sessions": {
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&w=1400&fit=crop",
    followers: 2840, totalAttendees: 5200, avgRating: 4.9, eventsHosted: 14, foundedAt: "January 2023",
    description: "Born in Accra's fast-evolving creative scene, Sankofa Sessions has become the city's go-to for curated cultural experiences. We believe the best events create community — not just attendance records. Every edition is built around a feeling, not just a lineup.",
    specialties: ["Curated Music", "Rooftop & Outdoor", "Cultural Programming", "Artist Showcases"],
    mission: "To make Accra's event culture globally relevant, one unforgettable night at a time.",
    achievements: [
      { icon: <Trophy size={14} />, label: "Sold Out 4× in a Row", color: "#DAA520" },
      { icon: <Fire size={14} />, label: "Trending This Month", color: "#c87c2a" },
      { icon: <SealCheck size={14} />, label: "Community Favorite", color: "#4a9f63" },
      { icon: <Lightning size={14} />, label: "Rising Scene Maker", color: "#7c6fc8" },
    ],
    reviews: [
      { id: "r-s1", reviewer: "Ama Koomson", handle: "@ama.k", rating: 5, body: "Every Sankofa event feels intentional. You can tell there's real curation — it's never just a party with a flyer.", time: "2 weeks ago" },
      { id: "r-s2", reviewer: "Yaw Darko", handle: "@yawdarko", rating: 5, body: "The venue choices are always 10/10. The crowd is always right. Never been disappointed at a Sankofa night.", time: "1 month ago" },
      { id: "r-s3", reviewer: "Esi Mensah", handle: "@esi.m_accra", rating: 4, body: "Strong energy, strong crowd, strong music. I know what I'm getting and I keep coming back for it.", time: "1 month ago" },
    ],
  },
  "org-build-ghana": {
    coverUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&w=1400&fit=crop",
    followers: 1640, totalAttendees: 3100, avgRating: 4.7, eventsHosted: 8, foundedAt: "March 2022",
    description: "Build Ghana Labs creates the infrastructure for Ghana's tech and innovation ecosystem to grow. Our events connect founders, investors, developers, and dreamers in rooms that actually move things forward.",
    specialties: ["Tech Conferences", "Startup Networking", "Hackathons", "Investor Forums"],
    mission: "Building the village that builds the country.",
    achievements: [
      { icon: <Code size={14} />, label: "Top Ecosystem Builder", color: "#4a9f63" },
      { icon: <Trophy size={14} />, label: "Consistently Oversubscribed", color: "#DAA520" },
      { icon: <Users size={14} />, label: "500+ Connections Made", color: "#c87c2a" },
      { icon: <Lightning size={14} />, label: "Top Startup Event 2024", color: "#7c6fc8" },
    ],
    reviews: [
      { id: "r-b1", reviewer: "Yaw Darko", handle: "@yawdarko", rating: 5, body: "This is what ecosystem events should look like. Real substance, real connections. Left with 3 new contacts and a startup idea.", time: "3 weeks ago" },
      { id: "r-b2", reviewer: "Ama Koomson", handle: "@ama.k", rating: 4, body: "Came for the talks, stayed for the side conversations. The format encourages actual mixing — rare for a tech event.", time: "1 month ago" },
    ],
  },
  "org-lakefront-social": {
    coverUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&w=1400&fit=crop",
    followers: 980, totalAttendees: 1800, avgRating: 4.8, eventsHosted: 6, foundedAt: "July 2023",
    description: "The Lakefront Social Club is Accra's answer to the question: where do you go to actually slow down and enjoy the city? Our events are curated for genuine connection — the kind that happens over a good meal, a slow sunset, and no agenda.",
    specialties: ["Social Gatherings", "Food & Wine", "Wellness Events", "Sunset Sessions"],
    mission: "Creating the kind of spaces where good conversations happen naturally.",
    achievements: [
      { icon: <ForkKnife size={14} />, label: "Best F&B Experience", color: "#c87c2a" },
      { icon: <SealCheck size={14} />, label: "Most Chill Atmosphere", color: "#4a9f63" },
      { icon: <Star size={14} />, label: "4.8★ Average Rating", color: "#DAA520" },
      { icon: <Heart size={14} />, label: "90% Return Guests", color: "#c87c2a" },
    ],
    reviews: [
      { id: "r-l1", reviewer: "Esi Mensah", handle: "@esi.m_accra", rating: 5, body: "The lakefront view alone is worth the ticket price. Everything else is a very welcome bonus. The pacing is perfect — never rushed.", time: "2 weeks ago" },
      { id: "r-l2", reviewer: "Ama Koomson", handle: "@ama.k", rating: 5, body: "Chilled vibes, great food, better crowd. My go-to for weekend unwinding. The chef's menu selection has never missed.", time: "1 month ago" },
    ],
  },
};

const FALLBACK_META = ORG_META["org-sankofa-sessions"];

/* ── People sheet ─────────────────────────────────────────────────────────── */

type MiniFollower = { id: string; name: string; handle: string; pulseTier: string };

const MOCK_ORG_FOLLOWERS: MiniFollower[] = [
  { id: "ama-k", name: "Ama Koomson", handle: "@ama.k", pulseTier: "Scene Kid" },
  { id: "yaw-darko", name: "Yaw Darko", handle: "@yawdarko", pulseTier: "City Native" },
  { id: "esi-m", name: "Esi Mensah", handle: "@esi.m_accra", pulseTier: "Scene Kid" },
  { id: "user-kwame", name: "Kwame Asante", handle: "@kwame.asante", pulseTier: "Regular" },
  { id: "user-abena", name: "Abena Kyei", handle: "@abena.k", pulseTier: "Explorer" },
  { id: "user-nii", name: "Nii Ofori", handle: "@nii.ofori", pulseTier: "Scene Kid" },
];

const TIER_COLOR: Record<string, string> = {
  Newcomer: "#888", Explorer: "#4a9f63", Regular: "#4a9f63",
  "Scene Kid": "#4a9f63", "City Native": "#c87c2a", Legend: "#DAA520",
};

function FollowersSheet({
  open, onClose, followerCount,
}: { open: boolean; onClose: () => void; followerCount: number }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = MOCK_ORG_FOLLOWERS.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.handle.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const inner = (
    <>
      <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" />
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <p className="font-display text-[17px] font-bold italic text-[var(--text-primary)]">
          Followers · {followerCount.toLocaleString()}
        </p>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
          <X size={15} weight="bold" />
        </button>
      </div>
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2">
          <MagnifyingGlass size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search followers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => { onClose(); router.push(`/dashboard/user/${f.id}`); }}
            className="flex w-full items-center gap-3 px-5 py-3 transition hover:bg-[var(--bg-card)]"
          >
            <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 40, height: 40 }}>
              <Avatar size={40} name={f.name} variant="beam" colors={AVATAR_COLORS} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{f.name}</p>
              <p className="truncate text-[11px] text-[var(--text-tertiary)]">{f.handle}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold"
              style={{
                color: TIER_COLOR[f.pulseTier] ?? "#888",
                backgroundColor: `${TIER_COLOR[f.pulseTier] ?? "#888"}18`,
                border: `1px solid ${TIER_COLOR[f.pulseTier] ?? "#888"}30`,
              }}
            >
              {f.pulseTier}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-[12px] text-[var(--text-tertiary)]">No results found.</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
      {/* Mobile: bottom sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out md:hidden ${open ? "translate-y-0" : "translate-y-full"}`}>
        {inner}
      </div>
      {/* Desktop: centered modal */}
      <div className={`fixed left-1/2 top-1/2 z-50 hidden w-[500px] max-h-[82vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#4a9f63]/15 bg-[var(--bg-base)] shadow-[0_32px_72px_rgba(0,0,0,0.65)] transition-[opacity,transform] duration-200 md:flex ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.96] pointer-events-none"}`}>
        {inner}
      </div>
    </>
  );
}

/* ── Slim stats row ────────────────────────────────────────────────────────── */

type StatItem = { icon: React.ElementType; value: number | string; label: string; onClick?: () => void };

function ProfileStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex items-stretch border-y border-[var(--border-subtle)]">
      {stats.map((stat, i, arr) => (
        <Fragment key={stat.label}>
          <button
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className="flex flex-1 flex-col items-center gap-0.5 py-4 transition hover:bg-[var(--bg-card)] active:scale-[0.97] disabled:cursor-default"
          >
            <div className="flex items-center gap-1.5">
              <stat.icon size={13} className="text-[var(--text-tertiary)]" />
              <span className="text-[1.05rem] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                {typeof stat.value === "number"
                  ? stat.value >= 1000
                    ? `${(stat.value / 1000).toFixed(1)}K`
                    : stat.value
                  : stat.value}
              </span>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              {stat.label}
            </span>
          </button>
          {i < arr.length - 1 && <div className="self-center h-7 w-px bg-[var(--border-subtle)]" />}
        </Fragment>
      ))}
    </div>
  );
}

/* ── Review card ──────────────────────────────────────────────────────────── */

function ReviewCard({ review }: { review: OrgMeta["reviews"][number] }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
      <div className="flex items-start gap-3">
        <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 36, height: 36 }}>
          <Avatar size={36} name={review.reviewer} variant="beam" colors={AVATAR_COLORS} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{review.reviewer}</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{review.handle}</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">· {review.time}</span>
          </div>
          <div className="mt-1.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} weight={i < review.rating ? "fill" : "regular"} className={i < review.rating ? "text-[#DAA520]" : "text-white/20"} />
            ))}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{review.body}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */

type Tab = "events" | "reviews" | "about";
const TABS: { id: Tab; label: string }[] = [
  { id: "events", label: "Events" },
  { id: "reviews", label: "Reviews" },
  { id: "about", label: "About" },
];

export default function OrganizerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);

  const id = typeof params.id === "string" ? params.id : "org-sankofa-sessions";

  const { data: organizer } = useQuery({
    queryKey: ["organizer", id],
    queryFn: () => getOrganizerById(id) ?? getOrganizerById("org-sankofa-sessions")!,
    staleTime: Infinity,
  });

  const { data: orgEvents = [] } = useQuery({
    queryKey: ["organizer-events", id],
    queryFn: () => demoEvents.filter((e) => e.organizerId === id),
    staleTime: Infinity,
    enabled: !!id,
  });

  if (!organizer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <p className="font-display text-[18px] italic text-[var(--text-secondary)]">Organizer not found</p>
          <button onClick={() => router.back()} className="mt-3 text-[13px] text-[#4a9f63] hover:underline">← Go back</button>
        </div>
      </main>
    );
  }

  const meta = ORG_META[id] ?? FALLBACK_META;
  const upcomingEvents = orgEvents.filter((e) => e.status !== "past").slice(0, 4);
  const pastEvents = orgEvents.slice(2).slice(0, 6);

  const profileStats: StatItem[] = [
    { icon: Ticket,    value: meta.eventsHosted,    label: "Events",    onClick: () => setTab("events") },
    { icon: Users,     value: meta.followers,        label: "Followers", onClick: () => setFollowersOpen(true) },
    { icon: Users,     value: meta.totalAttendees,   label: "Attendees" },
    { icon: Star,      value: `${meta.avgRating}★`,  label: "Rating",    onClick: () => setTab("reviews") },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">

      {/* ── Cover ────────────────────────────────────────────────────────── */}
      <div className="relative h-[240px] w-full overflow-hidden md:h-[280px]">
        <Image src={meta.coverUrl} alt="Cover" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.05)_38%,rgba(0,0,0,0.65)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(74,159,99,0.15),transparent_45%)]" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between md:left-6 md:right-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft size={17} weight="bold" />
          </button>
          <div className="flex items-center gap-2">
            {organizer.verified && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#4a9f63]/40 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4a9f63] backdrop-blur-sm">
                <ShieldCheck size={11} weight="fill" />
                Verified Organizer
              </span>
            )}
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95">
              <DotsThreeVertical size={17} weight="bold" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 right-4">
          <span className="flex items-center gap-1.5 rounded-full border border-[#DAA520]/30 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-[#DAA520] backdrop-blur-sm">
            <Star size={11} weight="fill" />
            {meta.avgRating} avg rating
          </span>
        </div>
      </div>

      {/* ── Layout ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_272px] md:gap-6 md:px-6 lg:grid-cols-[1fr_288px] lg:gap-8 lg:px-8">
        <div className="min-w-0">

          {/* Avatar — overlaps cover only */}
          <div className="-mt-12 pb-3 md:-mt-14">
            <div
              className="relative shrink-0 overflow-hidden rounded-[20px] border-4 border-[var(--bg-base)] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              style={{ width: 84, height: 84 }}
            >
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0e2212] to-[#152a1a] text-xl font-black tracking-tight text-[#4a9f63]">
                {organizer.name.slice(0, 2).toUpperCase()}
              </div>
              {organizer.verified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--bg-base)] bg-[#4a9f63]">
                  <CheckCircle size={12} weight="fill" className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Identity + CTAs — fully in content area */}
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)] md:text-[26px]">
                  {organizer.name}
                </h1>
                {organizer.verified && <ShieldCheck size={20} weight="fill" className="text-[#4a9f63]" />}
              </div>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{organizer.tag}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                {organizer.city && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                    <MapPin size={11} />{organizer.city}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <CalendarBlank size={11} />Since {meta.foundedAt}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {meta.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-3 py-1 text-[10px] font-medium text-[#4a9f63]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-0.5 flex shrink-0 items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95">
                <ShareNetwork size={15} />
              </button>
              <button
                onClick={() => setIsFollowing((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold shadow-sm transition active:scale-95 ${
                  isFollowing
                    ? "border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                    : "border-[#4a9f63]/40 bg-[var(--bg-card)] text-[#4a9f63]"
                }`}
              >
                <Heart size={13} weight={isFollowing ? "fill" : "regular"} />
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => setTab("events")}
                className="hidden items-center gap-1.5 rounded-full bg-[#4a9f63] px-4 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)] transition hover:bg-[#3a8f53] active:scale-95 sm:flex"
              >
                Explore Events
                <ArrowSquareOut size={13} />
              </button>
              <button
                onClick={() => setTab("events")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a9f63] text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)] transition hover:bg-[#3a8f53] active:scale-95 sm:hidden"
              >
                <ArrowSquareOut size={15} />
              </button>
            </div>
          </div>

          {/* ── Slim stats row ──────────────────────────────────────────── */}
          <ProfileStats stats={profileStats} />

          {/* Event Cred card */}
          <div
            className="relative my-4 overflow-hidden rounded-[20px] p-5"
            style={{ background: "linear-gradient(135deg,#0e2212 0%,#152a1a 50%,#0b1a10 100%)" }}
          >
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at top right,rgba(74,159,99,0.2),transparent 55%)" }} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a9f63]">Organizer Cred</span>
                {organizer.verified && (
                  <span className="flex items-center gap-1 rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/12 px-2.5 py-1 text-[9px] font-bold text-[#4a9f63]">
                    <ShieldCheck size={9} weight="fill" />Verified
                  </span>
                )}
              </div>
              <p className="mt-2 font-display text-[1.5rem] font-bold italic text-white">Top Organizer</p>
              <p className="mt-1 text-[12px] text-white/45">Recognized by the GoOutside community for consistent excellence</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {meta.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-[12px] border bg-white/4 px-3 py-2.5" style={{ borderColor: `${a.color}28` }}>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]" style={{ backgroundColor: `${a.color}18`, color: a.color }}>
                      {a.icon}
                    </div>
                    <span className="text-[11px] font-medium text-white/65">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tab bar ────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-20 -mx-4 bg-[var(--bg-base)] pt-1 md:mx-0">
            <div className="no-scrollbar flex overflow-x-auto border-b border-[var(--border-subtle)] px-4 md:px-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${tab === t.id ? "text-[#4a9f63]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
                >
                  {t.label}
                  {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#4a9f63]" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ─────────────────────────────────────────────── */}
          <div className="pb-12 pt-4">

            {/* EVENTS */}
            {tab === "events" && (
              <div className="space-y-4">
                {upcomingEvents[0] && (
                  <div>
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Featured</p>
                    <button
                      onClick={() => router.push(`/events/${upcomingEvents[0].slug}`)}
                      className="group relative w-full overflow-hidden rounded-[20px] text-left"
                    >
                      <div className="relative aspect-[2.4/1] overflow-hidden">
                        <img
                          src={getEventImage(undefined, upcomingEvents[0].categorySlug)}
                          alt={upcomingEvents[0].title}
                          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.72)_100%)]" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                            {upcomingEvents[0].eyebrow}
                          </span>
                          <p className="mt-2 text-[1.1rem] font-bold leading-tight text-white">{upcomingEvents[0].title}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[11px] text-white/60">{upcomingEvents[0].dateLabel} · {upcomingEvents[0].venue}</span>
                            <span className="flex items-center gap-1.5 rounded-full bg-[#4a9f63] px-3 py-1.5 text-[11px] font-bold text-white">
                              Get Tickets <ArrowRight size={11} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {upcomingEvents.length > 1 && (
                  <div>
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Upcoming</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {upcomingEvents.slice(1).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => router.push(`/events/${event.slug}`)}
                          className="group relative aspect-[0.85] overflow-hidden rounded-[18px] text-left"
                        >
                          <img src={getEventImage(undefined, event.categorySlug)} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.72)_100%)]" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-[11px] font-semibold leading-tight text-white">{event.title}</p>
                            <p className="mt-0.5 text-[9px] text-white/50">{event.dateLabel}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Past Events</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {pastEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => router.push(`/events/${event.slug}`)}
                          className="group relative aspect-[0.85] overflow-hidden rounded-[18px] opacity-75 transition-opacity hover:opacity-100"
                        >
                          <img src={getEventImage(undefined, event.categorySlug)} alt={event.title} className="h-full w-full object-cover grayscale-[25%] transition group-hover:grayscale-0 duration-500" />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.72)_100%)]" />
                          <div className="absolute left-2.5 top-2.5">
                            <span className="rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[8px] font-semibold uppercase text-white/80 backdrop-blur-sm">Past</span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-[11px] font-semibold leading-tight text-white">{event.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {orgEvents.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Ticket size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No events yet</p>
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS */}
            {tab === "reviews" && (
              <div className="space-y-3">
                <div className="mb-2 overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-display text-[2.6rem] font-bold italic leading-none text-[var(--text-primary)]">{meta.avgRating}</p>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} weight={i < Math.round(meta.avgRating) ? "fill" : "regular"} className={i < Math.round(meta.avgRating) ? "text-[#DAA520]" : "text-[var(--text-tertiary)]"} />
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{meta.reviews.length} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3].map((n) => {
                        const count = meta.reviews.filter((r) => r.rating === n).length;
                        const pct = Math.round((count / meta.reviews.length) * 100);
                        return (
                          <div key={n} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-[10px] text-[var(--text-tertiary)]">{n}★</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                              <div className="h-full rounded-full bg-[#DAA520]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-7 shrink-0 text-right text-[10px] text-[var(--text-tertiary)]">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {meta.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}

            {/* ABOUT */}
            {tab === "about" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Our Story</p>
                  <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{meta.description}</p>
                </div>
                <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Mission</p>
                  <p className="font-display text-[15px] italic leading-relaxed text-[var(--text-primary)]">"{meta.mission}"</p>
                </div>
                <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {meta.specialties.map((s) => (
                      <span key={s} className="rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-3 py-1.5 text-[12px] font-medium text-[#4a9f63]">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">By the Numbers</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Events Hosted", value: meta.eventsHosted },
                      { label: "Total Attendees", value: `${(meta.totalAttendees / 1000).toFixed(1)}K` },
                      { label: "Avg Rating", value: `${meta.avgRating} / 5` },
                      { label: "Followers", value: meta.followers.toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
                        <p className="text-[1rem] font-bold text-[var(--text-primary)]">{value}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════ SIDEBAR ═══════════════════════════════════════════════════ */}
        <aside className="hidden md:block">
          <div className="sticky top-6 mt-4 space-y-4">

            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">At a Glance</p>
              <div className="space-y-2">
                {[
                  { label: "Based in", value: organizer.city },
                  { label: "Active since", value: meta.foundedAt },
                  { label: "Events hosted", value: String(meta.eventsHosted), color: "#4a9f63" },
                  { label: "Community rating", value: `★ ${meta.avgRating}`, color: "#DAA520" },
                  { label: "Verified", value: organizer.verified ? "Yes" : "No", color: organizer.verified ? "#4a9f63" : undefined },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
                    <span className="text-[11px] font-semibold" style={{ color: color ?? "var(--text-primary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Achievements</p>
              <div className="space-y-2">
                {meta.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]" style={{ backgroundColor: `${a.color}18`, color: a.color }}>
                      {a.icon}
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary)]">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-[#4a9f63]/25 bg-gradient-to-br from-[#4a9f63]/10 to-[#4a9f63]/4 p-4 shadow-[var(--card-shadow)]">
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Stay in the loop</p>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">Follow {organizer.name} to get notified when new events drop.</p>
              <button
                onClick={() => setIsFollowing(true)}
                className="mt-3 w-full rounded-[12px] bg-[#4a9f63] py-2.5 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(74,159,99,0.3)] transition hover:bg-[#3a8f53] active:scale-[0.98]"
              >
                Follow {organizer.name}
              </button>
            </div>

          </div>
        </aside>
      </div>

      <FollowersSheet open={followersOpen} onClose={() => setFollowersOpen(false)} followerCount={meta.followers} />
    </main>
  );
}
