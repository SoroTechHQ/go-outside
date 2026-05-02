"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarBlank,
  Hash,
  Image as ImageIcon,
  MapPin,
  PaperPlaneTilt,
  Ticket,
  X,
} from "@phosphor-icons/react";

type OwnEvent = { id: string; title: string; date: string | null; slug: string };

type Props = {
  organizerName: string;
  ownEvents: OwnEvent[];
};

export function PostComposerClient({ organizerName, ownEvents }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<OwnEvent | null>(null);
  const [eventSearch, setEventSearch] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [location, setLocation] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredEvents =
    eventSearch.length > 0
      ? ownEvents.filter((e) =>
          e.title.toLowerCase().includes(eventSearch.toLowerCase())
        )
      : ownEvents.slice(0, 5);

  async function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setMediaUploading(true);
    for (const file of files.slice(0, 4 - mediaUrls.length)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload/post-media", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          if (data.url) setMediaUrls((prev) => [...prev, data.url]);
        }
      } catch {}
    }
    setMediaUploading(false);
    e.target.value = "";
  }

  function addHashtag(raw: string) {
    const tag = raw.trim().replace(/^#/, "").toLowerCase();
    if (!tag || hashtags.includes(tag)) return;
    setHashtags((prev) => [...prev, tag]);
  }

  async function submit() {
    if (!body.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      if (scheduleMode && scheduledFor) {
        const res = await fetch("/api/organizer/schedule-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body,
            eventId: selectedEvent?.id ?? null,
            mediaUrls,
            hashtags,
            location: location || null,
            scheduledFor,
          }),
        });
        if (!res.ok) throw new Error("Failed to schedule post");
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body,
            event_id: selectedEvent?.id ?? undefined,
            image_url: mediaUrls[0] ?? undefined,
          }),
        });
        if (!res.ok) throw new Error("Failed to publish post");
      }
      router.push("/organizer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-5 md:p-7">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Content
        </p>
        <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
          Create Post
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_340px]">
        {/* Compose */}
        <div className="space-y-4">
          {/* Body */}
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <textarea
              autoFocus
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              maxLength={500}
              placeholder={`What's happening, ${organizerName.split(" ")[0]}?`}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <p
                className={`text-[11px] ${body.length > 450 ? "text-amber-500" : "text-[var(--text-tertiary)]"}`}
              >
                {500 - body.length} left
              </p>
            </div>

            {mediaUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {mediaUrls.map((url) => (
                  <div key={url} className="relative">
                    <img
                      alt=""
                      className="h-20 w-full rounded-[10px] object-cover"
                      src={url}
                    />
                    <button
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                      type="button"
                      onClick={() => setMediaUrls((p) => p.filter((u) => u !== url))}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-tertiary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--brand)] disabled:opacity-40"
                disabled={mediaUrls.length >= 4}
                title="Add media"
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                {mediaUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                ) : (
                  <ImageIcon size={16} />
                )}
              </button>
              <input
                ref={fileRef}
                accept="image/*,video/*"
                className="sr-only"
                multiple
                type="file"
                onChange={handleMedia}
              />
            </div>
          </div>

          {/* Event tag */}
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="mb-3 flex items-center gap-2">
              <Ticket size={15} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Tag an event</p>
            </div>
            {selectedEvent ? (
              <div className="flex items-center justify-between rounded-[14px] bg-[var(--brand)]/8 px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {selectedEvent.title}
                  </p>
                  {selectedEvent.date && (
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {new Date(selectedEvent.date).toLocaleDateString("en-GH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <button
                  className="rounded-full p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <input
                  className="w-full rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
                  placeholder="Search your events…"
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                />
                {filteredEvents.length > 0 && eventSearch.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {filteredEvents.map((e) => (
                      <button
                        key={e.id}
                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left transition hover:bg-[var(--bg-elevated)]"
                        type="button"
                        onClick={() => {
                          setSelectedEvent(e);
                          setEventSearch("");
                        }}
                      >
                        <p className="text-[13px] text-[var(--text-primary)]">{e.title}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="mb-3 flex items-center gap-2">
              <Hash size={15} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Hashtags</p>
            </div>
            <div className="flex min-h-[40px] flex-wrap items-center gap-2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-[12px] text-[var(--brand)]"
                >
                  #{tag}
                  <button
                    className="opacity-60 hover:opacity-100"
                    type="button"
                    onClick={() => setHashtags((p) => p.filter((t) => t !== tag))}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                className="min-w-[100px] flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                placeholder="Type and press Enter"
                type="text"
                value={hashtagInput}
                onBlur={() => {
                  if (hashtagInput.trim()) {
                    addHashtag(hashtagInput);
                    setHashtagInput("");
                  }
                }}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addHashtag(hashtagInput);
                    setHashtagInput("");
                  }
                }}
              />
            </div>
          </div>

          {/* Location */}
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-[var(--brand)]" weight="fill" />
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Location</p>
            </div>
            <input
              className="w-full rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
              placeholder="e.g. Osu, Accra"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center gap-3 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <CalendarBlank size={16} className="text-[var(--brand)]" weight="fill" />
            <p className="flex-1 text-[13px] font-semibold text-[var(--text-primary)]">
              Schedule for later
            </p>
            <button
              className={`relative h-6 w-11 rounded-full transition-colors ${scheduleMode ? "bg-[var(--brand)]" : "bg-[var(--bg-muted)]"}`}
              type="button"
              onClick={() => setScheduleMode((v) => !v)}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${scheduleMode ? "translate-x-5" : ""}`}
              />
            </button>
          </div>

          {scheduleMode && (
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Publish at
              </label>
              <input
                className="mt-2 w-full rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none [color-scheme:dark]"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="rounded-[14px] bg-rose-500/10 px-4 py-3 text-[13px] text-rose-400">
              {error}
            </div>
          )}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] py-3 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97] disabled:opacity-40"
            disabled={submitting || !body.trim() || (scheduleMode && !scheduledFor)}
            type="button"
            onClick={submit}
          >
            <PaperPlaneTilt size={15} weight="fill" />
            {submitting
              ? "Publishing…"
              : scheduleMode
              ? "Schedule post"
              : "Publish now"}
          </button>
        </div>

        {/* Live preview */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Preview
            </p>
            <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-sm font-bold text-[var(--brand)]">
                  {organizerName[0] ?? "O"}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {organizerName}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Just now</p>
                </div>
              </div>
              <p
                className={`mt-3 whitespace-pre-wrap text-[13px] leading-relaxed ${
                  body ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                }`}
              >
                {body || "Your post will appear here as you type…"}
              </p>
              {hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {hashtags.map((tag) => (
                    <span key={tag} className="text-[12px] text-[var(--brand)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {mediaUrls.length > 0 && (
                <div
                  className={`mt-3 grid gap-1 ${mediaUrls.length === 1 ? "" : "grid-cols-2"}`}
                >
                  {mediaUrls.map((url) => (
                    <img
                      key={url}
                      alt=""
                      className="w-full rounded-[10px] object-cover"
                      src={url}
                      style={{ maxHeight: 140 }}
                    />
                  ))}
                </div>
              )}
              {selectedEvent && (
                <div className="mt-3 rounded-[12px] border border-[var(--brand)]/25 bg-[var(--brand)]/8 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                    Event
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[var(--text-primary)]">
                    {selectedEvent.title}
                  </p>
                </div>
              )}
              {location && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <MapPin size={11} />
                  {location}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
