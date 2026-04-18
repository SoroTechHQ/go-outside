"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Avatar from "boring-avatars";
import {
  ArrowLeft,
  MapPin,
  CalendarBlank,
  ChatCircleDots,
  DotsThreeVertical,
  Fire,
  Heart,
  ChatCircle,
  ArrowsClockwise,
  Ticket,
  Users,
  Star,
  CheckCircle,
  PencilLine,
  UserPlus,
  UserMinus,
  ArrowRight,
} from "@phosphor-icons/react";
import { getEventImage } from "@gooutside/demo-data";
import {
  getCommunityPastEvents,
  getCommunityProfileById,
  getUserPosts,
  getUserSnippets,
  type CommunityProfile,
  type UserPost,
  type UserSnippet,
} from "../../../../lib/mock-community";

/* ── Constants ────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

const TIER_COLOR: Record<string, string> = {
  Newcomer: "#888888",
  Explorer: "#4a9f63",
  Regular: "#4a9f63",
  "Scene Kid": "#4a9f63",
  "City Native": "#c87c2a",
  Legend: "#DAA520",
};

const MOCK_FOLLOWING = [
  { id: "org-sankofa", name: "Sankofa Sessions", tag: "Curated city culture", type: "organizer" as const, verified: true },
  { id: "org-build", name: "Build Ghana Collective", tag: "Tech & innovation", type: "organizer" as const, verified: true },
  { id: "user-esi-badu", name: "Esi Badu", tag: "@esi.badu", type: "person" as const, tierBadge: "Scene Kid" },
  { id: "user-nii-ofori", name: "Nii Ofori", tag: "@nii.ofori", type: "person" as const, tierBadge: "Explorer" },
  { id: "user-kwame-a", name: "Kwame Asante", tag: "@kwame.asante", type: "person" as const, tierBadge: "City Native" },
];

const MUTUAL_FRIENDS = [
  { id: "mf-1", name: "Ama Darko", eventsInCommon: 4 },
  { id: "mf-2", name: "Kwame Asante", eventsInCommon: 2 },
  { id: "mf-3", name: "Abena Kyei", eventsInCommon: 1 },
];

/* ── Sub-components ───────────────────────────────────────────────────────── */

