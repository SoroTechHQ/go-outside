"use client";

import { useState } from "react";
import Image from "next/image";
import Avatar from "boring-avatars";
import { Sparkle, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { avatarUrl as withAvatarTransform } from "../../lib/image-url";

const AVATAR_COLORS = ["#0e2212", "#4a9f63", "#B0E454", "#152a1a", "#EAFFD0"];
const MAX_CHARS = 300;

const PRESET_TAGS = [
  "fire", "chill", "must-go", "slept-on", "overrated",
  "good-vibes", "energy", "banger", "intimate", "lit",
];

type Snippet = {
  id: string;
  body: string;
  vibe_tags: string[] | null;
  created_at: string;
  user_id: string;
};

type Props = {
  clerkId:   string;
  name:      string;
  avatarUrl: string | null;
  onPosted?: (snippet: Snippet) => void;
};

export function SnippetComposer({ clerkId, name, avatarUrl, onPosted }: Props) {
  const queryClient = useQueryClient();
  const [body, setBody]           = useState("");
  const [selectedTags, setTags]   = useState<Set<string>>(new Set());
  const resolved = withAvatarTransform(avatarUrl);

  const remaining = MAX_CHARS - body.length;
  const nearLimit = remaining <= 60;
  const overLimit = remaining < 0;

  function toggleTag(tag: string) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else if (next.size < 5) next.add(tag);
      return next;
    });
  }

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/snippets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          body:      body.trim(),
          vibe_tags: selectedTags.size > 0 ? [...selectedTags] : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to create snippet");
      return res.json() as Promise<Snippet>;
    },
    onSuccess: (snippet) => {
      setBody("");
      setTags(new Set());
      void queryClient.invalidateQueries({ queryKey: ["profile-snippets", clerkId] });
      onPosted?.(snippet);
    },
  });

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
            placeholder="Drop a quick take on an event…"
            rows={2}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            maxLength={MAX_CHARS + 10}
          />

          {/* Vibe tag chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PRESET_TAGS.map((tag) => {
              const active = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition active:scale-95 ${
                    active
                      ? "border-[#4a9f63]/60 bg-[#4a9f63]/15 text-[#4a9f63]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-tertiary)] hover:border-[#4a9f63]/40 hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {active && <X size={9} weight="bold" />}
                  #{tag}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-end gap-3">
            {nearLimit && (
              <span className={`text-[12px] font-semibold tabular-nums ${overLimit ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
                {remaining}
              </span>
            )}
            <button
              onClick={() => create.mutate()}
              disabled={!body.trim() || overLimit || create.isPending}
              className="flex items-center gap-1.5 rounded-full bg-[#4a9f63] px-4 py-1.5 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(74,159,99,0.3)] transition hover:bg-[#3a8f53] active:scale-95 disabled:opacity-50 disabled:shadow-none"
              type="button"
            >
              <Sparkle size={13} weight="fill" />
              {create.isPending ? "Posting…" : "Snippet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
