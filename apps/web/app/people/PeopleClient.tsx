"use client";

import { useState, useCallback, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  MagnifyingGlass,
  Users,
  UserPlus,
  MapPin,
  Lightning,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
import type { SocialUser } from "../../lib/social/types";
import { NaviiAvatar } from "../../components/profile/NaviiAvatar";

type PeopleResponse = {
  users: SocialUser[];
  nextCursor: string | null;
};

async function fetchPeople(params: {
  q: string;
  cursor?: string;
}): Promise<PeopleResponse> {
  const url = new URL("/api/social/people", window.location.origin);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  url.searchParams.set("limit", "20");
  const res = await fetch(url.toString());
  return res.json();
}

function PersonCard({ user, onToggle }: { user: SocialUser; onToggle?: (id: string, following: boolean) => void }) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async ({ userId, follow }: { userId: string; follow: boolean }) => {
      const res = await fetch("/api/social/follows", {
        method: follow ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      return res.json();
    },
    onSuccess: (_data, { follow }) => {
      onToggle?.(user.id, follow);
      queryClient.invalidateQueries({ queryKey: ["social-people"] });
    },
  });

  const [following, setFollowing] = useState(user.isFollowing ?? false);
  const [hovered, setHovered] = useState(false);

  function handleToggle() {
    const next = !following;
    setFollowing(next);
    followMutation.mutate({ userId: user.id, follow: next });
  }

  const profileHref = user.username ? `/${user.username}` : `/dashboard/user/${user.id}`;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-default)]">
      <Link href={profileHref} className="shrink-0">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        ) : (
          <NaviiAvatar seed={user.name} size={48} />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={profileHref} className="text-[14px] font-semibold text-[var(--text-primary)] hover:underline truncate">
            {user.name}
          </Link>
          {user.mutual && (
            <span className="shrink-0 rounded-full bg-[var(--brand)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--brand)]">
              Mutuals
            </span>
          )}
          {user.followedBy && !user.isFollowing && (
            <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
              Follows you
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          {user.city && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {user.city}
            </span>
          )}
          {user.followerCount > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {user.followerCount.toLocaleString()} followers
            </span>
          )}
          <span className="flex items-center gap-1">
            <Lightning size={11} />
            {user.pulseTier}
          </span>
        </div>

        {user.reason && (
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)] font-medium">
            {user.reason}
          </p>
        )}

        {user.bio && (
          <p className="mt-1 text-[12px] text-[var(--text-secondary)] truncate">
            {user.bio}
          </p>
        )}
      </div>

      <button
        onClick={handleToggle}
        disabled={followMutation.isPending}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={
          following
            ? "shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
            : "shrink-0 rounded-full bg-[var(--brand)] px-4 py-2 text-[12px] font-bold text-black transition hover:opacity-90 active:scale-95"
        }
      >
        {following
          ? hovered ? "Unfollow" : "Following"
          : user.followedBy
          ? "Follow back"
          : "Follow"}
      </button>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-[var(--brand)]" />
      <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
        {title}
      </h2>
    </div>
  );
}

export default function PeopleClient() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["social-people", debouncedQ],
    queryFn: ({ pageParam }) =>
      fetchPeople({ q: debouncedQ, cursor: pageParam as string | undefined }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const allUsers = data?.pages.flatMap((p) => p.users) ?? [];

  // Split into sections when no search query
  const suggested = allUsers.filter((u) => u.followedBy || u.mutualCount > 0).slice(0, 8);
  const others = debouncedQ
    ? allUsers
    : allUsers.filter((u) => !suggested.find((s) => s.id === u.id));

  const handleToggle = useCallback((_id: string, _following: boolean) => {
    // Handled by invalidation in PersonCard
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-1">
          People
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)]">
          Discover your scene in Accra
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlass
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          placeholder="Search by name or username..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-2xl bg-[var(--bg-card)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && allUsers.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <Users size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <p className="mt-4 text-[14px] font-semibold text-[var(--text-secondary)]">
            {debouncedQ ? "No people found" : "No people yet"}
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            {debouncedQ
              ? "Try a different name or username"
              : "Complete your profile and start exploring events to connect with people"}
          </p>
        </div>
      )}

      {!isLoading && !debouncedQ && suggested.length > 0 && (
        <div className="mb-8">
          <SectionHeader icon={Sparkle} title="Suggested for you" />
          <div className="space-y-2">
            {suggested.map((user) => (
              <PersonCard key={user.id} user={user} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && others.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            icon={debouncedQ ? MagnifyingGlass : UserPlus}
            title={debouncedQ ? `Results for "${debouncedQ}"` : "More people in Accra"}
          />
          <div className="space-y-2">
            {others.map((user) => (
              <PersonCard key={user.id} user={user} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-2.5 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {isFetchingNextPage ? "Loading..." : (
              <>Load more <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