function ProfileAvatarBlock({
  name,
  avatarUrl,
  isOnline,
  tierColor,
}: {
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  tierColor: string;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: 88,
          height: 88,
          boxShadow: `0 0 0 3px var(--bg-base), 0 0 0 5px ${tierColor}55`,
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={88} height={88} className="h-full w-full object-cover" />
        ) : (
          <Avatar size={88} name={name} variant="beam" colors={AVATAR_COLORS} />
        )}
      </div>
      <span
        className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-base)] ${
          isOnline ? "bg-[#4a9f63]" : "bg-[#444]"
        }`}
      />
    </div>
  );
}

function StatChip({
  value,
  label,
  onClick,
}: {
  value: string | number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-[16px] border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-3 shadow-[var(--card-shadow)] transition hover:border-[#4a9f63]/30 active:scale-[0.97]"
    >
      <span className="font-display text-[1.2rem] font-bold italic leading-none text-[var(--text-primary)]">
        {typeof value === "number" && value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {label}
      </span>
    </button>
  );
}

function PulseCard({
  score,
  tier,
  tierColor,
}: {
  score: number;
  tier: string;
  tierColor: string;
}) {
  const progress = Math.min(90, Math.round(((score % 1000) / 1000) * 100));
  const nextTierMap: Record<string, string> = {
    Newcomer: "Explorer",
    Explorer: "Regular",
    Regular: "Scene Kid",
    "Scene Kid": "City Native",
    "City Native": "Legend",
    Legend: "Max Tier",
  };
  const nextTier = nextTierMap[tier] ?? "Max Tier";

  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-5"
      style={{
        background: "linear-gradient(135deg, #0e2212 0%, #152a1a 50%, #0b1a10 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at top right, ${tierColor}22, transparent 55%)` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: tierColor, backgroundColor: `${tierColor}18`, border: `1px solid ${tierColor}38` }}
          >
            {tier}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <Fire size={12} />
            <span>XP Score</span>
          </div>
        </div>
        <p className="mt-3 font-display text-[2.4rem] font-bold italic leading-none text-white">
          {score.toLocaleString()}
          <span className="ml-2 text-[1.1rem] font-normal text-white/30">pts</span>
        </p>
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: tierColor, boxShadow: `0 0 8px ${tierColor}55` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-[10px] text-white/30">{tier}</span>
            <span className="text-[10px] text-white/30">{nextTier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, user }: { post: UserPost; user: CommunityProfile }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
      <div className="flex items-start gap-3">
        <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 36, height: 36 }}>
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} width={36} height={36} className="h-full w-full object-cover" />
          ) : (
            <Avatar size={36} name={user.name} variant="beam" colors={AVATAR_COLORS} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{user.name}</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{user.handle}</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">· {post.time}</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{post.text}</p>

          {post.eventRef && (
            <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-[#4a9f63]/20 bg-[#4a9f63]/6 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#0e2212]">
                <img
                  src={getEventImage(undefined, post.eventRef.categorySlug)}
                  alt={post.eventRef.title}
                  className="h-full w-full object-cover opacity-80"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-[#4a9f63]">{post.eventRef.title}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Event</p>
              </div>
              <ArrowRight size={12} className="shrink-0 text-[#4a9f63]/50" />
            </div>
          )}

          <div className="mt-3 flex items-center gap-5">
            <button
              onClick={() => setLiked((v) => !v)}
              className={`flex items-center gap-1.5 text-[11px] transition ${
                liked ? "text-red-400" : "text-[var(--text-tertiary)] hover:text-red-400"
              }`}
            >
              <Heart size={14} weight={liked ? "fill" : "regular"} />
              {post.likes + (liked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[#4a9f63] transition">
              <ChatCircle size={14} />
              {post.comments}
            </button>
            <button className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[#4a9f63] transition">
              <ArrowsClockwise size={14} />
              {post.reposts}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: UserSnippet }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/5 bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] p-4 transition hover:border-[#4a9f63]/20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[13px] font-bold italic text-white">{snippet.eventName}</p>
          <p className="mt-0.5 text-[10px] text-white/30">{snippet.eventDate}</p>
        </div>
        {snippet.hasGoldBadge && (
          <span className="shrink-0 rounded-full border border-[rgba(218,165,32,0.28)] bg-[rgba(218,165,32,0.12)] px-2 py-0.5 text-[9px] font-bold text-[#DAA520]">
            ✦ Gold
          </span>
        )}
      </div>
      <div className="mt-2.5 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} weight={i < snippet.rating ? "fill" : "regular"} className={i < snippet.rating ? "text-[#DAA520]" : "text-white/20"} />
        ))}
      </div>
      <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-white/50">{snippet.body}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {snippet.vibeTags.map((tag) => (
          <span key={tag} className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] text-[#4a9f63]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

type Tab = "posts" | "been-there" | "snippets" | "following";

const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "been-there", label: "Been There" },
  { id: "snippets", label: "Snippets" },
  { id: "following", label: "Following" },
];

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const userId = typeof params.id === "string" ? params.id : "ama-k";
  const user = getCommunityProfileById(userId) ?? getCommunityProfileById("ama-k")!;
  const pastEvents = getCommunityPastEvents(user.id);
  const posts = getUserPosts(user.id);
  const snippets = getUserSnippets(user.id);
  const tierColor = TIER_COLOR[user.pulseTier] ?? "#4a9f63";

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">

      {/* ── Cover header ─────────────────────────────────────────────────── */}
      <div className="relative h-[200px] w-full overflow-hidden md:h-[240px]">
        {user.coverUrl ? (
          <Image src={user.coverUrl} alt="Cover" fill className="object-cover object-center" priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.1)_40%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.18),transparent_50%)]" />

        {/* Nav row inside cover */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between md:left-6 md:right-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
          >
            <ArrowLeft size={17} weight="bold" />
          </button>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm"
              style={{ backgroundColor: `${tierColor}22`, borderColor: `${tierColor}40` }}
            >
              {user.pulseTier}
            </span>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95">
              <DotsThreeVertical size={17} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_272px] md:gap-6 md:px-6 lg:grid-cols-[1fr_288px] lg:gap-8 lg:px-8">

        {/* ════ MAIN COLUMN ════════════════════════════════════════════════ */}
        <div className="min-w-0">

          {/* Avatar + CTAs */}
          <div className="-mt-11 flex items-end justify-between pb-4 md:-mt-12">
            <ProfileAvatarBlock
              name={user.name}
              avatarUrl={user.avatarUrl}
              isOnline={user.isOnline}
              tierColor={tierColor}
            />

            <div className="mb-1 flex items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95">
                <ChatCircleDots size={16} />
              </button>
              <button
                onClick={() => setIsFollowing((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold shadow-sm transition active:scale-95 ${
                  isFollowing
                    ? "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                    : "bg-[#4a9f63] text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)]"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus size={13} />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus size={13} />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Name, handle, bio, meta */}
          <div className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)] md:text-[26px]">
                {user.name}
              </h1>
              {user.followerCount > 200 && (
                <CheckCircle size={18} weight="fill" className="text-[#4a9f63]" />
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">{user.handle}</p>

            {user.bio && (
              <p className="mt-3 max-w-[480px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {user.bio}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {user.location && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <MapPin size={11} />
                  {user.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                <CalendarBlank size={11} />
                Joined {user.joinedAt}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.topCategories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-3 py-1 text-[10px] font-medium text-[#4a9f63]"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            <StatChip value={user.eventsAttended} label="Events" onClick={() => setTab("been-there")} />
            <StatChip value={user.followerCount} label="Followers" />
            <StatChip value={user.followingCount} label="Following" onClick={() => setTab("following")} />
            <StatChip value={user.pulseScore} label="XP" />
          </div>

          {/* Pulse score card */}
          <div className="mb-4">
            <PulseCard score={user.pulseScore} tier={user.pulseTier} tierColor={tierColor} />
          </div>

          {/* ── Sticky tab bar ─────────────────────────────────────────── */}
          <div className="sticky top-0 z-20 -mx-4 bg-[var(--bg-base)] pt-3 md:mx-0">
            <div className="no-scrollbar flex overflow-x-auto border-b border-[var(--border-subtle)] px-4 md:px-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    tab === t.id
                      ? "text-[#4a9f63]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#4a9f63]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ────────────────────────────────────────────── */}
          <div className="pb-12 pt-4">

            {/* POSTS TAB */}
            {tab === "posts" && (
              <div className="space-y-3">
                {posts.length > 0 ? (
                  posts.map((post) => <PostCard key={post.id} post={post} user={user} />)
                ) : (
                  <div className="flex flex-col items-center py-16 text-center">
                    <PencilLine size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No posts yet</p>
                  </div>
                )}
              </div>
            )}

            {/* BEEN THERE TAB */}
            {tab === "been-there" && (
              <div>
                {pastEvents.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Ticket size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No events yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {pastEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/events/${event.slug}`)}
                        className="group relative aspect-[0.85] overflow-hidden rounded-[18px] text-left"
                      >
                        <img
                          src={getEventImage(undefined, event.categorySlug)}
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.08)_40%,rgba(0,0,0,0.78)_100%)]" />
                        <div className="absolute left-2.5 top-2.5">
                          <span className="rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                            {event.eyebrow}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-[12px] font-semibold leading-tight text-white">{event.title}</p>
                          <p className="mt-0.5 text-[10px] text-white/60">{event.dateLabel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SNIPPETS TAB */}
            {tab === "snippets" && (
              <div className="space-y-3">
                {snippets.length > 0 ? (
                  snippets.map((s) => <SnippetCard key={s.id} snippet={s} />)
                ) : (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Star size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No snippets yet</p>
                  </div>
                )}
              </div>
            )}

            {/* FOLLOWING TAB */}
            {tab === "following" && (
              <div className="space-y-2">
                {MOCK_FOLLOWING.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 rounded-[14px] border border-[var(--border-card)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--card-shadow)]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-muted)]">
                      <Avatar size={36} name={person.name} variant="beam" colors={AVATAR_COLORS} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{person.name}</p>
                        {person.type === "organizer" && person.verified && (
                          <CheckCircle size={12} weight="fill" className="shrink-0 text-[#4a9f63]" />
                        )}
                      </div>
                      <p className="truncate text-[10px] text-[var(--text-tertiary)]">{person.tag}</p>
                    </div>
                    {person.type === "organizer" ? (
                      <span className="shrink-0 rounded-full border border-[#c87c2a]/25 bg-[#c87c2a]/8 px-2 py-0.5 text-[9px] font-medium text-[#c87c2a]">
                        Organizer
                      </span>
                    ) : (
                      "tierBadge" in person && person.tierBadge ? (
                        <span className="shrink-0 rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] font-medium text-[#4a9f63]">
                          {person.tierBadge}
                        </span>
                      ) : null
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ SIDEBAR (desktop only) ══════════════════════════════════════ */}
        <aside className="hidden md:block">
          <div className="sticky top-6 mt-4 space-y-4">

            {/* Mutual friends */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Mutual Friends
              </p>
              <div className="space-y-2.5">
                {MUTUAL_FRIENDS.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 32, height: 32 }}>
                      <Avatar size={32} name={f.name} variant="beam" colors={AVATAR_COLORS} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{f.eventsInCommon} events in common</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About / quick bio */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Scene Profile
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">Tier</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: tierColor }}
                  >
                    {user.pulseTier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">Events</span>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)]">{user.eventsAttended} attended</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">City</span>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)]">{user.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">Status</span>
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${user.isOnline ? "text-[#4a9f63]" : "text-[var(--text-tertiary)]"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.isOnline ? "bg-[#4a9f63]" : "bg-[#444]"}`} />
                    {user.isOnline ? "Active" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Scene tags */}
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Scenes
              </p>
              <div className="flex flex-wrap gap-2">
                {user.topCategories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-3 py-1.5 text-[11px] font-medium text-[#4a9f63]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </aside>

      </div>
    </main>
  );
}
