"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "boring-avatars";
import { formatDistanceToNow } from "date-fns";
import { Heart, Share, Trash, CalendarBlank, LinkSimple } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { avatarUrl as withAvatarTransform, thumbnailUrl as withThumbnailTransform, getImageUrl } from "../../lib/image-url";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];

export type PostAuthor = {
  id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  clerk_id: string;
};

export type PostEvent = {
  id: string;
  title: string;
  slug: string;
  banner_url: string | null;
} | null;

export type Post = {
  id: string;
  body: string;
  image_url: string | null;
  like_count: number;
  created_at: string;
  users: PostAuthor;
  events: PostEvent;
};

type PostCardProps = {
  post: Post;
  currentClerkId?: string;
  onDeleted?: (id: string) => void;
};

export function PostCard({ post, currentClerkId, onDeleted }: PostCardProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const isOwn = currentClerkId === post.users.clerk_id;

  const author     = post.users;
  const authorName = `${author.first_name} ${author.last_name ?? ""}`.trim();
  const resolved   = withAvatarTransform(author.avatar_url);
  const timeAgo    = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Like status
  const { data: likeData } = useQuery({
    queryKey: ["post-like", post.id, currentClerkId],
    queryFn: async () => {
      if (!currentClerkId) return { liked: false };
      const res = await fetch(`/api/posts/${post.id}/like`);
      return res.json() as Promise<{ liked: boolean }>;
    },
    enabled: !!currentClerkId,
    staleTime: 60_000,
  });

  const liked = likeData?.liked ?? false;

  const toggleLike = useMutation({
    mutationFn: async () => {
      await fetch(`/api/posts/${post.id}/like`, { method: liked ? "DELETE" : "POST" });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["post-like", post.id, currentClerkId] });
      queryClient.setQueryData(["post-like", post.id, currentClerkId], { liked: !liked });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["post-like", post.id, currentClerkId] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async () => {
      await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      onDeleted?.(post.id);
    },
  });

  async function handleShare() {
    const url = `${window.location.origin}/go/${author.username ?? author.clerk_id}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: post.body, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => null);
    }
  }

  const displayLikes = liked
    ? (post.like_count + (likeData?.liked === liked ? 0 : liked ? 1 : -1))
    : post.like_count;

  return (
    <article className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-default)]">
      {/* Author row */}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/go/${author.username ?? author.clerk_id}`} className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 36, height: 36 }}>
            {resolved ? (
              <Image src={resolved} alt={authorName} width={36} height={36} className="h-full w-full object-cover" />
            ) : (
              <Avatar size={36} name={authorName} variant="beam" colors={AVATAR_COLORS} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight text-[var(--text-primary)] truncate">{authorName}</p>
            {author.username && (
              <p className="text-[11px] text-[var(--text-tertiary)]">@{author.username}</p>
            )}
          </div>
        </Link>
        <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">{timeAgo}</span>
      </div>

      {/* Body */}
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">{post.body}</p>

      {/* Optional image */}
      {post.image_url && (
        <div className="relative mt-3 overflow-hidden rounded-xl aspect-[16/9] bg-zinc-900">
          <Image
            src={getImageUrl(post.image_url, { width: 800, quality: 72, format: "webp" }) ?? post.image_url}
            alt="Post image"
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
        </div>
      )}

      {/* Tagged event */}
      {post.events && (
        <Link
          href={`/events/${post.events.slug}`}
          className="mt-3 flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-2.5 transition hover:border-[var(--brand)]/30 hover:bg-[var(--bg-card-hover)]"
        >
          {post.events.banner_url && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={withThumbnailTransform(post.events.banner_url) ?? post.events.banner_url}
                alt={post.events.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Event</p>
            <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{post.events.title}</p>
          </div>
          <CalendarBlank size={14} className="ml-auto shrink-0 text-[var(--text-tertiary)]" />
        </Link>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-0.5">
        <button
          onClick={() => toggleLike.mutate()}
          disabled={!currentClerkId}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition active:scale-95 disabled:opacity-50 ${
            liked
              ? "text-red-500 hover:bg-red-500/10"
              : "text-[var(--text-tertiary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]"
          }`}
          type="button"
        >
          <Heart size={15} weight={liked ? "fill" : "regular"} />
          {displayLikes > 0 && <span>{displayLikes}</span>}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)] active:scale-95"
          type="button"
        >
          {copied ? <LinkSimple size={15} className="text-[var(--brand)]" /> : <Share size={15} />}
        </button>

        {isOwn && (
          <button
            onClick={() => deletePost.mutate()}
            disabled={deletePost.isPending}
            className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-500 active:scale-95 disabled:opacity-50"
            type="button"
          >
            <Trash size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
