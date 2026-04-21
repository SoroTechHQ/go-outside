"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Avatar from "boring-avatars";
import { Image as ImageIcon, X, Sparkle } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { avatarUrl as withAvatarTransform } from "../../lib/image-url";
import type { Post } from "./PostCard";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];
const MAX_CHARS = 500;

type PostComposerProps = {
  clerkId:   string;
  name:      string;
  avatarUrl: string | null;
  onPosted?: (post: Post) => void;
};

export function PostComposer({ clerkId, name, avatarUrl, onPosted }: PostComposerProps) {
  const queryClient = useQueryClient();
  const [body, setBody]         = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resolved = withAvatarTransform(avatarUrl);

  const remaining = MAX_CHARS - body.length;
  const nearLimit = remaining <= 80;
  const overLimit = remaining < 0;

  const createPost = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/posts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ body: body.trim(), image_url: imageUrl ?? undefined }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json() as Promise<Post>;
    },
    onSuccess: (newPost) => {
      setBody("");
      setImageUrl(null);
      void queryClient.invalidateQueries({ queryKey: ["posts", clerkId] });
      onPosted?.(newPost);
    },
  });

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/upload/post-media", { method: "POST", body: form });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) setImageUrl(json.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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

        {/* Input area */}
        <div className="flex-1 min-w-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's the vibe tonight?"
            rows={3}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            maxLength={MAX_CHARS + 10}
          />

          {/* Attached image preview */}
          {imageUrl && (
            <div className="relative mt-2 w-full overflow-hidden rounded-xl aspect-[16/9]">
              <Image src={imageUrl} alt="Attached" fill className="object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                type="button"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)] disabled:opacity-40"
                title="Add image"
                type="button"
              >
                <ImageIcon size={16} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="flex items-center gap-3">
              {nearLimit && (
                <span className={`text-[12px] font-semibold tabular-nums ${overLimit ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
                  {remaining}
                </span>
              )}
              <button
                onClick={() => createPost.mutate()}
                disabled={!body.trim() || overLimit || createPost.isPending}
                className="flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 py-1.5 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(95,191,42,0.35)] transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:shadow-none"
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
