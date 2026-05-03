"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarBlank,
  MapPin,
  Ticket,
  Lock,
  Globe,
  Users,
  CheckCircle,
  ArrowLeft,
} from "@phosphor-icons/react";

type Step = 1 | 2 | 3;

type FormState = {
  title:          string;
  description:    string;
  start_datetime: string;
  location:       string;
  banner_url:     string;
  ticket_type:    "free" | "paid";
  ticket_price:   number;
  privacy:        "public" | "friends" | "invite";
};

const STEP_LABELS = ["Basics", "Tickets", "Privacy"];

const inputCls =
  "w-full rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--brand)]/60 focus:ring-1 focus:ring-[var(--brand)]/20";

function StepBasics({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputCls}
          placeholder="e.g. Sankofa Rooftop Sessions"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value.slice(0, 500))}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Tell people what to expect…"
        />
        <p className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">
          {form.description.length}/500
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          <CalendarBlank className="mr-1.5 inline" size={12} weight="bold" />
          Date & Time
        </label>
        <input
          type="datetime-local"
          value={form.start_datetime}
          onChange={(e) => set("start_datetime", e.target.value)}
          className={`${inputCls} [color-scheme:dark]`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          <MapPin className="mr-1.5 inline" size={12} weight="bold" />
          Location
        </label>
        <input
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          className={inputCls}
          placeholder="e.g. Labadi Beach, Accra"
        />
      </div>
    </div>
  );
}

function StepTickets({ form, set }: { form: FormState; set: (k: keyof FormState, v: string | number) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Choose how people will access your event.
      </p>

      <div className="grid gap-3">
        {(["free", "paid"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => set("ticket_type", type)}
            className={`flex items-start gap-4 rounded-[16px] border p-4 text-left transition ${
              form.ticket_type === type
                ? "border-[var(--brand)]/40 bg-[var(--brand)]/8"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--brand)]/20"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                form.ticket_type === type
                  ? "border-[var(--brand)] bg-[var(--brand)]"
                  : "border-[var(--border-card)]"
              }`}
            >
              {form.ticket_type === type && (
                <div className="h-2 w-2 rounded-full bg-black" />
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                {type === "free" ? "Free RSVP" : "Paid tickets"}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                {type === "free"
                  ? "Anyone can RSVP. Great for get-togethers and community events."
                  : "Set a ticket price in GHS. GoOutside takes 5% + Paystack fees."}
              </p>
            </div>
          </button>
        ))}
      </div>

      {form.ticket_type === "paid" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            <Ticket className="mr-1.5 inline" size={12} weight="bold" />
            Ticket Price (GHS)
          </label>
          <input
            type="number"
            min={1}
            value={form.ticket_price || ""}
            onChange={(e) => set("ticket_price", parseFloat(e.target.value) || 0)}
            className={inputCls}
            placeholder="e.g. 150"
          />
        </div>
      )}
    </div>
  );
}

function StepPrivacy({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  const options = [
    {
      value:   "public" as const,
      icon:    Globe,
      label:   "Public",
      desc:    "Shows in the feed and is discoverable by everyone.",
    },
    {
      value:   "friends" as const,
      icon:    Users,
      label:   "Friends only",
      desc:    "Visible to your followers and people you follow.",
    },
    {
      value:   "invite" as const,
      icon:    Lock,
      label:   "Invite only",
      desc:    "Only people with the link can RSVP.",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-secondary)]">
        Who should be able to see and attend this event?
      </p>

      <div className="space-y-3">
        {options.map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => set("privacy", value)}
            className={`flex w-full items-start gap-4 rounded-[16px] border p-4 text-left transition ${
              form.privacy === value
                ? "border-[var(--brand)]/40 bg-[var(--brand)]/8"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--brand)]/20"
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                form.privacy === value ? "bg-[var(--brand)]/20" : "bg-[var(--bg-elevated)]"
              }`}
            >
              <Icon
                size={16}
                weight={form.privacy === value ? "fill" : "regular"}
                className={form.privacy === value ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}
              />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{label}</p>
              <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{desc}</p>
            </div>
            {form.privacy === value && (
              <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-[var(--brand)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HostEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setFormState] = useState<FormState>({
    title:          "",
    description:    "",
    start_datetime: "",
    location:       "",
    banner_url:     "",
    ticket_type:    "free",
    ticket_price:   0,
    privacy:        "public",
  });

  function set(key: keyof FormState, value: string | number) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance() {
    if (step === 1) return form.title.trim().length > 0;
    return true;
  }

  async function handlePublish() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/events/host", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:          form.title.trim(),
          description:    form.description.trim() || null,
          start_datetime: form.start_datetime || null,
          location:       form.location.trim() || null,
          banner_url:     form.banner_url || null,
          ticket_type:    form.ticket_type,
          ticket_price:   form.ticket_type === "paid" ? form.ticket_price : 0,
          privacy:        form.privacy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create event");
      router.push(`/events/${data.slug}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </p>
            <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
              {step === 1 && "What's the event?"}
              {step === 2 && "How do people get in?"}
              {step === 3 && "Who can see it?"}
            </h1>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-4 flex gap-1.5">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 bg-[var(--brand)]"
                  : s < step
                  ? "w-4 bg-[var(--brand)]/50"
                  : "w-4 bg-[var(--bg-muted)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
        {step === 1 && <StepBasics form={form} set={set} />}
        {step === 2 && <StepTickets form={form} set={set} />}
        {step === 3 && <StepPrivacy form={form} set={set} />}
      </div>

      {error && (
        <p className="mt-3 rounded-[12px] border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-500">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[13px] text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
          >
            Cancel
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-[13px] font-bold text-black transition hover:bg-[#4fa824] disabled:opacity-40 active:scale-[0.97]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting || !form.title.trim()}
            onClick={handlePublish}
            className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-[13px] font-bold text-black transition hover:bg-[#4fa824] disabled:opacity-40 active:scale-[0.97]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Creating…
              </span>
            ) : (
              form.privacy === "public" ? "Publish Event" : "Create Event"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
