"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  CheckCircle,
  Confetti,
  Eye,
  Globe,
  Lock,
  RocketLaunch,
  Warning,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ReadinessChecks = {
  hasTitle: boolean;
  hasDescription: boolean;
  hasBanner: boolean;
  hasTickets: boolean;
  hasDate: boolean;
};

type EventSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

const CHECKS = [
  { key: "hasTitle" as keyof ReadinessChecks, label: "Event title", critical: true },
  { key: "hasDate" as keyof ReadinessChecks, label: "Date and time", critical: true },
  { key: "hasTickets" as keyof ReadinessChecks, label: "At least one active ticket type", critical: true },
  { key: "hasDescription" as keyof ReadinessChecks, label: "Event description", critical: false },
  { key: "hasBanner" as keyof ReadinessChecks, label: "Cover image", critical: false },
];

export function PublishClient({
  event,
  category,
  readiness,
  tags: initialTags,
}: {
  event: EventSummary;
  category: string | null;
  readiness: ReadinessChecks;
  tags: string[];
}) {
  const router = useRouter();
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(event.status === "published");

  const criticalFails = CHECKS.filter((c) => c.critical && !readiness[c.key]);
  const canPublish = criticalFails.length === 0;

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagInput("");
    }
  }

  async function handlePublish() {
    if (!canPublish) return;
    setIsPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/organizer/events/${event.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, tags }),
      });
      if (!res.ok) throw new Error("Publish failed");
      setPublished(true);
    } catch {
      setError("Failed to publish. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--brand)]/10"
        >
          <Confetti size={40} weight="fill" className="text-[var(--brand)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <h1 className="text-[1.8rem] font-bold tracking-tight text-[var(--text-primary)]">
            {event.title} is live!
          </h1>
          <p className="mt-2 max-w-[360px] text-[14px] text-[var(--text-secondary)]">
            Your event is now visible to everyone on GoOutside. Share the link to start selling tickets.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(47,143,69,0.28)] transition hover:opacity-90"
          >
            <ArrowSquareOut size={16} />
            View live event
          </Link>
          <Link
            href={`/organizer/events/${event.id}`}
            className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-6 py-3 text-[14px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            Go to dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 md:px-7 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Step 3</p>
        <h2 className="mt-0.5 text-[1.5rem] font-bold tracking-tight text-[var(--text-primary)]">Publish event</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Review your event, set visibility, and go live.
        </p>
      </div>

      {/* Readiness checklist */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <CheckCircle size={16} weight="fill" className={canPublish ? "text-[var(--brand)]" : "text-amber-500"} />
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Readiness check</p>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {CHECKS.map((c) => {
            const ok = readiness[c.key];
            return (
              <div key={c.key} className="flex items-center gap-3 px-5 py-3">
                {ok ? (
                  <CheckCircle size={16} weight="fill" className="shrink-0 text-[var(--brand)]" />
                ) : c.critical ? (
                  <X size={16} weight="bold" className="shrink-0 text-red-500" />
                ) : (
                  <Warning size={16} weight="fill" className="shrink-0 text-amber-500" />
                )}
                <span className={`text-[13px] ${ok ? "text-[var(--text-primary)]" : c.critical ? "text-red-500" : "text-amber-600"}`}>
                  {c.label}
                  {!ok && c.critical && <span className="ml-1 font-semibold">(required)</span>}
                </span>
                {!ok && (
                  <span className="ml-auto text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--brand)] cursor-pointer transition">
                    Fix →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Visibility */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-5 py-4">
          <Eye size={16} weight="fill" className="text-[var(--brand)]" />
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Visibility</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          {([
            { key: "public" as const, label: "Public", desc: "Discoverable to all GoOutside users", icon: Globe },
            { key: "private" as const, label: "Private", desc: "Only people with the link can find it", icon: Lock },
          ]).map(({ key, label, desc, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setVisibility(key)}
              className={`relative flex flex-col items-start gap-2 rounded-[16px] border p-4 text-left transition ${
                visibility === key
                  ? "border-[var(--brand)] bg-[var(--brand)]/5"
                  : "border-[var(--border-subtle)] hover:border-[var(--brand)]/25"
              }`}
            >
              <Icon size={18} weight={visibility === key ? "fill" : "regular"} className={visibility === key ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"} />
              <div>
                <p className={`text-[13px] font-semibold ${visibility === key ? "text-[var(--brand)]" : "text-[var(--text-primary)]"}`}>{label}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-tertiary)]">{desc}</p>
              </div>
              {visibility === key && (
                <motion.div
                  layoutId="vis-check"
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)]"
                >
                  <Check size={10} weight="bold" className="text-white" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Tags summary */}
      <section className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-[0_2px_12px_rgba(5,12,8,0.05)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Tags</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">Improve search discoverability</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[12px] font-medium text-[var(--brand)]">
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500">
                  <X size={10} weight="bold" />
                </button>
              </span>
            ))}
            <input
              className="min-w-[120px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              placeholder="Add tag…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>
        </div>
      </section>

      {/* Preview link */}
      <div className="flex items-center gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
        <Eye size={14} className="text-[var(--text-tertiary)]" />
        <p className="text-[12px] text-[var(--text-secondary)]">Preview how your event looks before publishing</p>
        <Link
          href={`/events/${event.slug}`}
          target="_blank"
          className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[var(--brand)] hover:opacity-70 transition"
        >
          Preview <ArrowSquareOut size={12} />
        </Link>
      </div>

      {/* Error */}
      {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-[13px] text-red-500">{error}</p>}

      {/* Blocking message */}
      <AnimatePresence>
        {!canPublish && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-[16px] bg-amber-500/10 px-4 py-3.5"
          >
            <Warning size={16} className="mt-0.5 shrink-0 text-amber-500" weight="fill" />
            <p className="text-[13px] text-amber-700 dark:text-amber-400">
              Please complete the required items above before publishing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
        <Link
          href={`/organizer/events/${event.id}/tickets`}
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={14} weight="bold" /> Tickets
        </Link>
        <motion.button
          type="button"
          disabled={!canPublish || isPublishing}
          whileTap={{ scale: canPublish ? 0.97 : 1 }}
          onClick={handlePublish}
          className={`flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold transition ${
            canPublish
              ? "bg-[var(--brand)] text-white shadow-[0_4px_14px_rgba(47,143,69,0.28)] hover:opacity-90"
              : "cursor-not-allowed bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
          } disabled:opacity-60`}
        >
          {isPublishing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <RocketLaunch size={16} weight="fill" />
          )}
          {event.status === "published" ? "Update event" : "Publish event"}
        </motion.button>
      </div>
    </div>
  );
}
