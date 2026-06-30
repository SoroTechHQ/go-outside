"use client";

import { useState } from "react";

type Result = { deleted: { events: number; organizers: number; users: number } };

export function PurgeSeedButton() {
  const [status, setStatus] = useState<"idle" | "confirming" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePurge() {
    setStatus("running");
    try {
      const res = await fetch("/api/admin/purge-seed-data", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unknown error");
      setResult(json);
      setStatus("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  if (status === "done" && result) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
        <span className="font-semibold">Seed data purged.</span>
        <span className="text-emerald-400/70">
          {result.deleted.events} events · {result.deleted.users} users · {result.deleted.organizers} organizers deleted
        </span>
        <button
          onClick={() => { setStatus("idle"); setResult(null); window.location.reload(); }}
          className="ml-2 rounded px-2 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
        <span className="font-semibold">Failed:</span>
        <span className="text-rose-400/70">{errorMsg}</span>
        <button
          onClick={() => setStatus("idle")}
          className="ml-2 rounded px-2 py-0.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/20 transition"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (status === "confirming") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5">
        <p className="text-sm text-rose-300">
          This will permanently delete all seeded events, users, and organizers. Real events are untouched.
        </p>
        <button
          onClick={handlePurge}
          className="rounded-lg bg-rose-600 px-4 py-1.5 text-[12px] font-bold text-white transition hover:bg-rose-500"
        >
          Yes, delete seed data
        </button>
        <button
          onClick={() => setStatus("idle")}
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStatus("confirming")}
      disabled={status === "running"}
      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-[12px] font-bold text-rose-400 transition hover:border-rose-500/70 hover:bg-rose-500/20 disabled:opacity-50"
    >
      {status === "running" ? "Purging…" : "Purge seed data"}
    </button>
  );
}
