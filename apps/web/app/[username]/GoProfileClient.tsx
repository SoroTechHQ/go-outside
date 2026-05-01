"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Avatar from "boring-avatars";
import Link from "next/link";
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
  Play,
  Heart,
  TwitterLogo,
  Quotes,
} from "@phosphor-icons/react";
import { avatarUrl as withAvatarTransform, coverUrl as withCoverTransform, thumbnailUrl } from "../../lib/image-url";
import { getPulseProgress, getNextTier, type PulseTier } from "../dashboard/profile/types";
import { PostFeed } from "../../components/posts/PostFeed";
import { useFollowMutation, useFollowStatus } from "../../hooks/useFollow";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

const TIER_COLOR: Record<string, string> = {
  Newcomer:      "#888888",
  Explorer:      "#4a9f63",
  Regular:       "#4a9f63",
  "Scene Kid":   "#4a9f63",
  "City Native": "#c87c2a",
  Legend:        "#DAA520",
};

type Tab = "posts" | "snippets" | "been-there" | "media" | "about";

type MediaItem = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  media_type: "image" | "video";
  caption: string | null;
  likes_count: number;
  views_count: number;
  created_at: string;
  events: { id: string; title: string; slug: string } | null;
};

type Snippet = {
  id: string;
  body: string;
  vibe_tags: string[] | null;
  created_at: string;
  user_id: string;
};

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
  twitterHandle?: string | null;
  isVerifiedOrganizer?: boolean;
};

// ── Tier progress bar ──────────────────────────────────────────────────────────
function TierProgress({ score, tier }: { score: number; tier: string }) {
  const tierColor = TIER_COLOR[tier] ?? "#4a9f63";
  const nextTier  = getNextTier(tier as PulseTier);
  const progress  = getPulseProgress(score, tier as PulseTier);

  if (!nextTier) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
          Progress to {nextTier.name}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {(nextTier.min - score).toLocaleString()} pts to go
        </span>
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
  onFollowersClick,
  onFollowingClick,
}: {
  pulseScore: number;
  events: number;
  followers: number;
  following: number;
  tierColor: string;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}) {
  return (
    <div className="grid grid-cols-4 divide-x divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] mt-4">
      <div className="flex flex-col items-center gap-0.5 py-3">
        <Lightning size={13} style={{ color: tierColor }} />
        <span className="text-[0.95rem] font-bold leading-none text-[var(--text-primary)]">
          {pulseScore.toLocaleString()}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">Pulse</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 py-3">
        <Ticket size={13} className="text-[var(--text-tertiary)]" />
        <span className="text-[0.95rem] font-bold leading-none text-[var(--text-primary)]">{events}</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">Events</span>
      </div>
      <button
        onClick={onFollowersClick}
        className="flex flex-col items-center gap-0.5 py-3 transition hover:bg-[var(--bg-muted)] active:scale-95"
      >
        <Users size={13} className="text-[var(--text-tertiary)]" />
        <span className="text-[0.95rem] font-bold leading-none text-[var(--text-primary)]">{followers}</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">Followers</span>
      </button>
      <button
        onClick={onFollowingClick}
        className="flex flex-col items-center gap-0.5 py-3 transition hover:bg-[var(--bg-muted)] active:scale-95"
      >
        <UsersFour size={13} className="text-[var(--text-tertiary)]" />
        <span className="text-[0.95rem] font-bold leading-none text-[var(--text-primary)]">{following}</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">Following</span>
      </button>
    </div>
  );
}

