"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Avatar from "boring-avatars";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  ChatCircleDots,
  Share,
  MapPin,
  CalendarBlank,
  Lightning,
  CheckCircle,
  Check,
  Ticket,
  Users,
  UsersFour,
} from "@phosphor-icons/react";
import { avatarUrl as withAvatarTransform, coverUrl as withCoverTransform, thumbnailUrl } from "../../../lib/image-url";
import { getPulseProgress, getNextTier, getTierInfo, type PulseTier } from "../../dashboard/profile/types";
import { PostFeed } from "../../../components/posts/PostFeed";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

const TIER_COLOR: Record<string, string> = {
  Newcomer:    "#888888",
  Explorer:    "#4a9f63",
  Regular:     "#4a9f63",
  "Scene Kid": "#4a9f63",
  "City Native": "#c87c2a",
  Legend:      "#DAA520",
};

type Tab = "posts" | "been-there" | "about";

type Props = {
  clerkId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  pulseScore: number;
  pulseTier: string;
  city: string | null;
  joinedAt: string | null;
  interests?: string[];
  eventsAttended?: number;
  followersCount?: number;
  followingCount?: number;
};

// ── Tier progress bar ──────────────────────────────────────────────────────────
function TierProgress({ score, tier }: { score: number; tier: string }) {
  const tierColor = TIER_COLOR[tier] ?? "#4a9f63";
  const tierInfo  = getTierInfo(tier as PulseTier);
  const nextTier  = getNextTier(tier as PulseTier);
  const progress  = getPulseProgress(score, tier as PulseTier);

  if (!nextTier) return null;

  const ptsDiff = nextTier.min - score;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
          Progress to {nextTier.name}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{ptsDiff.toLocaleString()} pts to go</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, backgroundColor: tierColor }}
        />
      </div>
    </div>
  );
}

// ── Stats row ──────────────────────────────────────────────────────────────────
function StatsRow({
  pulseScore,
  events,
  followers,
  following,
  tierColor,
}: {
  pulseScore: number;
  events: number;
  followers: number;
  following: number;
  tierColor: string;
}) {
  return (
    <div className="grid grid-cols-4 divide-x divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] mt-4">
      {[
        { label: "Pulse", value: pulseScore.toLocaleString(), icon: Lightning, color: tierColor },
        { label: "Events", value: events, icon: Ticket, color: "var(--text-tertiary)" },
        { label: "Followers", value: followers, icon: Users, color: "var(--text-tertiary)" },
        { label: "Following", value: following, icon: UsersFour, color: "var(--text-tertiary)" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex flex-col items-center gap-0.5 py-3">
          <Icon size={13} style={{ color }} />
          <span className="text-[0.95rem] font-bold leading-none text-[var(--text-primary)]">{value}</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">{label}</span>
        </div>
      ))}
    </div>
  );
}


