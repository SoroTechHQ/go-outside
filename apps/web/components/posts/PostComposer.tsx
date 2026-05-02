"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Avatar from "boring-avatars";
import {
  Image as ImageIcon,
  VideoCamera,
  X,
  Sparkle,
  CalendarBlank,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { avatarUrl as withAvatarTransform } from "../../lib/image-url";
import type { Post } from "./PostCard";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];
const MAX_CHARS = 500;

type EventResult = { id: string; title: string; slug: string; banner_url: string | null };

type PostComposerProps = {
  clerkId:   string;
  name:      string;
  avatarUrl: string | null;
  onPosted?: (post: Post) => void;
};

// Detect video by URL extension
function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|qt)(\?|$)/i.test(url);
}

export function PostComposer({ clerkId, name, avatarUrl, onPosted }: PostComposerProps) {
  const queryClient = useQueryClient();
  const [body, setBody]           = useState("");
  const [mediaUrl, setMediaUrl]   = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [showEventSearch, setShowEventSearch]   = useState(false);
  const [eventQuery, setEventQuery]             = useState("");
  const [selectedEvent, setSelectedEvent]       = useState<EventResult | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const eventSearchRef = useRef<HTMLDivElement>(null);
  const resolved = withAvatarTransform(avatarUrl);

  const remaining = MAX_CHARS - body.length;
  const nearLimit = remaining <= 80;
  const overLimit = remaining < 0;

  // Event search
  const { data: eventResults } = useQuery({
    queryKey: ["event-search", eventQuery],
    queryFn: async () => {
      if (!eventQuery.trim()) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(eventQuery)}&type=events`);
      if (!res.ok) return [];
      const json = await res.json() as { events?: EventResult[] };
      return json.events ?? [];
    },
    enabled: showEventSearch && eventQuery.trim().length > 1,
    staleTime: 30_000,
  });

  // Close event search on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (eventSearchRef.current && !eventSearchRef.current.contains(e.target as Node)) {
        setShowEventSearch(false);
      }
    }
    if (showEventSearch) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEventSearch]);

  const createPost = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/posts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body:      body.trim(),
          image_url: mediaUrl ?? undefined,
          event_id:  selectedEvent?.id ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json() as Promise<Post>;
    },
    onSuccess: (newPost) => {
      setBody("");
      setMediaUrl(null);
      setMediaType(null);
      setSelectedEvent(null);
      setEventQuery("");
      setShowEventSearch(false);
      void queryClient.invalidateQueries({ queryKey: ["posts", clerkId] });
      onPosted?.(newPost);
    },
  });

  async function uploadFile(file: File, type: "image" | "video") {
    setUploading(true);
    setUploadPct(0);
    // Simulate progress for UX (real XHR progress would need XMLHttpRequest)
    const ticker = setInterval(() => setUploadPct((p) => Math.min(p + 8, 88)), 300);
    try {
      const endpoint = type === "video" ? "/api/upload/video" : "/api/upload/post-media";
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(endpoint, { method: "POST", body: form });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        setMediaUrl(json.url);
        setMediaType(type);
      } else {
        console.error("Upload error:", json.error);
      }
    } finally {
      clearInterval(ticker);
      setUploadPct(100);
      setTimeout(() => { setUploading(false); setUploadPct(0); }, 300);
      if (imageRef.current) imageRef.current.value = "";
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file, "image");
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file, "video");
  }

  function clearMedia() {
    setMediaUrl(null);
    setMediaType(null);
  }

  return (
    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 38, height: 38 }}>
          {resolved ? (
            <Image src={resolved} alt={name} width={38} height={38} className="h-full w-full object-cover" />
          ) : (
            <Avatar size={38} name={name} variant="beam" colors={AVATAR_COLORS} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's the vibe tonight?"
            rows={3}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            maxLength={MAX_CHARS + 10}
          />

          {/* Upload progress */}
          {uploading && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-full rounded-full bg-[#4a9f63] transition-all duration-300"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          )}

          {/* Media preview */}
          {mediaUrl && !uploading && (
            <div className="relative mt-2 w-full overflow-hidden rounded-xl bg-zinc-900">
              {mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full max-h-[280px] object-contain"
                  preload="metadata"
                />
              ) : (
                <div className="aspect-[16/9]">
                  <Image src={mediaUrl} alt="Attached" fill className="object-cover" />
                </div>
              )}
              <button
                onClick={clearMedia}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                type="button"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          )}

          {/* Tagged event */}
          {selectedEvent && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3 py-2">
              <CalendarBlank size={13} className="shrink-0 text-[#4a9f63]" />
              <span className="flex-1 truncate text-[12px] font-semibold text-[var(--text-primary)]">
                {selectedEvent.title}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                type="button"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          )}

          {/* Event search dropdown */}
          {showEventSearch && !selectedEvent && (
            <div ref={eventSearchRef} className="mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
                <MagnifyingGlass size={13} className="shrink-0 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={eventQuery}
                  onChange={(e) => setEventQuery(e.target.value)}
                  placeholder="Search events…"
                  autoFocus
                  className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
                />
                <button onClick={() => setShowEventSearch(false)} className="shrink-0 text-[var(--text-tertiary)]" type="button">
                  <X size={12} weight="bold" />
                </button>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {(eventResults ?? []).length === 0 && eventQuery.trim().length > 1 && (
                  <p className="py-4 text-center text-[12px] text-[var(--text-tertiary)]">No events found</p>
                )}
                {eventQuery.trim().length <= 1 && (
                  <p className="py-4 text-center text-[12px] text-[var(--text-tertiary)]">Type to search events…</p>
                )}
                {(eventResults ?? []).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventSearch(false);
                      setEventQuery("");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-[var(--bg-muted)]"
                    type="button"
                  >
                    {event.banner_url && (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                        <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {event.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-0.5">
              {/* Image */}
              <button
                onClick={() => imageRef.current?.click()}
                disabled={uploading || !!mediaUrl}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)] disabled:opacity-40"
                title="Add photo"
                type="button"
              >
                <ImageIcon size={16} />
              </button>
              {/* Video */}
              <button
                onClick={() => videoRef.current?.click()}
                disabled={uploading || !!mediaUrl}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)] disabled:opacity-40"
                title="Add video"
                type="button"
              >
                <VideoCamera size={16} />
              </button>
              {/* Tag event */}
              <button
                onClick={() => setShowEventSearch((v) => !v)}
                disabled={!!selectedEvent}
                className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition hover:bg-[var(--bg-muted)] disabled:opacity-40 ${
                  selectedEvent ? "text-[#4a9f63]" : "text-[var(--text-tertiary)]"
                }`}
                title="Tag an event"
                type="button"
              >
                <CalendarBlank size={14} />
                <span className="hidden sm:inline">Event</span>
              </button>

              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" className="hidden" onChange={handleVideoChange} />
            </div>

            <div className="flex items-center gap-3">
              {nearLimit && (
                <span className={`text-[12px] font-semibold tabular-nums ${overLimit ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
                  {remaining}
                </span>
              )}
              <button
                onClick={() => createPost.mutate()}
                disabled={!body.trim() || overLimit || createPost.isPending || uploading}
                className="flex items-center gap-1.5 rounded-full bg-[#4a9f63] px-4 py-1.5 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(74,159,99,0.35)] transition hover:bg-[#3a8f53] active:scale-95 disabled:opacity-50 disabled:shadow-none"
                type="button"
              >
                <Sparkle size={13} weight="fill" />
                {createPost.isPending ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
