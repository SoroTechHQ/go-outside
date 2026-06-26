"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarBlank, CheckCircle, Clock, MapPin, Ticket } from "@phosphor-icons/react";
import { useWizard } from "../WizardContext";
import { DateTimePicker } from "../../../../../components/ui/DateTimePicker";

export function Step6Publish() {
  const { state, setField, clearDraft } = useWizard();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = state.startDatetime
    ? new Date(state.startDatetime).toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : null;
  const timeLabel = state.startDatetime
    ? new Date(state.startDatetime).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })
    : null;
  const endTimeLabel = state.endDatetime
    ? new Date(state.endDatetime).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })
    : null;
  const locationLabel = state.isOnline
    ? "Online event"
    : state.customLocation ?? (state.venueId ? "Venue selected" : null);
  const lowestPrice = state.ticketTypes.length > 0
    ? Math.min(...state.ticketTypes.map((t) => t.price))
    : null;
  const priceLabel = lowestPrice === null
    ? "No tickets added"
    : lowestPrice === 0
    ? "Free"
    : `From GHS ${lowestPrice.toLocaleString()}`;

  async function submit(publish: boolean) {
    setError(null);
    if (!state.title?.trim()) { setError("Event title is required."); return; }
    if (!state.startDatetime)  { setError("Start date and time are required."); return; }
    if (!state.categoryId)     { setError("Please select an event category."); return; }

    setSubmitting(true);
    try {
      const url = state.draftId
        ? `/api/organizer/events/${state.draftId}/publish`
        : "/api/organizer/events";

      const payload = {
        title: state.title,
        categoryId: state.categoryId,
        shortDescription: state.shortDescription,
        description: state.description,
        tags: state.tags,
        startDatetime: state.startDatetime,
        endDatetime: state.endDatetime,
        timezone: state.timezone,
        venueId: state.venueId,
        customLocation: state.customLocation,
        venueLat: state.venueLat,
        venueLng: state.venueLng,
        isOnline: state.isOnline,
        onlinePlatform: state.onlinePlatform,
        onlineLink: state.onlineLink,
        ticketTypes: state.ticketTypes,
        isAgeRestricted: state.isAgeRestricted,
        bannerUrl: state.bannerUrl,
        galleryUrls: state.galleryUrls,
        videoUrl: state.videoUrl,
        publish,
        scheduledFor: !publish ? state.scheduledFor : null,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create event");
      }
      const data = await res.json();
      clearDraft();
      router.push(`/organizer/events/${state.draftId ?? data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Visual event preview card */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Preview</p>
        <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">This is how your event will appear to attendees.</p>

        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          {/* Banner */}
          {state.bannerUrl ? (
            <img
              src={state.bannerUrl}
              alt="Event banner"
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand)]/5">
              <p className="text-[13px] font-medium text-[var(--brand)]/50">No banner uploaded</p>
            </div>
          )}

          {/* Card body */}
          <div className="p-5">
            <h2 className="text-[17px] font-bold leading-snug text-[var(--text-primary)]">
              {state.title || <span className="italic text-[var(--text-tertiary)]">Event title</span>}
            </h2>

            {state.shortDescription && (
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {state.shortDescription}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {dateLabel && (
                <div className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
                  <CalendarBlank size={14} className="shrink-0 text-[var(--brand)]" weight="fill" />
                  <span>
                    {dateLabel}
                    {timeLabel && ` · ${timeLabel}`}
                    {endTimeLabel && ` – ${endTimeLabel}`}
                  </span>
                </div>
              )}
              {locationLabel && (
                <div className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
                  <MapPin size={14} className="shrink-0 text-[var(--brand)]" weight="fill" />
                  <span className="truncate">{locationLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
                <Ticket size={14} className="shrink-0 text-[var(--brand)]" weight="fill" />
                <span>{priceLabel}</span>
              </div>
            </div>

            {/* Ticket tiers pills */}
            {state.ticketTypes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {state.ticketTypes.map((t) => (
                  <span
                    key={t.name}
                    className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-2.5 py-1 text-[11px] font-medium text-[var(--brand)]"
                  >
                    {t.name} · {t.price === 0 ? "Free" : `GHS ${t.price.toLocaleString()}`}
                  </span>
                ))}
              </div>
            )}

            {/* Gallery strip */}
            {state.galleryUrls.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {state.galleryUrls.slice(0, 5).map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-xl object-cover"
                  />
                ))}
                {state.galleryUrls.length > 5 && (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[12px] font-semibold text-[var(--text-tertiary)]">
                    +{state.galleryUrls.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publishing options */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Publishing</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            className={`flex flex-col rounded-2xl border p-4 text-left transition ${
              state.publishNow
                ? "border-[var(--brand)]/40 bg-[var(--brand)]/8"
                : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--brand)]/25 hover:bg-[var(--bg-card)]"
            }`}
            type="button"
            onClick={() => setField("publishNow", true)}
          >
            <CheckCircle
              className={state.publishNow ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
              size={20}
              weight={state.publishNow ? "fill" : "regular"}
            />
            <p className="mt-2.5 text-[13px] font-semibold text-[var(--text-primary)]">Publish now</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Goes live immediately on the feed.</p>
          </button>

          <button
            className={`flex flex-col rounded-2xl border p-4 text-left transition ${
              !state.publishNow
                ? "border-[var(--brand)]/40 bg-[var(--brand)]/8"
                : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--brand)]/25 hover:bg-[var(--bg-card)]"
            }`}
            type="button"
            onClick={() => setField("publishNow", false)}
          >
            <Clock
              className={!state.publishNow ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
              size={20}
              weight={!state.publishNow ? "fill" : "regular"}
            />
            <p className="mt-2.5 text-[13px] font-semibold text-[var(--text-primary)]">Save as draft</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Saved privately until you&apos;re ready.</p>
          </button>
        </div>
      </div>

      {!state.publishNow && (
        <DateTimePicker
          label="Schedule publish date (optional)"
          placeholder="Pick when to go live…"
          value={state.scheduledFor ?? ""}
          onChange={(val) => setField("scheduledFor", val || null)}
          showTime
        />
      )}

      {error && (
        <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-400">
          {error}
        </div>
      )}

      <button
        className="w-full rounded-full bg-[var(--brand)] py-3.5 text-[14px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97] disabled:opacity-50"
        disabled={submitting || !state.title}
        type="button"
        onClick={() => submit(state.publishNow)}
      >
        {submitting ? "Creating…" : state.publishNow ? "🚀 Publish event" : "Save as draft"}
      </button>
    </div>
  );
}
