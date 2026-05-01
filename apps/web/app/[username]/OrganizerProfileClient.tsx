"use client";

import { useState, useCallback, Fragment } from "react";
import Image from "next/image";
import Avatar from "boring-avatars";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShieldCheck,
  Ticket,
  Users,
  Star,
  ShareNetwork,
  Heart,
  CalendarBlank,
  MapPin,
  Globe,
  TwitterLogo,
  ArrowRight,
  Share,
  Check,
} from "@phosphor-icons/react";
import { avatarUrl as withAvatarTransform, coverUrl as withCoverTransform, thumbnailUrl } from "../../lib/image-url";
import { useFollowMutation, useFollowStatus } from "../../hooks/useFollow";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

type OrganizerProfile = {
  organization_name?: string | null;
  bio?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  status?: string | null;
  total_events?: number | null;
  social_links?: Record<string, string> | null;
} | null;

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
  organizerProfile: OrganizerProfile;
};

type OrgEvent = {
  id: string;
  title: string;
  slug: string;
  slug_v2?: string | null;
  banner_url: string | null;
  start_datetime: string | null;
  tickets_sold?: number | null;
  total_capacity?: number | null;
  price_label?: string | null;
};

type Tab = "upcoming" | "past" | "about";

function StatItem({
  icon: Icon,
  value,
  label,
  onClick,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex flex-1 flex-col items-center gap-0.5 py-4 transition hover:bg-[var(--bg-card)] active:scale-[0.97] disabled:cursor-default"
    >
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-[var(--text-tertiary)]" />
        <span className="text-[1.05rem] font-bold leading-none tracking-tight text-[var(--text-primary)]">
          {typeof value === "number" && value >= 1000
            ? `${(value / 1000).toFixed(1)}K`
            : value}
        </span>
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {label}
      </span>
    </button>
  );
}

