"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "../app/organizer/events/actions";

const CATEGORIES = [
  { value: "music", label: "Music" },
  { value: "arts", label: "Arts & Culture" },
  { value: "food", label: "Food & Drink" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "networking", label: "Networking" },
  { value: "comedy", label: "Comedy" },
  { value: "fashion", label: "Fashion" },
  { value: "film", label: "Film & Media" },
  { value: "tech", label: "Tech" },
  { value: "wellness", label: "Wellness" },
  { value: "entertainment", label: "Entertainment" },
  { value: "community", label: "Community" },
];

const STEPS = ["Basics", "Schedule & Venue", "Tickets", "Review & Publish"];

export function CreateEventForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; status?: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  function handlePublish() {
    submit("published");
  }

  function handleDraft() {
    submit("draft");
  }

  function submit(status: "published" | "draft") {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set("_status", status);

    startTransition(async () => {
      const res = await createEvent(formData);
      if (res?.success) {
        setResult({ success: true, status: res.status });
        setTimeout(() => router.push("/organizer/events"), 1800);
      } else {
        setResult({ error: res?.error ?? "Something went wrong." });
      }
    });
  }

  const inputCls =
    "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-3">
        {STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            onClick={() => setCurrentStep(index)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              index === currentStep
                ? "border-[var(--brand)] bg-[var(--brand)] text-[#0e1410]"
                : "border-[var(--border-card)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {index + 1}. {step}
          </button>
        ))}
      </div>

      {result?.success && (
        <div className="rounded-xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--brand)]">
          Event {result.status === "published" ? "published" : "saved as draft"} successfully. Redirecting…
        </div>
      )}
      {result?.error && (
        <div className="rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] px-4 py-3 text-sm text-[var(--accent-coral)]">
          {result.error}
        </div>
      )}

      <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-6 xl:grid-cols-[1fr,360px]">
          <div className="space-y-6">
            {/* Basics */}
            <div className={`rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 space-y-5 ${currentStep === 0 ? "" : "opacity-60"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">Basics</p>
              <div>
                <label className={labelCls}>Event title *</label>
                <input name="title" required placeholder="e.g. Accra Rooftop Sessions Vol. 4" className={`mt-1.5 ${inputCls}`} />
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className={labelCls}>Short description</label>
                  <textarea
                    name="short_description"
                    rows={3}
                    placeholder="One-line summary shown in cards"
                    className={`mt-1.5 ${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Full description</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Detailed event description"
                    className={`mt-1.5 ${inputCls} resize-none`}
                  />
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className={labelCls}>Category</label>
                  <select name="category" defaultValue="entertainment" className={`mt-1.5 ${inputCls}`}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tags (comma-separated)</label>
                  <input name="tags" placeholder="e.g. rooftop, afrobeats, accra" className={`mt-1.5 ${inputCls}`} />
                </div>
              </div>
            </div>

            {/* Schedule & Venue */}
            <div className={`rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 space-y-5 ${currentStep === 1 ? "" : "opacity-60"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-violet)]">Schedule & Venue</p>
              <div className="grid gap-5 lg:grid-cols-3">
                <div>
                  <label className={labelCls}>Date *</label>
                  <input name="date" type="date" required className={`mt-1.5 ${inputCls}`} />
                </div>
                <div>
                  <label className={labelCls}>Start time</label>
                  <input name="start_time" type="time" defaultValue="18:00" className={`mt-1.5 ${inputCls}`} />
                </div>
                <div>
                  <label className={labelCls}>End time</label>
                  <input name="end_time" type="time" defaultValue="23:00" className={`mt-1.5 ${inputCls}`} />
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className={labelCls}>Venue name</label>
                  <input name="venue" placeholder="e.g. The Rooftop, Airport City" className={`mt-1.5 ${inputCls}`} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input name="address" placeholder="e.g. 12 Liberation Rd, Accra" className={`mt-1.5 ${inputCls}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Ticket capacity */}
            <div className={`rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 space-y-4 ${currentStep === 2 ? "" : "opacity-60"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-amber)]">Tickets</p>
              <div>
                <label className={labelCls}>Total capacity</label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue="200"
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Ticket types (GA, VIP, etc.) can be added after publishing from the Events page.
              </p>
            </div>

            {/* Publish / Draft */}
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">Review & publish</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Publishing makes your event visible in the GoOutside app immediately. Save as Draft to review before going live.
              </p>
              <div className="grid gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPending || !!result?.success}
                  onClick={handlePublish}
                  className="flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[#0e1410] transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Publish now"}
                </button>
                <button
                  type="button"
                  disabled={isPending || !!result?.success}
                  onClick={handleDraft}
                  className="flex w-full items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
                >
                  Save as draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
