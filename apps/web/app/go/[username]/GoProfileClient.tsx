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
} from "@phosphor-icons/react";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

const TIER_COLOR: Record<string, string> = {
  Newcomer: "#888888",
  Explorer: "#4a9f63",
  Regular: "#4a9f63",
  "Scene Kid": "#4a9f63",
  "City Native": "#c87c2a",
  Legend: "#DAA520",
};

type Props = {
  clerkId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  pulseScore: number;
  pulseTier: string;
  city: string | null;
  joinedAt: string | null;
};

export default function GoProfileClient({
  clerkId,
  username,
  name,
  avatarUrl,
  bio,
  pulseScore,
  pulseTier,
  city,
  joinedAt,
}: Props) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const isOwnProfile = currentUser?.id === clerkId;
  const tierColor = TIER_COLOR[pulseTier] ?? "#4a9f63";
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/follow/status?targetId=${clerkId}`);
      if (!res.ok) return { following: false };
      return res.json() as Promise<{ following: boolean; mutual: boolean }>;
    },
    enabled: !!currentUser && !isOwnProfile,
    staleTime: 30_000,
  });

  useState(() => {
    if (followStatus) setIsFollowing(followStatus.following);
  });

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

  const joinedYear = joinedAt ? new Date(joinedAt).getFullYear() : null;

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 text-[var(--text-primary)]">
      {/* Cover */}
      <div className="relative h-[200px] w-full overflow-hidden md:h-[240px]">
        <div className="h-full w-full bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.08)_40%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,159,99,0.18),transparent_50%)]" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
          >
            <ArrowLeft size={17} weight="bold" />
          </button>
          <span
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm"
            style={{ backgroundColor: `${tierColor}22`, borderColor: `${tierColor}40` }}
          >
            {pulseTier}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {/* Avatar */}
        <div className="-mt-11 pb-3">
          <div className="relative inline-block">
            <div
              className="overflow-hidden rounded-full"
              style={{ width: 84, height: 84, boxShadow: `0 0 0 3px var(--bg-base), 0 0 0 5px ${tierColor}55` }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} width={84} height={84} className="h-full w-full object-cover" />
              ) : (
                <Avatar size={84} name={name} variant="beam" colors={AVATAR_COLORS} />
              )}
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="flex items-start justify-between gap-3 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[22px] font-bold italic leading-tight text-[var(--text-primary)]">
                {name}
              </h1>
              <CheckCircle size={18} weight="fill" className="text-[#4a9f63]" />
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">@{username}</p>

            {bio && (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">{bio}</p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {city && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <MapPin size={11} />{city}
                </span>
              )}
              {joinedYear && (
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <CalendarBlank size={11} />Joined {joinedYear}
                </span>
              )}
            </div>
          </div>

          <div className="mt-0.5 flex shrink-0 items-center gap-2">
            {/* Share */}
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
                    isFollowing
                      ? "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                      : "bg-[#4a9f63] text-white shadow-[0_4px_16px_rgba(74,159,99,0.35)]"
                  }`}
                >
                  {isFollowing ? <><UserMinus size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pulse card */}
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
                {pulseTier}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-white/30">
                <Lightning size={11} />
                XP Score
              </div>
            </div>
            <p className="mt-3 font-display text-[2.4rem] font-bold italic leading-none text-white">
              {pulseScore.toLocaleString()}
              <span className="ml-2 text-[1rem] font-normal text-white/30">pts</span>
            </p>
          </div>
        </div>

        <p className="mt-6 py-12 text-center text-[13px] text-[var(--text-tertiary)]">
          Posts, events, and snippets coming soon.
        </p>
      </div>
    </main>
  );
}
