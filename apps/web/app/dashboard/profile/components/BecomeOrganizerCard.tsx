"use client";

import { useState } from "react";
import { Megaphone, ArrowRight, SpinnerGap, CheckCircle } from "@phosphor-icons/react";

export function BecomeOrganizerCard() {
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "approved">("idle");

  async function handleApply() {
    setStatus("loading");
    try {
      const res = await fetch("/api/account/become-organizer", { method: "POST" });
      const json = await res.json() as { ok: boolean; pending?: boolean };
      if (json.ok) {
        setStatus(json.pending ? "pending" : "approved");
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
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
            Our team will review your request. You'll be notified when it's approved.
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
          <p className="text-[14px] font-bold text-[var(--brand)]">You're an organizer!</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            Head to your organizer dashboard to create your first event.
          </p>
        </div>
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
        onClick={handleApply}
        disabled={status === "loading"}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-[var(--brand-hover)] active:scale-[0.97] disabled:opacity-60"
        type="button"
      >
        {status === "loading" ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <>Apply <ArrowRight size={12} weight="bold" /></>
        )}
      </button>
    </div>
  );
}