// ── Been There tab ─────────────────────────────────────────────────────────────
function BeenThereTab({ clerkId }: { clerkId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-events", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/events`);
      if (!res.ok) return { events: [] };
      return res.json() as Promise<{ events: { id: string; title: string; slug: string; banner_url: string | null; start_datetime: string | null }[] }>;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 pt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-[var(--bg-muted)] aspect-[4/3]" />
        ))}
      </div>
    );
  }

  const events = data?.events ?? [];
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <Ticket size={28} className="text-[var(--text-tertiary)]" weight="light" />
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">No events yet</p>
        <p className="text-[12px] text-[var(--text-tertiary)]">Events they attend will show up here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {events.map((e) => (
        <a key={e.id} href={`/events/${e.slug}`} className="group relative overflow-hidden rounded-2xl bg-[var(--bg-muted)] aspect-[4/3]">
          {e.banner_url && (
            <Image
              src={thumbnailUrl(e.banner_url) ?? e.banner_url}
              alt={e.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-[12px] font-semibold leading-tight text-white line-clamp-2">{e.title}</p>
            {e.start_datetime && (
              <p className="mt-0.5 text-[10px] text-white/60">
                {new Date(e.start_datetime).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// ── About tab ──────────────────────────────────────────────────────────────────
function AboutTab({
  bio,
  city,
  joinedAt,
  interests,
}: {
  bio: string | null;
  city: string | null;
  joinedAt: string | null;
  interests: string[];
}) {
  const joinedYear = joinedAt ? new Date(joinedAt).getFullYear() : null;

  return (
    <div className="space-y-5 pt-2">
      {bio && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Bio</p>
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{bio}</p>
        </div>
      )}

      {(city || joinedYear) && (
        <div className="space-y-2">
          {city && (
            <p className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <MapPin size={14} className="text-[var(--text-tertiary)]" weight="fill" />
              {city}
            </p>
          )}
          {joinedYear && (
            <p className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <CalendarBlank size={14} className="text-[var(--text-tertiary)]" weight="fill" />
              Joined {joinedYear}
            </p>
          )}
        </div>
      )}

      {interests.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Interests</p>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-1 text-[12px] text-[var(--text-secondary)]"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function GoProfileClient({
  clerkId,
  username,
  name,
  avatarUrl,
  coverUrl,
  bio,
  pulseScore,
  pulseTier,
  city,
  joinedAt,
  interests = [],
  eventsAttended = 0,
  followersCount = 0,
  followingCount = 0,
}: Props) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const isOwnProfile = currentUser?.id === clerkId;
  const tierColor = TIER_COLOR[pulseTier] ?? "#4a9f63";
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const resolvedAvatar = withAvatarTransform(avatarUrl);
  const resolvedCover  = withCoverTransform(coverUrl);

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/follow/status?targetId=${clerkId}`);
      if (!res.ok) return { following: false, mutual: false };
      return res.json() as Promise<{ following: boolean; mutual: boolean }>;
    },
    enabled: !!currentUser && !isOwnProfile,
    staleTime: 30_000,
  });

  const { data: profileStats } = useQuery({
    queryKey: ["profile-stats", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/stats`);
      if (!res.ok) return null;
      return res.json() as Promise<{ events_attended: number; followers_count: number; following_count: number }>;
    },
    staleTime: 5 * 60_000,
  });

  const resolvedEvents    = profileStats?.events_attended   ?? eventsAttended;
  const resolvedFollowers = profileStats?.followers_count   ?? followersCount;
  const resolvedFollowing = profileStats?.following_count   ?? followingCount;
  const resolvedFollowing2 = followStatus?.following ?? isFollowing;

  const handleFollow = useCallback(async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      await fetch("/api/follow", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetClerkId: clerkId }),
      });
    } catch {
      setIsFollowing(!next);
    } finally {
      setFollowLoading(false);
    }
  }, [clerkId, followLoading, isFollowing]);

  async function handleShare() {
    const url = `https://gooutside.club/go/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on GoOutside`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "posts",      label: "Posts" },
    { id: "been-there", label: "Been There" },
    { id: "about",      label: "About" },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      {/* Cover */}
      <div className="relative h-[220px] w-full overflow-hidden md:h-[260px]">
        {resolvedCover ? (
          <Image src={resolvedCover} alt="Profile cover" fill className="object-cover" priority sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.05)_40%,rgba(0,0,0,0.6)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.18),transparent_50%)]" />

        {/* Back + tier badge */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
          >
            <ArrowLeft size={17} weight="bold" />
          </button>
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm"
            style={{ backgroundColor: `${tierColor}22`, borderColor: `${tierColor}40` }}
          >
            {pulseTier}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {/* Avatar + action buttons row */}
        <div className="flex items-end justify-between -mt-12 pb-4">
          {/* Avatar */}
          <div
            className="overflow-hidden rounded-full"
            style={{
              width: 88, height: 88,
              boxShadow: `0 0 0 3px var(--bg-base), 0 0 0 5px ${tierColor}55`,
            }}
          >
            {resolvedAvatar ? (
              <Image src={resolvedAvatar} alt={name} width={88} height={88} className="h-full w-full object-cover" priority />
            ) : (
              <Avatar size={88} name={name} variant="beam" colors={AVATAR_COLORS} />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95"
              title="Share profile"
            >
              {copied ? <Check size={15} weight="bold" className="text-[#4a9f63]" /> : <Share size={15} />}
            </button>

            {!isOwnProfile && currentUser && (
              <>
                <button
                  onClick={() => router.push(`/dashboard/messages?dm=${clerkId}`)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95"
                  title="Send a message"
                >
                  <ChatCircleDots size={16} />
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold shadow-sm transition active:scale-95 disabled:opacity-60 ${
                    (followStatus?.following || isFollowing)
                      ? "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                      : "bg-[#4a9f63] text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)]"
                  }`}
                >
                  {(followStatus?.following || isFollowing)
                    ? <><UserMinus size={13} /> Following</>
                    : <><UserPlus size={13} /> Follow</>
                  }
                </button>
              </>
            )}

            {isOwnProfile && (
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[12px] font-bold text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 active:scale-95"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)]">
              {name}
            </h1>
            <CheckCircle size={18} weight="fill" className="text-[#4a9f63]" />
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">@{username}</p>
          {bio && (
            <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{bio}</p>
          )}
        </div>

        {/* Stats row */}
        <StatsRow
          pulseScore={pulseScore}
          events={resolvedEvents}
          followers={resolvedFollowers}
          following={resolvedFollowing}
          tierColor={tierColor}
        />

        {/* Tier progress */}
        <TierProgress score={pulseScore} tier={pulseTier} />

        {/* Tabs */}
        <div className="mt-6 flex gap-0 border-b border-[var(--border-subtle)]">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 pb-3 text-[13px] font-semibold transition-colors ${
                activeTab === id
                  ? "border-b-2 border-[#4a9f63] text-[var(--text-primary)] -mb-px"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-5">
          {activeTab === "posts" && (
            <PostFeed
              profileClerkId={clerkId}
              profileName={name}
              profileAvatarUrl={avatarUrl}
              isOwnProfile={isOwnProfile}
            />
          )}
          {activeTab === "been-there" && <BeenThereTab clerkId={clerkId} />}
          {activeTab === "about"      && (
            <AboutTab
              bio={bio}
              city={city}
              joinedAt={joinedAt}
              interests={interests}
            />
          )}
        </div>
      </div>
    </main>
  );
}
