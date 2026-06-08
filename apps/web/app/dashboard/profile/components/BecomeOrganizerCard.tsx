"use client";

import { useRef, useState } from "react";
import { Megaphone, ArrowRight, SpinnerGap, CheckCircle, X } from "@phosphor-icons/react";

export function BecomeOrganizerCard() {
  const [status, setStatus] = useState<"idle" | "form" | "loading" | "pending" | "approved">("idle");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function openForm() {
    setStatus("form");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSubmit() {
    const name = orgName.trim();
    if (!name) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/account/become-organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_name: name }),
      });
      const json = await res.json() as { ok: boolean; pending?: boolean; error?: string };
      if (json.ok) {
        setStatus(json.pending ? "pending" : "approved");
      } else {
        setError(json.error ?? "Something went wrong. Please try again.");
        setStatus("form");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("form");
    }
  }

  if (status === "pending") {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <SpinnerGap size={20} className="text-amber-600" weight="bold" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-amber-800">Application submitted</p>
          <p className="mt-0.5 text-[12px] text-amber-700">
            Our team will review your request. You&apos;ll be notified when it&apos;s approved.
          </p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-dim)] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10">
          <CheckCircle size={20} className="text-[var(--brand)]" weight="fill" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-[var(--brand)]">You&apos;re an organizer!</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            Head to your organizer dashboard to create your first event.
          </p>
        </div>
      </div>
    );
  }

  if (status === "form" || status === "loading") {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-[var(--brand)]" weight="fill" />
            <p className="text-[13px] font-bold text-[var(--text-primary)]">Become an organizer</p>
          </div>
          <button
            onClick={() => { setStatus("idle"); setOrgName(""); setError(null); }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
            type="button"
          >
            <X size={12} />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Organization name <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Sankofa Sessions"
            disabled={status === "loading"}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30 disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={status === "loading" || !orgName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.98] disabled:opacity-50"
          type="button"
        >
          {status === "loading" ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>Apply <ArrowRight size={13} weight="bold" /></>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-dim)]">
        <Megaphone size={20} className="text-[var(--brand)]" weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[var(--text-primary)]">Become an organizer</p>
        <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
          Create and sell tickets for your own events on GoOutside.
        </p>
      </div>
      <button
        onClick={openForm}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.97]"
        type="button"
      >
        Apply <ArrowRight size={12} weight="bold" />
      </button>
    </div>
  );
}
