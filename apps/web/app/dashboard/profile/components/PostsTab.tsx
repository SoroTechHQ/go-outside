"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PencilLine, Star } from "@phosphor-icons/react";

type EventPost = {
  id: string;
  body: string;
  vibe_tags: string[] | null;
  created_at: string;
  user_id: string;
  event_id?: string | null;
};

type Props = { clerkId: string };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          weight={i < rating ? "fill" : "regular"}
          className={i < rating ? "text-[#DAA520]" : "text-[var(--text-tertiary)]"}
        />
      ))}
    </div>
  );
}

export function PostsTab({ clerkId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-reviews", clerkId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${clerkId}/posts`);
      if (!res.ok) return { posts: [] };
      return res.json() as Promise<{ posts: EventPost[] }>;
    },
    staleTime: 3 * 60_000,
  });

  const posts = data?.posts ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-[18px] bg-[var(--bg-muted)] h-24" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <PencilLine size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-[var(--text-secondary)]">No reviews yet</p>
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
          Attend an event and drop your first take.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="block overflow-hidden rounded-[18px] border border-white/5 bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] p-4"
        >
          <p className="mt-2 text-[13px] leading-relaxed text-white/80">{post.body}</p>

          {post.vibe_tags && post.vibe_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.vibe_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-2 py-0.5 text-[9px] text-[#4a9f63]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-2 text-[10px] text-white/25">
            {new Date(post.created_at).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      ))}
    </div>
  );
}
