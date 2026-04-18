"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus } from "@phosphor-icons/react";

type Props = {
  userId: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
  onToggle?: (following: boolean) => void;
};

export function FollowButton({ userId, initialFollowing = false, size = "md", onToggle }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(!initialFollowing);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/follow`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setFollowing(d.following ?? false); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  async function toggle() {
    const next = !following;
    setFollowing(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      const data = await res.json() as { following?: boolean };
      setFollowing(data.following ?? next);
      onToggle?.(data.following ?? next);
    } catch {
      setFollowing(!next);
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? 13 : 15;
  const baseClass = size === "sm"
    ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
    : "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition";

  if (following) {
    return (
      <button
        className={`${baseClass} border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500`}
        disabled={loading}
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        type="button"
      >
        <UserMinus size={iconSize} weight="bold" />
        {hovered ? "Unfollow" : "Following"}
      </button>
    );
  }

  return (
    <button
      className={`${baseClass} bg-[var(--brand)] text-black hover:opacity-90 active:scale-95 disabled:opacity-60`}
      disabled={loading}
      onClick={toggle}
      type="button"
    >
      <UserPlus size={iconSize} weight="bold" />
      Follow
    </button>
  );
}

export default FollowButton;
