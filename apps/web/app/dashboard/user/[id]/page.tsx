"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Avatar from "boring-avatars";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
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
  Lightning,
  X,
  UserCheck,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { getEventImage } from "@gooutside/demo-data";
import { avatarUrl as withAvatarTransform } from "../../../../lib/image-url";
import {
  getCommunityPastEvents,
  getCommunityProfileById,
  getUserFollowers,
  getUserPosts,
  getUserSnippets,
  type CommunityProfile,
  type MiniUser,
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
  { id: "org-sankofa-sessions", name: "Sankofa Sessions", tag: "Curated city culture", type: "organizer" as const, verified: true },
  { id: "org-build-ghana", name: "Build Ghana Labs", tag: "Tech & innovation", type: "organizer" as const, verified: true },
  { id: "esi-m", name: "Esi Mensah", tag: "@esi.m_accra", type: "person" as const, tierBadge: "Scene Kid" },
  { id: "user-nii-ofori", name: "Nii Ofori", tag: "@nii.ofori", type: "person" as const, tierBadge: "Explorer" },
  { id: "user-kwame-a", name: "Kwame Asante", tag: "@kwame.asante", type: "person" as const, tierBadge: "City Native" },
];

/* ── People sheet (followers / following) ─────────────────────────────────── */

function PeopleSheet({
  open,
  onClose,
  title,
  people,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  people: MiniUser[];
}) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = people.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.handle.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const inner = (
    <>
      <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" />
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <p className="font-display text-[17px] font-bold italic text-[var(--text-primary)]">{title}</p>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
        >
          <X size={15} weight="bold" />
        </button>
      </div>
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2">
          <MagnifyingGlass size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.map((person) => (
          <button
            key={person.id}
            onClick={() => { onClose(); router.push(`/dashboard/user/${person.id}`); }}
            className="flex w-full items-center gap-3 px-5 py-3 transition hover:bg-[var(--bg-card)] active:scale-[0.99]"
          >
            <div className="relative shrink-0">
              <div className="overflow-hidden rounded-full" style={{ width: 40, height: 40 }}>
                {person.avatarUrl ? (
                  <Image src={withAvatarTransform(person.avatarUrl) ?? person.avatarUrl} alt={person.name} width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <Avatar size={40} name={person.name} variant="beam" colors={AVATAR_COLORS} />
                )}
              </div>
              {person.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--bg-base)] bg-[#4a9f63]" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{person.name}</p>
              <p className="truncate text-[11px] text-[var(--text-tertiary)]">{person.handle}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold"
              style={{
                color: TIER_COLOR[person.pulseTier] ?? "#888",
                backgroundColor: `${TIER_COLOR[person.pulseTier] ?? "#888"}18`,
                border: `1px solid ${TIER_COLOR[person.pulseTier] ?? "#888"}30`,
              }}
            >
              {person.pulseTier}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-[12px] text-[var(--text-tertiary)]">
            {people.length === 0 ? "Nothing here yet." : "No results found."}
          </p>
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Mobile: bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {inner}
      </div>
      {/* Desktop: centered modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 hidden w-[500px] max-h-[82vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-[#4a9f63]/15 bg-[var(--bg-base)] shadow-[0_32px_72px_rgba(0,0,0,0.65)] transition-[opacity,transform] duration-200 md:flex ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.96] pointer-events-none"
        }`}
      >
        {inner}
      </div>
    </>
  );
}

/* ── Stats row ────────────────────────────────────────────────────────────── */

type StatItem = {
  icon: React.ElementType;
  value: number | string;
  label: string;
  onClick?: () => void;
};

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
          {i < arr.length - 1 && (
            <div className="self-center h-7 w-px bg-[var(--border-subtle)]" />
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ── Pulse card ───────────────────────────────────────────────────────────── */

function PulseCard({ score, tier, tierColor }: { score: number; tier: string; tierColor: string }) {
  const progress = Math.min(92, Math.round(((score % 1000) / 1000) * 100));
  const nextTierMap: Record<string, string> = {
    Newcomer: "Explorer", Explorer: "Regular", Regular: "Scene Kid",
    "Scene Kid": "City Native", "City Native": "Legend", Legend: "Max",
  };

  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-5"
      style={{ background: "linear-gradient(135deg,#0e2212 0%,#152a1a 50%,#0b1a10 100%)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at top right,${tierColor}22,transparent 55%)` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: tierColor, backgroundColor: `${tierColor}18`, border: `1px solid ${tierColor}38` }}
          >
            {tier}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Lightning size={11} />
            XP Score
          </div>
        </div>
        <p className="mt-3 font-display text-[2.4rem] font-bold italic leading-none text-white">
          {score.toLocaleString()}
          <span className="ml-2 text-[1rem] font-normal text-white/30">pts</span>
        </p>
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: tierColor, boxShadow: `0 0 8px ${tierColor}55`, transition: "width 1s ease-out" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-[10px] text-white/30">{tier}</span>
            <span className="text-[10px] text-white/30">{nextTierMap[tier] ?? "Max"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Post card ────────────────────────────────────────────────────────────── */

function PostCard({ post, user }: { post: UserPost; user: CommunityProfile }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
      <div className="flex items-start gap-3">
        <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 36, height: 36 }}>
          {user.avatarUrl ? (
            <Image src={withAvatarTransform(user.avatarUrl) ?? user.avatarUrl} alt={user.name} width={36} height={36} className="h-full w-full object-cover" />
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
              className={`flex items-center gap-1.5 text-[11px] transition ${liked ? "text-red-400" : "text-[var(--text-tertiary)] hover:text-red-400"}`}
            >
              <Heart size={14} weight={liked ? "fill" : "regular"} />
              {post.likes + (liked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] transition hover:text-[#4a9f63]">
              <ChatCircle size={14} />
              {post.comments}
            </button>
            <button className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] transition hover:text-[#4a9f63]">
              <ArrowsClockwise size={14} />
              {post.reposts}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Snippet card ─────────────────────────────────────────────────────────── */

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

/* ── Main page ────────────────────────────────────────────────────────────── */

type Tab = "posts" | "been-there" | "snippets" | "following";

const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "been-there", label: "Been There" },
  { id: "snippets", label: "Snippets" },
  { id: "following", label: "Following" },
];

// Returns true if the ID looks like a real Clerk user ID (starts with "user_")
function isClerkId(id: string): boolean {
  return id.startsWith("user_");
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [tab, setTab] = useState<Tab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const userId = typeof params.id === "string" ? params.id : "ama-k";

  // Redirect Clerk user IDs to /go/[username] if the user has a username
  useEffect(() => {
    if (!userId || !userId.startsWith("user_")) return;
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((u: { username?: string }) => {
        if (u.username) router.replace(`/go/${u.username}`);
      })
      .catch(() => null);
  }, [userId, router]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const isRealUser = isClerkId(userId);
  const isOwnProfile = currentUser?.id === userId;

  // Fetch real follow status from Supabase for real Clerk users
  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/follow/status?targetId=${userId}`);
      if (!res.ok) return { following: false, followedBy: false, mutual: false };
      return res.json() as Promise<{ following: boolean; followedBy: boolean; mutual: boolean }>;
    },
    enabled: isRealUser && !isOwnProfile,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (followStatus) setIsFollowing(followStatus.following);
  }, [followStatus]);

  const handleFollow = useCallback(async () => {
    if (!isRealUser || followLoading) return;
    setFollowLoading(true);
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      await fetch("/api/follow", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: userId }),
      });
    } catch {
      setIsFollowing(!next); // revert on error
    } finally {
      setFollowLoading(false);
    }
  }, [isRealUser, followLoading, isFollowing, userId]);

  const handleMessage = useCallback(() => {
    if (isRealUser) {
      router.push(`/dashboard/messages?dm=${userId}`);
    } else {
      router.push("/dashboard/messages");
    }
  }, [isRealUser, router, userId]);

  const { data: user } = useQuery({
    queryKey: ["community-profile", userId],
    queryFn: () => getCommunityProfileById(userId) ?? getCommunityProfileById("ama-k")!,
    staleTime: Infinity,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: () => getUserPosts(userId),
    staleTime: Infinity,
    enabled: !!userId,
  });

  const { data: snippets = [] } = useQuery({
    queryKey: ["user-snippets", userId],
    queryFn: () => getUserSnippets(userId),
    staleTime: Infinity,
    enabled: !!userId,
  });

  const { data: pastEvents = [] } = useQuery({
    queryKey: ["user-past-events", userId],
    queryFn: () => getCommunityPastEvents(userId),
    staleTime: Infinity,
    enabled: !!userId,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["user-followers", userId],
    queryFn: () => getUserFollowers(userId),
    staleTime: Infinity,
    enabled: !!userId,
  });

  if (!user) return null;

  const tierColor = TIER_COLOR[user.pulseTier] ?? "#4a9f63";

  const profileStats: StatItem[] = [
    { icon: Ticket,    value: user.eventsAttended, label: "Events",    onClick: () => setTab("been-there") },
    { icon: Users,     value: user.followerCount,  label: "Followers", onClick: () => setFollowersOpen(true) },
    { icon: UserCheck, value: user.followingCount, label: "Following", onClick: () => setFollowingOpen(true) },
    { icon: Lightning, value: user.pulseScore,     label: "XP",        onClick: () => setTab("snippets") },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">

      {/* ── Cover header ────────────────────────────────────────────────── */}
      <div className="relative h-[200px] w-full overflow-hidden md:h-[240px]">
        {user.coverUrl ? (
          <Image src={user.coverUrl} alt="Cover" fill className="object-cover object-center" priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.08)_40%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.18),transparent_50%)]" />

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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_272px] md:gap-6 md:px-6 lg:grid-cols-[1fr_288px] lg:gap-8 lg:px-8">
        <div className="min-w-0">

          {/* Avatar — overlaps cover only */}
          <div className="-mt-11 pb-3 md:-mt-12">
            <div className="relative shrink-0 inline-block">
              <div
                className="overflow-hidden rounded-full"
                style={{
                  width: 84, height: 84,
                  boxShadow: `0 0 0 3px var(--bg-base), 0 0 0 5px ${tierColor}55`,
                }}
              >
                {user.avatarUrl ? (
                  <Image src={withAvatarTransform(user.avatarUrl) ?? user.avatarUrl} alt={user.name} width={84} height={84} className="h-full w-full object-cover" />
                ) : (
                  <Avatar size={84} name={user.name} variant="beam" colors={AVATAR_COLORS} />
                )}
              </div>
              <span className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-base)] ${user.isOnline ? "bg-[#4a9f63]" : "bg-[#555]"}`} />
            </div>
          </div>

          {/* Identity + CTAs — fully in content area */}
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0 flex-1">
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
                    <MapPin size={11} />{user.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <CalendarBlank size={11} />Joined {user.joinedAt}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.topCategories.map((cat) => (
                  <span key={cat} className="rounded-full border border-[#4a9f63]/30 bg-[#4a9f63]/10 px-3 py-1 text-[10px] font-medium text-[#4a9f63]">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            {!isOwnProfile && (
              <div className="mt-0.5 flex shrink-0 items-center gap-2">
                {/* Show message button when mutual follow or for any real user */}
                {(isRealUser || followStatus?.mutual) && (
                  <button
                    onClick={handleMessage}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95"
                    title="Send a message"
                  >
                    <ChatCircleDots size={16} />
                  </button>
                )}
                <button
                  onClick={isRealUser ? handleFollow : () => setIsFollowing((v) => !v)}
                  disabled={followLoading}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold shadow-sm transition active:scale-95 disabled:opacity-60 ${
                    isFollowing
                      ? "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                      : "bg-[#4a9f63] text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)]"
                  }`}
                >
                  {isFollowing ? <><UserMinus size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                </button>
              </div>
            )}
          </div>

          {/* ── Slim stats row ──────────────────────────────────────────── */}
          <ProfileStats stats={profileStats} />

          {/* Pulse card */}
          <div className="py-4">
            <PulseCard score={user.pulseScore} tier={user.pulseTier} tierColor={tierColor} />
          </div>

          {/* ── Tab bar ────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-20 -mx-4 bg-[var(--bg-base)] pt-1 md:mx-0">
            <div className="no-scrollbar flex overflow-x-auto border-b border-[var(--border-subtle)] px-4 md:px-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    tab === t.id ? "text-[#4a9f63]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {t.label}
                  {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#4a9f63]" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ────────────────────────────────────────────── */}
          <div className="pb-12 pt-4">

            {tab === "posts" && (
              <div className="space-y-3">
                {posts.length > 0 ? (
                  posts.map((p) => <PostCard key={p.id} post={p} user={user} />)
                ) : (
                  <div className="flex flex-col items-center py-16 text-center">
                    <PencilLine size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No posts yet</p>
                  </div>
                )}
              </div>
            )}

            {tab === "been-there" && (
              pastEvents.length === 0 ? (
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
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.72)_100%)]" />
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
              )
            )}

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

            {tab === "following" && (
              <div className="space-y-2">
                {MOCK_FOLLOWING.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => router.push(
                      person.type === "organizer"
                        ? `/organizers/${person.id}`
                        : `/dashboard/user/${person.id}`
                    )}
                    className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--border-card)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--card-shadow)] transition hover:border-[#4a9f63]/30 active:scale-[0.99]"
                  >
                    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 36, height: 36 }}>
                      <Avatar size={36} name={person.name} variant="beam" colors={AVATAR_COLORS} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ SIDEBAR ═══════════════════════════════════════════════════ */}
        <aside className="hidden md:block">
          <div className="sticky top-6 mt-4 space-y-4">

            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Followers</p>
              <div className="space-y-2.5">
                {followers.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => router.push(`/dashboard/user/${f.id}`)}
                    className="flex w-full items-center gap-2.5 transition hover:opacity-80"
                  >
                    <div className="relative shrink-0">
                      <div className="overflow-hidden rounded-full" style={{ width: 32, height: 32 }}>
                        {f.avatarUrl ? (
                          <Image src={withAvatarTransform(f.avatarUrl) ?? f.avatarUrl} alt={f.name} width={32} height={32} className="h-full w-full object-cover" />
                        ) : (
                          <Avatar size={32} name={f.name} variant="beam" colors={AVATAR_COLORS} />
                        )}
                      </div>
                      {f.isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-card)] bg-[#4a9f63]" />}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{f.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{f.handle}</p>
                    </div>
                  </button>
                ))}
                {followers.length > 4 && (
                  <button
                    onClick={() => setFollowersOpen(true)}
                    className="flex w-full items-center justify-center gap-0.5 pt-1 text-[10px] font-semibold text-[#4a9f63] hover:underline"
                  >
                    See all {user.followerCount.toLocaleString()} <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Scene Profile</p>
              <div className="space-y-1.5">
                {[
                  { label: "Tier", value: user.pulseTier, color: tierColor },
                  { label: "Events", value: `${user.eventsAttended} attended`, color: undefined },
                  { label: "City", value: user.location, color: undefined },
                  { label: "Status", value: user.isOnline ? "Active" : "Offline", color: user.isOnline ? "#4a9f63" : undefined },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
                    <span className="text-[11px] font-semibold" style={{ color: color ?? "var(--text-primary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* ── Followers / Following sheets ─────────────────────────────────── */}
      <PeopleSheet
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        title={`Followers · ${user.followerCount.toLocaleString()}`}
        people={followers}
      />
      <PeopleSheet
        open={followingOpen}
        onClose={() => setFollowingOpen(false)}
        title={`Following · ${user.followingCount}`}
        people={MOCK_FOLLOWING.filter((f) => f.type === "person").map((f) => ({
          id: f.id,
          name: f.name,
          handle: f.tag,
          avatarUrl: null,
          pulseTier: "tierBadge" in f ? (f.tierBadge ?? "Explorer") : "Explorer",
        }))}
      />
    </main>
  );
}
