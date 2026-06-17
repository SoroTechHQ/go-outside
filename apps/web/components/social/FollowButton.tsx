"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, UserMinus, UserCheck } from "@phosphor-icons/react";
import type { FollowStatus } from "../../lib/social/types";

type Props = {
  /** Supabase user UUID of the person to follow */
  userId: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
  onToggle?: (following: boolean) => void;
};

export function FollowButton({ userId, initialFollowing = false, size = "md", onToggle }: Props) {
  const [status, setStatus] = useState<FollowStatus>({
    following: initialFollowing,
    followedBy: false,
    mutual: false,
  });
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/social/follow-status?targetUserId=${userId}`)
      .then((r) => r.json())
      .then((d: FollowStatus) => {
        if (!cancelled) {
          setStatus(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const toggle = useCallback(async () => {
    const next = !status.following;
    setStatus((s) => ({ ...s, following: next, mutual: next && s.followedBy }));
    setLoading(true);
    try {
      const res = await fetch("/api/social/follows", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = (await res.json()) as Partial<FollowStatus>;
      setStatus((s) => ({
        following: data.following ?? next,
        followedBy: s.followedBy,
        mutual: (data.following ?? next) && s.followedBy,
      }));
      onToggle?.(data.following ?? next);
    } catch {
      setStatus((s) => ({ ...s, following: !next, mutual: !next && s.followedBy }));
    } finally {
      setLoading(false);
    }
  }, [userId, status.following, status.followedBy, onToggle]);

  const iconSize = size === "sm" ? 13 : 15;
  const baseClass =
    size === "sm"
      ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
      : "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition";

  if (status.following) {
    return (
      <button
        className={`${baseClass} border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500`}
        disabled={loading}
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        type="button"
        aria-label={hovered ? "Unfollow" : "Following"}
      >
        {hovered ? <UserMinus size={iconSize} weight="bold" /> : <UserCheck size={iconSize} weight="bold" />}
        {hovered ? "Unfollow" : status.mutual ? "Mutuals" : "Following"}
      </button>
    );
  }

  if (status.followedBy) {
    return (
      <button
        className={`${baseClass} bg-[var(--bg-card)] border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-black active:scale-95 disabled:opacity-60`}
        disabled={loading}
        onClick={toggle}
        type="button"
        aria-label="Follow back"
      >
        <UserPlus size={iconSize} weight="bold" />
        Follow back
      </button>
    );
  }

  return (
    <button
      className={`${baseClass} bg-[var(--brand)] text-black hover:opacity-90 active:scale-95 disabled:opacity-60`}
      disabled={loading}
      onClick={toggle}
      type="button"
      aria-label="Follow"
    >
      <UserPlus size={iconSize} weight="bold" />
      Follow
    </button>
  );
}

export default FollowButton;
