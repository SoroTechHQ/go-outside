"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { PostCard, type Post } from "./PostCard";
import { PostComposer } from "./PostComposer";

type PostsPage = { posts: Post[]; nextCursor: string | null };

async function fetchPosts({ pageParam, clerkId }: { pageParam: string | null; clerkId: string }): Promise<PostsPage> {
  const url = new URL("/api/posts", window.location.origin);
  url.searchParams.set("clerkId", clerkId);
  if (pageParam) url.searchParams.set("cursor", pageParam);
  const res = await fetch(url.toString());
  if (!res.ok) return { posts: [], nextCursor: null };
  const data = await res.json() as { posts: Post[] };
  const last = data.posts[data.posts.length - 1];
  return {
    posts:      data.posts,
    nextCursor: data.posts.length === 20 ? (last?.created_at ?? null) : null,
  };
}

type PostFeedProps = {
  profileClerkId:  string;
  profileName:     string;
  profileAvatarUrl: string | null;
  isOwnProfile:    boolean;
};

export function PostFeed({ profileClerkId, profileName, profileAvatarUrl, isOwnProfile }: PostFeedProps) {
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["posts", profileClerkId],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam: pageParam as string | null, clerkId: profileClerkId }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const remotePosts = data?.pages.flatMap((p) => p.posts) ?? [];
  const deletedIds  = new Set(localPosts.filter((p) => p.id.startsWith("__deleted__")).map((p) => p.id.replace("__deleted__", "")));

  // Merge: local optimistic new posts at top, then remote
  const allPosts = [
    ...localPosts.filter((p) => !p.id.startsWith("__deleted__")),
    ...remotePosts.filter((p) => !localPosts.some((lp) => lp.id === p.id) && !deletedIds.has(p.id)),
  ];

  function handlePosted(post: Post) {
    setLocalPosts((prev) => [post, ...prev]);
  }

  function handleDeleted(id: string) {
    setLocalPosts((prev) => prev.filter((p) => p.id !== id));
    void queryClient.invalidateQueries({ queryKey: ["posts", profileClerkId] });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[var(--bg-muted)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 rounded bg-[var(--bg-muted)]" />
                <div className="h-2 w-1/5 rounded bg-[var(--bg-muted)]" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 rounded bg-[var(--bg-muted)]" />
              <div className="h-3 w-4/5 rounded bg-[var(--bg-muted)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Composer — only on own profile */}
      {isOwnProfile && currentUser && (
        <PostComposer
          clerkId={profileClerkId}
          name={profileName}
          avatarUrl={profileAvatarUrl}
          onPosted={handlePosted}
        />
      )}

      {allPosts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">No posts yet</p>
          <p className="text-[12px] text-[var(--text-tertiary)] max-w-[200px]">
            {isOwnProfile ? "Share what you're up to tonight." : "Posts will appear here."}
          </p>
        </div>
      ) : (
        allPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentClerkId={currentUser?.id}
            onDeleted={handleDeleted}
          />
        ))
      )}

      <div ref={sentinelRef} className="py-2">
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
          </div>
        )}
        {!hasNextPage && allPosts.length > 5 && (
          <p className="text-center text-[11px] text-[var(--text-tertiary)]">All caught up</p>
        )}
      </div>
    </div>
  );
}