function EventCard({ event }: { event: OrgEvent }) {
  const slug = event.slug_v2 ?? event.slug;
  return (
    <a
      href={`/events/${slug}`}
      className="group relative overflow-hidden rounded-[18px] bg-[var(--bg-muted)] aspect-[0.85]"
    >
      {event.banner_url && (
        <Image
          src={thumbnailUrl(event.banner_url) ?? event.banner_url}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-[11px] font-semibold leading-tight text-white line-clamp-2">{event.title}</p>
        {event.start_datetime && (
          <p className="mt-0.5 text-[9px] text-white/50">
            {new Date(event.start_datetime).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
          </p>
        )}
        {event.price_label && (
          <span className="mt-1 inline-block rounded-full bg-[#4a9f63] px-2 py-0.5 text-[9px] font-bold text-white">
            {event.price_label}
          </span>
        )}
      </div>
    </a>
  );
}

export default function OrganizerProfileClient({
  clerkId,
  username,
  name,
  avatarUrl,
  coverUrl,
  bio,
  city,
  joinedAt,
  twitterHandle,
  isVerifiedOrganizer = false,
  organizerProfile,
}: Props) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const isOwnProfile = currentUser?.id === clerkId;

  const [tab, setTab] = useState<Tab>("upcoming");
  const [copied, setCopied] = useState(false);

  const resolvedAvatar = withAvatarTransform(avatarUrl);
  const resolvedCover  = withCoverTransform(coverUrl);

  const orgName = organizerProfile?.organization_name ?? name;
  const orgBio  = organizerProfile?.bio ?? bio;
  const logoUrl = organizerProfile?.logo_url;
  const isVerified = isVerifiedOrganizer || organizerProfile?.status === "approved";
  const totalEvents = organizerProfile?.total_events ?? 0;

  const { data: followStatus } = useFollowStatus(clerkId, !!currentUser && !isOwnProfile);
  const followMutation = useFollowMutation(clerkId);
  const isFollowing = followStatus?.following ?? false;

  const handleFollow = useCallback(() => {
    followMutation.mutate(!isFollowing);
  }, [followMutation, isFollowing]);

  const { data: profileStats } = useQuery({
    queryKey: ["profile-stats", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/stats`);
      if (!res.ok) return null;
      return res.json() as Promise<{ events_attended: number; followers_count: number; following_count: number }>;
    },
    staleTime: 5 * 60_000,
  });

  const resolvedFollowers = profileStats?.followers_count ?? 0;

  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ["organizer-events", clerkId, "upcoming"],
    queryFn: async () => {
      const res = await fetch(`/api/organizer/${clerkId}/events?filter=upcoming`);
      if (!res.ok) return { events: [] };
      return res.json() as Promise<{ events: OrgEvent[] }>;
    },
    staleTime: 5 * 60_000,
  });

  const { data: pastData, isLoading: pastLoading } = useQuery({
    queryKey: ["organizer-events", clerkId, "past"],
    queryFn: async () => {
      const res = await fetch(`/api/organizer/${clerkId}/events?filter=past`);
      if (!res.ok) return { events: [] };
      return res.json() as Promise<{ events: OrgEvent[] }>;
    },
    staleTime: 5 * 60_000,
    enabled: tab === "past",
  });

  const upcomingEvents = upcomingData?.events ?? [];
  const pastEvents     = pastData?.events ?? [];

  async function handleShare() {
    const url = `https://gooutside.club/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${orgName} on GoOutside`, url });
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
    { id: "upcoming", label: "Upcoming" },
    { id: "past",     label: "Past" },
    { id: "about",    label: "About" },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      {/* Cover */}
      <div className="relative h-[240px] w-full overflow-hidden md:h-[280px]">
        {resolvedCover ? (
          <Image src={resolvedCover} alt="Cover" fill className="object-cover object-center" priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.05)_38%,rgba(0,0,0,0.65)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(74,159,99,0.15),transparent_45%)]" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft size={17} weight="bold" />
          </button>
          {isVerified && (
            <span className="flex items-center gap-1.5 rounded-full border border-[#4a9f63]/40 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4a9f63] backdrop-blur-sm">
              <ShieldCheck size={11} weight="fill" />
              Verified
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:grid md:grid-cols-[1fr_272px] md:gap-6 md:px-6">
        <div className="min-w-0">
          {/* Logo / Avatar */}
          <div className="-mt-12 pb-3">
            <div
              className="relative overflow-hidden rounded-[20px] border-4 border-[var(--bg-base)] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              style={{ width: 84, height: 84 }}
            >
              {logoUrl ? (
                <Image src={logoUrl} alt={orgName} width={84} height={84} className="h-full w-full object-cover" />
              ) : resolvedAvatar ? (
                <Image src={resolvedAvatar} alt={orgName} width={84} height={84} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0e2212] to-[#152a1a] text-xl font-black tracking-tight text-[#4a9f63]">
                  {orgName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--bg-base)] bg-[#4a9f63]">
                  <ShieldCheck size={12} weight="fill" className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Identity + CTAs */}
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)] md:text-[26px]">
                {orgName}
              </h1>
              <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">@{username}</p>
              {orgBio && (
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)] line-clamp-3">{orgBio}</p>
              )}
              {city && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <MapPin size={11} weight="fill" />{city}
                </p>
              )}
            </div>

            <div className="mt-0.5 flex shrink-0 items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-95"
              >
                {copied ? <Check size={15} weight="bold" className="text-[#4a9f63]" /> : <Share size={15} />}
              </button>
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold shadow-sm transition active:scale-95 disabled:opacity-60 ${
                    isFollowing
                      ? "border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                      : "border-[#4a9f63]/40 bg-[var(--bg-card)] text-[#4a9f63]"
                  }`}
                >
                  <Heart size={13} weight={isFollowing ? "fill" : "regular"} />
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => router.push("/organizer")}
                  className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[12px] font-bold text-[var(--text-secondary)] shadow-sm transition hover:border-[#4a9f63]/40 active:scale-95"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-stretch border-y border-[var(--border-subtle)]">
            {([
              { icon: Ticket,  value: totalEvents,       label: "Events" },
              { icon: Users,   value: resolvedFollowers, label: "Followers" },
            ] as const).map((stat, i, arr) => (
              <Fragment key={stat.label}>
                <StatItem {...stat} />
                {i < arr.length - 1 && <div className="self-center h-7 w-px bg-[var(--border-subtle)]" />}
              </Fragment>
            ))}
          </div>

          {/* Tab bar */}
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
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#4a9f63]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="pb-12 pt-4">
            {tab === "upcoming" && (
              <div className="space-y-4">
                {upcomingLoading && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-[0.85] animate-pulse rounded-[18px] bg-[var(--bg-muted)]" />
                    ))}
                  </div>
                )}
                {!upcomingLoading && upcomingEvents.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Ticket size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No upcoming events</p>
                  </div>
                )}
                {!upcomingLoading && upcomingEvents.length > 0 && (
                  <>
                    {upcomingEvents[0] && (
                      <div>
                        <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Featured</p>
                        <a
                          href={`/events/${upcomingEvents[0].slug_v2 ?? upcomingEvents[0].slug}`}
                          className="group relative block w-full overflow-hidden rounded-[20px]"
                        >
                          <div className="relative aspect-[2.4/1] overflow-hidden">
                            {upcomingEvents[0].banner_url ? (
                              <Image src={upcomingEvents[0].banner_url} alt={upcomingEvents[0].title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-[#0e2212] to-[#152a1a]" />
                            )}
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.72)_100%)]" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <p className="text-[1.1rem] font-bold leading-tight text-white">{upcomingEvents[0].title}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                {upcomingEvents[0].start_datetime && (
                                  <span className="text-[11px] text-white/60">
                                    {new Date(upcomingEvents[0].start_datetime).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5 rounded-full bg-[#4a9f63] px-3 py-1.5 text-[11px] font-bold text-white">
                                  Get Tickets <ArrowRight size={11} />
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    )}
                    {upcomingEvents.length > 1 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {upcomingEvents.slice(1).map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === "past" && (
              <div>
                {pastLoading && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-[0.85] animate-pulse rounded-[18px] bg-[var(--bg-muted)]" />
                    ))}
                  </div>
                )}
                {!pastLoading && pastEvents.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <CalendarBlank size={28} className="text-[var(--text-tertiary)]" />
                    <p className="mt-3 text-[13px] text-[var(--text-secondary)]">No past events</p>
                  </div>
                )}
                {!pastLoading && pastEvents.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {pastEvents.map((event) => (
                      <div key={event.id} className="opacity-75 transition-opacity hover:opacity-100">
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-4">
                {orgBio && (
                  <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
                    <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">About</p>
                    <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{orgBio}</p>
                  </div>
                )}
                <div className="overflow-hidden rounded-[18px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Info</p>
                  <div className="space-y-2.5">
                    {city && (
                      <p className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                        <MapPin size={14} className="shrink-0 text-[var(--text-tertiary)]" weight="fill" />
                        {city}
                      </p>
                    )}
                    {joinedAt && (
                      <p className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                        <CalendarBlank size={14} className="shrink-0 text-[var(--text-tertiary)]" weight="fill" />
                        Active since {new Date(joinedAt).getFullYear()}
                      </p>
                    )}
                    {organizerProfile?.website_url && (
                      <a
                        href={organizerProfile.website_url.startsWith("http") ? organizerProfile.website_url : `https://${organizerProfile.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[13px] text-[#4a9f63] hover:underline"
                      >
                        <Globe size={14} />
                        {organizerProfile.website_url.replace(/^https?:\/\//, "")}
                      </a>
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-6 mt-4 space-y-4">
            <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">At a Glance</p>
              <div className="space-y-2">
                {city && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-tertiary)]">Based in</span>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">{city}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">Events hosted</span>
                  <span className="text-[11px] font-semibold text-[#4a9f63]">{totalEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">Followers</span>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)]">{resolvedFollowers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">Verified</span>
                  <span className="text-[11px] font-semibold" style={{ color: isVerified ? "#4a9f63" : "var(--text-tertiary)" }}>
                    {isVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="overflow-hidden rounded-[20px] border border-[#4a9f63]/25 bg-gradient-to-br from-[#4a9f63]/10 to-[#4a9f63]/4 p-4">
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">Stay in the loop</p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  Follow {orgName} to get notified when new events drop.
                </p>
                <button
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className="mt-3 w-full rounded-[12px] bg-[#4a9f63] py-2.5 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(74,159,99,0.3)] transition hover:bg-[#3a8f53] active:scale-[0.98] disabled:opacity-60"
                >
                  {isFollowing ? "Following" : `Follow ${orgName}`}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
