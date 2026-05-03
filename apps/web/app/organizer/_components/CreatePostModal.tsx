"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarBlank,
  Hash,
  Image as ImageIcon,
  Minus,
  NotePencil,
  PaperPlaneTilt,
  Ticket,
  X,
} from "@phosphor-icons/react";
import { DateTimePicker } from "../../../components/ui/DateTimePicker";

type OwnEvent = { id: string; title: string; date: string | null; slug: string };

type Props = {
  organizerName: string;
  ownEvents: OwnEvent[];
  open: boolean;
  onClose: () => void;
};

type State = "open" | "minimized" | "closed";

export function CreatePostModal({ organizerName, ownEvents, open, onClose }: Props) {
  const [state, setState] = useState<State>("closed");
  const [body, setBody] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<OwnEvent | null>(null);
  const [eventSearch, setEventSearch] = useState("");
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && state === "closed") setState("open");
  }, [open, state]);

  useEffect(() => {
    document.body.style.overflow = state === "open" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [state]);

  const filteredEvents =
    eventSearch.length > 0
      ? ownEvents.filter((e) => e.title.toLowerCase().includes(eventSearch.toLowerCase()))
      : ownEvents.slice(0, 5);

  function handleClose() {
    setState("closed");
    // Reset after animation
    setTimeout(() => {
      setBody("");
      setSelectedEvent(null);
      setEventSearch("");
      setMediaUrls([]);
      setHashtags([]);
      setHashtagInput("");
      setError(null);
      setSuccess(false);
    }, 300);
    onClose();
  }

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
      setSuccess(true);
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "closed") return null;

  return (
    <>
      {/* Backdrop */}
      {state === "open" && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setState("minimized")}
        />
      )}

      {/* Minimized pill */}
      {state === "minimized" && (
        <button
          type="button"
          onClick={() => setState("open")}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[var(--brand)] px-4 py-3 text-[13px] font-semibold text-black shadow-[0_8px_32px_rgba(95,191,42,0.4)] transition hover:opacity-90 active:scale-[0.97]"
        >
          <NotePencil size={15} weight="fill" />
          {body.trim() ? `Draft: ${body.slice(0, 30)}${body.length > 30 ? "…" : ""}` : "Create Post"}
        </button>
      )}

      {/* Full modal */}
      {state === "open" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4">
          <div className="flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_24px_72px_rgba(5,12,8,0.25)] md:max-h-[80vh] md:max-w-[560px] md:rounded-[24px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Create Post</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setState("minimized")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                  title="Minimize"
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition hover:text-rose-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {success ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="text-3xl">🎉</span>
                  <p className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">Post published!</p>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Closing in a moment…</p>
                </div>
              ) : (
                <>
                  {/* Avatar + compose */}
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 text-[13px] font-bold text-[var(--brand)]">
                      {organizerName[0] ?? "O"}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{organizerName}</p>
                      <textarea
                        autoFocus
                        className="mt-2 w-full resize-none bg-transparent text-[15px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                        maxLength={500}
                        placeholder={`What's happening, ${organizerName.split(" ")[0]}?`}
                        rows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                      />
                      <p className="text-right text-[11px] text-[var(--text-tertiary)]">
                        {body.length}/500
                      </p>
                    </div>
                  </div>

                  {/* Media previews */}
                  {mediaUrls.length > 0 && (
                    <div className={`grid gap-2 ${mediaUrls.length > 1 ? "grid-cols-2" : ""}`}>
                      {mediaUrls.map((url, i) => (
                        <div key={url} className="relative overflow-hidden rounded-[12px]">
                          <img src={url} alt="" className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hashtags */}
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
                          className="flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-2.5 py-1 text-[12px] font-medium text-[var(--brand)] hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          #{tag} <X size={10} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Event tag */}
                  {selectedEvent && (
                    <div className="flex items-center gap-2 rounded-[12px] border border-[var(--brand)]/25 bg-[var(--brand)]/8 px-3 py-2">
                      <Ticket size={13} className="text-[var(--brand)]" />
                      <p className="flex-1 text-[12px] font-semibold text-[var(--brand)]">{selectedEvent.title}</p>
                      <button type="button" onClick={() => setSelectedEvent(null)}>
                        <X size={12} className="text-[var(--brand)]" />
                      </button>
                    </div>
                  )}

                  {/* Event picker dropdown */}
                  {showEventPicker && (
                    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                      <input
                        type="text"
                        placeholder="Search events…"
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="w-full rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/30"
                      />
                      <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                        {filteredEvents.length === 0 ? (
                          <p className="py-2 text-center text-[12px] text-[var(--text-tertiary)]">No events found</p>
                        ) : filteredEvents.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => { setSelectedEvent(e); setShowEventPicker(false); }}
                            className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left transition hover:bg-[var(--bg-card)]"
                          >
                            <Ticket size={12} className="text-[var(--brand)]" />
                            <span className="text-[12px] text-[var(--text-primary)]">{e.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hashtag input */}
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      placeholder="Add hashtag (press Enter)"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addHashtag(hashtagInput); setHashtagInput(""); }
                      }}
                      className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                    />
                  </div>

                  {error && (
                    <div className="rounded-[12px] bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-400">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer toolbar */}
            {!success && (
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3">
                <div className="flex items-center gap-1">
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMedia} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={mediaUploading || mediaUrls.length >= 4}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40"
                    title="Add image"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEventPicker((v) => !v); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    title="Tag event"
                  >
                    <Ticket size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { const tag = prompt("Hashtag:"); if (tag) addHashtag(tag); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    title="Add hashtag"
                  >
                    <Hash size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode((v) => !v)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      scheduleMode
                        ? "bg-[var(--brand)]/15 text-[var(--brand)]"
                        : "text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    }`}
                    title="Schedule post"
                  >
                    <CalendarBlank size={16} weight={scheduleMode ? "fill" : "regular"} />
                  </button>
                </div>

                {/* Schedule picker inline */}
                {scheduleMode && (
                  <div className="w-56">
                    <DateTimePicker
                      value={scheduledFor}
                      onChange={setScheduledFor}
                      placeholder="Schedule for…"
                      showTime
                      clearable={false}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || !body.trim() || (scheduleMode && !scheduledFor)}
                  className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:opacity-90 active:scale-[0.97] disabled:opacity-40"
                >
                  <PaperPlaneTilt size={14} weight="fill" />
                  {submitting ? "Publishing…" : scheduleMode ? "Schedule" : "Publish"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
