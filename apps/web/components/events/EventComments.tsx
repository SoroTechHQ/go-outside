"use client";

import { useState, useRef } from "react";
import { NaviiAvatar } from "../profile/NaviiAvatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import {
  ChatCircle,
  Fire,
  Smiley,
  Star,
  Heart,
  Confetti,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import Link from "next/link";

type Comment = {
  id: string;
  body: string;
  vibe_tags: string[];
  gif_url: string | null;
  rating: number | null;
  created_at: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

const VIBE_TAGS = [
  { key: "cant-wait",   label: "Can't wait",  icon: <Fire size={11} weight="fill" /> },
  { key: "was-there",  label: "Was there",   icon: <Star size={11} weight="fill" /> },
  { key: "hyped",      label: "Hyped",       icon: <Confetti size={11} weight="fill" /> },
  { key: "good-vibes", label: "Good vibes",  icon: <Smiley size={11} weight="fill" /> },
  { key: "fire",       label: "Fire",        icon: <Heart size={11} weight="fill" /> },
];


function CommentCard({ comment }: { comment: Comment }) {
  const user = comment.users;
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const timeAgo = getTimeAgo(comment.created_at);

  return (
    <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-start gap-3">
        {user?.avatar_url ? (
          <img alt={displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" src={user.avatar_url} />
        ) : (
          <NaviiAvatar seed={user?.username ?? user?.id ?? displayName} title={displayName} size={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <Link
              className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition"
              href={user?.id ? `/dashboard/user/${user.id}` : "#"}
            >
              {displayName}
            </Link>
            {user?.username && (
              <span className="text-xs text-[var(--text-tertiary)]">@{user.username}</span>
            )}
            <span className="ml-auto text-xs text-[var(--text-tertiary)]">{timeAgo}</span>
          </div>

          {comment.vibe_tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {comment.vibe_tags.map((tag) => {
                const vibe = VIBE_TAGS.find((v) => v.key === tag);
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--brand)]"
                  >
                    {vibe?.icon}
                    {vibe?.label ?? tag}
                  </span>
                );
              })}
            </div>
          )}

          <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--text-secondary)]">{comment.body}</p>

          {comment.gif_url && (
            <div className="mt-2 overflow-hidden rounded-lg">
              <img alt="GIF" className="max-h-[200px] w-auto rounded-lg" src={comment.gif_url} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentComposer({ eventSlug, eventId, onPosted }: { eventSlug: string; eventId: string; onPosted?: () => void }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/events/${eventSlug}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, vibe_tags: selectedTags, event_id: eventId }),
      }).then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => {
      setBody("");
      setSelectedTags([]);
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventSlug] });
      onPosted?.();
    },
  });

  if (!user) {
    return (
      <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          <Link className="font-semibold text-[var(--brand)] hover:underline" href="/sign-in">Sign in</Link>{" "}
          to leave a comment
        </p>
      </div>
    );
  }

  const initials = ((user.firstName ?? "") + (user.lastName ?? "")).slice(0, 2).toUpperCase() || "ME";

  function handleVibeTag(vibe: typeof VIBE_TAGS[number]) {
    const active = selectedTags.includes(vibe.key);
    if (active) {
      setSelectedTags((prev) => prev.filter((t) => t !== vibe.key));
    } else {
      // Push the label text into the textarea
      setBody((prev) => prev ? `${prev} ${vibe.label}` : vibe.label);
      setSelectedTags((prev) => [...prev, vibe.key]);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-start gap-3">
        {user.imageUrl ? (
          <img alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" src={user.imageUrl} />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[0.6rem] font-bold text-[var(--brand)]">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded-lg border border-[var(--home-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition"
            maxLength={300}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts about this event…"
            rows={2}
            value={body}
          />

          {/* Vibe suggestion chips — clicking pushes text into the textarea */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VIBE_TAGS.map((vibe) => {
              const active = selectedTags.includes(vibe.key);
              return (
                <button
                  key={vibe.key}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-medium transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--brand)]"
                      : "border-[var(--home-border)] text-[var(--text-tertiary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                  onClick={() => handleVibeTag(vibe)}
                  type="button"
                >
                  {vibe.icon}
                  {vibe.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">{body.length}/300</span>
            <button
              className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              disabled={!body.trim() || isPending}
              onClick={() => mutate()}
              type="button"
            >
              <PaperPlaneTilt size={12} weight="bold" />
              {isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventComments({
  eventSlug,
  eventId,
  compact = false,
}: {
  eventSlug: string;
  eventId: string;
  compact?: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const limit = compact ? 3 : 10;

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["event-comments", eventSlug],
    queryFn: () =>
      fetch(`/api/events/${eventSlug}/comments?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`).then((r) =>
        r.json()
      ),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <CommentComposer eventSlug={eventSlug} eventId={eventId} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] px-5 py-8 text-center">
          <ChatCircle className="mx-auto mb-2 text-[var(--text-tertiary)]" size={28} weight="regular" />
          <p className="text-sm text-[var(--text-secondary)]">No comments yet. Be the first to say something!</p>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
