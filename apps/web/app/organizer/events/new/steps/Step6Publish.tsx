"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarBlank, CheckCircle, Clock } from "@phosphor-icons/react";
import { useWizard } from "../WizardContext";
import { DateTimePicker } from "../../../../../components/ui/DateTimePicker";

export function Step6Publish() {
  const { state, setField } = useWizard();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summaryItems = [
    { label: "Title", value: state.title || "—" },
    {
      label: "Date",
      value: state.startDatetime
        ? new Date(state.startDatetime).toLocaleDateString("en-GH", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "—",
    },
    {
      label: "Location",
      value: state.isOnline
        ? "Online"
        : state.customLocation ?? (state.venueId ? "Venue selected" : "—"),
    },
    {
      label: "Tickets",
      value:
        state.ticketTypes.length === 0
          ? "No tiers added"
          : state.ticketTypes.map((t) => `${t.name} (${t.price === 0 ? "Free" : `GHS ${t.price}`})`).join(", "),
    },
    { label: "Banner", value: state.bannerUrl ? "Uploaded" : "Not set" },
  ];

  async function submit(publish: boolean) {
    setError(null);

    // Client-side validation before hitting the API
    if (!state.title?.trim()) { setError("Event title is required."); return; }
    if (!state.startDatetime)  { setError("Start date and time are required."); return; }
    if (!state.categoryId)     { setError("Please select an event category."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/organizer/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          categoryId: state.categoryId,
          shortDescription: state.shortDescription,
          tags: state.tags,
          startDatetime: state.startDatetime,
          endDatetime: state.endDatetime,
          timezone: state.timezone,
          venueId: state.venueId,
          customLocation: state.customLocation,
          isOnline: state.isOnline,
          onlineLink: (state as Record<string, unknown>).onlineLink ?? null,
          ticketTypes: state.ticketTypes,
          bannerUrl: state.bannerUrl,
          galleryUrls: state.galleryUrls,
          videoUrl: state.videoUrl,
          publish,
          scheduledFor: !publish ? state.scheduledFor : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create event");
      }
      const data = await res.json();
      router.push(`/organizer/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Summary
        </p>
        <div className="mt-4 space-y-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 rounded-[12px] bg-[var(--bg-card)] px-4 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {item.label}
              </p>
              <p className="text-right text-[13px] text-[var(--text-primary)]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Publishing
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            className={`flex flex-col rounded-[16px] border p-4 text-left transition ${
              state.publishNow
                ? "border-[var(--brand)]/40 bg-[var(--brand)]/8"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--brand)]/25"
            }`}
            type="button"
            onClick={() => setField("publishNow", true)}
          >
            <CheckCircle
              className={state.publishNow ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
              size={20}
              weight={state.publishNow ? "fill" : "regular"}
            />
            <p className="mt-2 text-[13px] font-semibold text-[var(--text-primary)]">Publish now</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              Goes live immediately on the feed.
            </p>
          </button>

          <button
            className={`flex flex-col rounded-[16px] border p-4 text-left transition ${
              !state.publishNow
                ? "border-[var(--brand)]/40 bg-[var(--brand)]/8"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--brand)]/25"
            }`}
            type="button"
            onClick={() => setField("publishNow", false)}
          >
            <Clock
              className={!state.publishNow ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
              size={20}
              weight={!state.publishNow ? "fill" : "regular"}
            />
            <p className="mt-2 text-[13px] font-semibold text-[var(--text-primary)]">Save as draft</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              Saved privately until you&apos;re ready.
            </p>
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
        <div className="rounded-[14px] bg-rose-500/10 px-4 py-3 text-[13px] text-rose-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 rounded-full bg-[var(--brand)] py-3 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97] disabled:opacity-50"
          disabled={submitting || !state.title}
          type="button"
          onClick={() => submit(state.publishNow)}
        >
          {submitting ? "Creating…" : state.publishNow ? "Publish event" : "Save draft"}
        </button>
      </div>
    </div>
  );
}
