"use client";

import { useRef, useState, useTransition } from "react";
import { sendBroadcast } from "../app/broadcasts/actions";
import { MiniPill } from "./dashboard-primitives";

const TEMPLATES = [
  {
    label: "Weekend picks",
    title: "Weekend picks are live 🎉",
    body: "Your weekend just got better — rooftop sessions, food pop-ups, and live shows are all live now. Discover what's happening near you this weekend.",
  },
  {
    label: "New event alert",
    title: "New events just dropped in your city",
    body: "Fresh events have been added to GoOutside. Browse the latest listings and grab your tickets before they sell out.",
  },
  {
    label: "Pulse reward",
    title: "You've earned Pulse Points!",
    body: "Congrats — your recent activity earned you bonus Pulse Points. Head to your Wallet to see your updated balance and available rewards.",
  },
  {
    label: "Platform update",
    title: "GoOutside has new features",
    body: "We've been building. Check out what's new on GoOutside — updated discovery, better event pages, and more ways to connect with your city.",
  },
];

const DRAFT_KEY = "gooutside-admin-notification-draft";

export function NotificationComposer() {
  const formRef = useRef<HTMLFormElement>(null);
  const [charCount, setCharCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  function applyTemplate(tpl: (typeof TEMPLATES)[0]) {
    if (!formRef.current) return;
    const form = formRef.current;
    (form.elements.namedItem("title") as HTMLInputElement).value = tpl.title;
    (form.elements.namedItem("body") as HTMLTextAreaElement).value = tpl.body;
    setCharCount(tpl.body.length);
    setShowTemplates(false);
  }

  function saveDraft() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const draft = {
      title: fd.get("title"),
      body: fd.get("body"),
      audience: fd.get("audience"),
      channel: fd.get("channel"),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await sendBroadcast(formData);
      setResult(res ?? { success: true });
      if (res?.success) {
        formRef.current?.reset();
        setCharCount(0);
        localStorage.removeItem(DRAFT_KEY);
      }
    });
  }

  return (
    <div>
      {result?.success && (
        <div className="mb-4 rounded-xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--brand)]">
          Broadcast sent to {result.count} user{result.count !== 1 ? "s" : ""} successfully.
        </div>
      )}
      {result?.error && (
        <div className="mb-4 rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] px-4 py-3 text-sm text-[var(--accent-coral)]">
          {result.error}
        </div>
      )}
      {draftSaved && (
        <div className="mb-4 rounded-xl border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.08)] px-4 py-3 text-sm text-[var(--accent-violet)]">
          Draft saved locally. It will be here when you return.
        </div>
      )}

      {showTemplates && (
        <div className="mb-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Message templates
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-left transition hover:border-[var(--brand)]/30 hover:bg-[var(--bg-card-alt)]"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{tpl.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)] line-clamp-2">{tpl.body}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Campaign title
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Weekend picks are live"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Audience
            </label>
            <select
              name="audience"
              defaultValue="all"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            >
              <option value="all">All active users</option>
              <option value="attendees">Attendees only</option>
              <option value="organizers">Organizers only</option>
              <option value="city:Accra">City — Accra</option>
              <option value="city:Kumasi">City — Kumasi</option>
              <option value="city:Takoradi">City — Takoradi</option>
              <option value="city:Cape Coast">City — Cape Coast</option>
              <option value="tier:newcomer">Tier — Newcomer</option>
              <option value="tier:regular">Tier — Regular</option>
              <option value="tier:enthusiast">Tier — Enthusiast</option>
              <option value="tier:vip">Tier — VIP</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Channel
            </label>
            <select
              name="channel"
              defaultValue="in_app"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            >
              <option value="in_app">In-app notification</option>
              <option value="push">Push notification</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            <span>Message body</span>
            <span className={charCount > 450 ? "text-[var(--accent-coral)]" : ""}>{charCount}/500</span>
          </label>
          <textarea
            name="body"
            required
            maxLength={500}
            rows={5}
            placeholder="Write your message here…"
            onChange={(e) => setCharCount(e.target.value.length)}
            className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[#08110b] transition-opacity disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Send now"}
          </button>
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)]"
          >
            {showTemplates ? "Hide templates" : "Preview templates"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)]"
          >
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}