// ── Followers/Following sheet ──────────────────────────────────────────────────
function PeopleSheet({
  open,
  onClose,
  clerkId,
  type,
}: {
  open: boolean;
  onClose: () => void;
  clerkId: string;
  type: "followers" | "following";
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-people", clerkId, type],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/followers?type=${type}`);
      if (!res.ok) return { users: [] };
      return res.json() as Promise<{
        users: {
          id: string;
          clerk_id: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          pulse_tier: string | null;
        }[];
      }>;
    },
    enabled: open,
    staleTime: 60_000,
  });

  const users = data?.users ?? [];

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[75dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out md:bottom-auto md:left-1/2 md:top-1/2 md:w-[480px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[24px] md:border md:border-[var(--border-card)] ${
          open ? "translate-y-0 md:scale-100 md:opacity-100" : "translate-y-full md:scale-[0.96] md:opacity-0"
        }`}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" />
        <div className="shrink-0 border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="font-display text-[17px] font-bold italic text-[var(--text-primary)] capitalize">
            {type}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading && (
            <div className="space-y-1 px-4 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--bg-muted)]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--bg-muted)]" />
                    <div className="h-2.5 w-20 animate-pulse rounded-full bg-[var(--bg-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && users.length === 0 && (
            <p className="py-12 text-center text-[12px] text-[var(--text-tertiary)]">
              No {type} yet.
            </p>
          )}
          {!isLoading &&
            users.map((u) => {
              const displayName =
                `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
                u.username ||
                "User";
              return (
                <Link
                  key={u.id}
                  href={u.username ? `/${u.username}` : "#"}
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-[var(--bg-card)]"
                >
                  <div
                    className="shrink-0 overflow-hidden rounded-full"
                    style={{ width: 40, height: 40 }}
                  >
                    {u.avatar_url ? (
                      <Image
                        src={u.avatar_url}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Avatar
                        size={40}
                        name={displayName}
                        variant="beam"
                        colors={AVATAR_COLORS}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                      {displayName}
                    </p>
                    {u.username && (
                      <p className="truncate text-[11px] text-[var(--text-tertiary)]">
                        @{u.username}
                      </p>
                    )}
                  </div>
                  {u.pulse_tier && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold"
                      style={{
                        color: TIER_COLOR[u.pulse_tier] ?? "#888",
                        backgroundColor: `${TIER_COLOR[u.pulse_tier] ?? "#888"}18`,
                        border: `1px solid ${TIER_COLOR[u.pulse_tier] ?? "#888"}30`,
                      }}
                    >
                      {u.pulse_tier}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>
      </div>
    </>
  );
}

// ── Snippets tab ───────────────────────────────────────────────────────────────
function SnippetsTab({ clerkId }: { clerkId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-snippets", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/snippets`);
      if (!res.ok) return { snippets: [] };
      return res.json() as Promise<{ snippets: Snippet[] }>;
    },
    staleTime: 3 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-[var(--bg-muted)] h-24" />
        ))}
      </div>
    );
  }

  const snippets = data?.snippets ?? [];

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <Quotes size={28} className="text-[var(--text-tertiary)]" weight="light" />
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">No snippets yet</p>
        <p className="text-[12px] text-[var(--text-tertiary)]">Vibes, takes, and moments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {snippets.map((s) => (
        <div
          key={s.id}
          className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]"
        >
          <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">{s.body}</p>
          {s.vibe_tags && s.vibe_tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {s.vibe_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#4a9f63]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#4a9f63]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-[var(--text-tertiary)]">
            {new Date(s.created_at).toLocaleDateString("en-GH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
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
      return res.json() as Promise<{
        events: {
          id: string;
          title: string;
          slug: string;
          banner_url: string | null;
          start_datetime: string | null;
        }[];
      }>;
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
        <a
          key={e.id}
          href={`/events/${e.slug}`}
          className="group relative overflow-hidden rounded-2xl bg-[var(--bg-muted)] aspect-[4/3]"
        >
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
            <p className="text-[12px] font-semibold leading-tight text-white line-clamp-2">
              {e.title}
            </p>
            {e.start_datetime && (
              <p className="mt-0.5 text-[10px] text-white/60">
                {new Date(e.start_datetime).toLocaleDateString("en-GH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Media tab ─────────────────────────────────────────────────────────────────
function MediaTab({ clerkId }: { clerkId: string }) {
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user-media", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/media`);
      if (!res.ok) return { media: [] };
      return res.json() as Promise<{ media: MediaItem[] }>;
    },
    staleTime: 3 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 mt-1">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-[var(--bg-muted)]" />
        ))}
      </div>
    );
  }

  const media = data?.media ?? [];

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">No media yet</p>
        <p className="text-[12px] text-[var(--text-tertiary)]">Photos and videos from events will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 mt-1">
        {media.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="group relative aspect-square overflow-hidden bg-[var(--bg-muted)]"
          >
            <Image
              src={item.thumbnail_url ?? item.url}
              alt={item.caption ?? "Media"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            {item.media_type === "video" && (
              <div className="absolute right-1.5 top-1.5">
                <Play size={14} weight="fill" className="text-white drop-shadow" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1 text-[12px] font-bold text-white">
                <Heart size={13} weight="fill" /> {item.likes_count}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[90dvh] max-w-[90vw] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.media_type === "image" ? (
              <Image
                src={selected.url}
                alt={selected.caption ?? ""}
                width={800}
                height={800}
                className="max-h-[80dvh] w-auto object-contain"
              />
            ) : (
              <video src={selected.url} controls autoPlay className="max-h-[80dvh] w-auto" />
            )}
            {(selected.caption || selected.events) && (
              <div className="bg-[var(--bg-card)] p-3">
                {selected.caption && (
                  <p className="text-[13px] text-[var(--text-secondary)]">{selected.caption}</p>
                )}
                {selected.events && (
                  <a
                    href={`/events/${selected.events.slug}`}
                    className="mt-1 block text-[11px] text-[#4a9f63] hover:underline"
                  >
                    @ {selected.events.title}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── About tab ──────────────────────────────────────────────────────────────────
function AboutTab({
  bio,
  city,
  joinedAt,
  interests,
  twitterHandle,
}: {
  bio: string | null;
  city: string | null;
  joinedAt: string | null;
  interests: string[];
  twitterHandle?: string | null;
}) {
  const joinedYear = joinedAt ? new Date(joinedAt).getFullYear() : null;

  return (
    <div className="space-y-5 pt-2">
      {bio && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Bio
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{bio}</p>
        </div>
      )}

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
        {twitterHandle && (
          <a
            href={`https://twitter.com/${twitterHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[#4a9f63]"
          >
            <TwitterLogo size={14} />
            @{twitterHandle.replace("@", "")}
          </a>
        )}
      </div>

      {interests.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Interests
          </p>
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
  twitterHandle,
  isVerifiedOrganizer = false,
}: Props) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const isOwnProfile = currentUser?.id === clerkId;
  const tierColor = TIER_COLOR[pulseTier] ?? "#4a9f63";
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [peopleSheet, setPeopleSheet] = useState<"followers" | "following" | null>(null);

  const resolvedAvatar = withAvatarTransform(avatarUrl);
  const resolvedCover  = withCoverTransform(coverUrl);

  const { data: followStatus } = useFollowStatus(clerkId, !!currentUser && !isOwnProfile);
  const followMutation = useFollowMutation(clerkId);

  const { data: profileStats } = useQuery({
    queryKey: ["profile-stats", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/stats`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        events_attended: number;
        followers_count: number;
        following_count: number;
      }>;
    },
    staleTime: 5 * 60_000,
  });

  const resolvedEvents    = profileStats?.events_attended  ?? 0;
  const resolvedFollowers = profileStats?.followers_count  ?? 0;
  const resolvedFollowing = profileStats?.following_count  ?? 0;

  const isFollowing = followStatus?.following ?? false;
  const isFriend    = followStatus?.mutual    ?? false;

  const handleFollow = useCallback(() => {
    followMutation.mutate(!isFollowing);
  }, [followMutation, isFollowing]);

  async function handleShare() {
    const url = `https://gooutside.club/${username}`;
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
    { id: "snippets",   label: "Snippets" },
    { id: "been-there", label: "Been There" },
    { id: "media",      label: "Media" },
    { id: "about",      label: "About" },
  ];

  // Follow button state
  let followLabel: React.ReactNode;
  let followClass: string;
  if (isFollowing && isFriend) {
    followLabel = <><Check size={13} weight="bold" className="text-[#4a9f63]" /> Friends</>;
    followClass = "border border-[#4a9f63]/40 bg-[var(--bg-card)] text-[#4a9f63]";
  } else if (isFollowing) {
    followLabel = <><UserMinus size={13} /> Following</>;
    followClass = "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]";
  } else {
    followLabel = <><UserPlus size={13} /> Follow</>;
    followClass = "bg-[#4a9f63] text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)]";
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      {/* Cover */}
      <div className="relative h-[220px] w-full overflow-hidden md:h-[260px]">
        {resolvedCover ? (
          <Image
            src={resolvedCover}
            alt="Profile cover"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.05)_40%,rgba(0,0,0,0.6)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.18),transparent_50%)]" />

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
        <div className="-mt-12 flex items-end justify-between pb-4">
          <div
            className="overflow-hidden rounded-full"
            style={{
              width: 88,
              height: 88,
              boxShadow: `0 0 0 3px var(--bg-base), 0 0 0 5px ${tierColor}55`,
            }}
          >
            {resolvedAvatar ? (
              <Image
                src={resolvedAvatar}
                alt={name}
                width={88}
                height={88}
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              <Avatar size={88} name={name} variant="beam" colors={AVATAR_COLORS} />
            )}
          </div>

          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95"
              title="Share profile"
            >
              {copied ? (
                <Check size={15} weight="bold" className="text-[#4a9f63]" />
              ) : (
                <Share size={15} />
              )}
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
                  disabled={followMutation.isPending}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold shadow-sm transition active:scale-95 disabled:opacity-60 ${followClass}`}
                >
                  {followLabel}
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
            {isVerifiedOrganizer && (
              <CheckCircle size={18} weight="fill" className="text-[#4a9f63]" />
            )}
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
          onFollowersClick={() => setPeopleSheet("followers")}
          onFollowingClick={() => setPeopleSheet("following")}
        />

        {/* Tier progress */}
        <TierProgress score={pulseScore} tier={pulseTier} />

        {/* Tabs */}
        <div className="mt-6 flex gap-0 border-b border-[var(--border-subtle)]">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 pb-3 text-[11px] font-semibold transition-colors ${
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
          {activeTab === "snippets"   && <SnippetsTab clerkId={clerkId} />}
          {activeTab === "been-there" && <BeenThereTab clerkId={clerkId} />}
          {activeTab === "media"      && <MediaTab clerkId={clerkId} />}
          {activeTab === "about"      && (
            <AboutTab
              bio={bio}
              city={city}
              joinedAt={joinedAt}
              interests={interests}
              twitterHandle={twitterHandle}
            />
          )}
        </div>
      </div>

      {peopleSheet && (
        <PeopleSheet
          open={!!peopleSheet}
          onClose={() => setPeopleSheet(null)}
          clerkId={clerkId}
          type={peopleSheet}
        />
      )}
    </main>
  );
}
