"use client";

import { useState, useEffect, useCallback } from "react";
import { DatabaseIcon, TrashIcon, ArrowClockwiseIcon, LockKeyIcon, CheckCircleIcon, WarningCircleIcon, CircleNotchIcon } from "@phosphor-icons/react";

type Status = {
  seeded: boolean;
  counts: {
    users: number;
    orgProfiles: number;
    venues: number;
    events: number;
    ticketTypes: number;
    follows: number;
    graphEdges: number;
  };
};

export default function SeedPage() {
  const [password, setPassword]         = useState("");
  const [authed, setAuthed]             = useState(false);
  const [authError, setAuthError]       = useState(false);
  const [status, setStatus]             = useState<Status | null>(null);
  const [loading, setLoading]           = useState<"status" | "seed" | "teardown" | null>(null);
  const [result, setResult]             = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmTeardown, setConfirmTeardown] = useState(false);

  const fetchStatus = useCallback(async (pw: string) => {
    setLoading("status");
    setResult(null);
    try {
      const res = await fetch("/api/seed", {
        headers: { "x-seed-password": pw },
      });
      if (res.status === 401) { setAuthError(true); setAuthed(false); return; }
      const data = await res.json();
      setStatus(data);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    const res = await fetch("/api/seed", {
      headers: { "x-seed-password": password },
    });
    if (res.status === 401) { setAuthError(true); return; }
    setAuthed(true);
    const data = await res.json();
    setStatus(data);
  };

  const runAction = async (action: "seed" | "teardown") => {
    setLoading(action);
    setResult(null);
    setConfirmTeardown(false);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, password }),
      });
      const data = await res.json();
      setResult({ ok: data.ok, message: data.message });
      await fetchStatus(password);
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 mb-4">
              <DatabaseIcon size={24} className="text-white" />
            </div>
            <h1 className="text-white text-xl font-semibold">Seed Manager</h1>
            <p className="text-white/40 text-sm mt-1">GoOutside dev tool</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            <div className="relative">
              <LockKeyIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className={`w-full bg-white/5 border rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/40 transition-colors ${
                  authError ? "border-red-500/60" : "border-white/10"
                }`}
              />
            </div>
            {authError && (
              <p className="text-red-400 text-xs text-center">Incorrect password</p>
            )}
            <button
              type="submit"
              className="w-full bg-white text-black font-medium rounded-xl py-3 text-sm hover:bg-white/90 transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────
  const seeded = status?.seeded ?? false;
  const c = status?.counts;

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 mb-3">
            <DatabaseIcon size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold">Seed Manager</h1>
          <p className="text-white/40 text-sm mt-1">GoOutside dev tool</p>
        </div>

        {/* Status card */}
        <div className={`rounded-2xl border p-5 transition-colors ${
          seeded
            ? "border-green-500/30 bg-green-500/5"
            : "border-white/10 bg-white/5"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {seeded ? (
                <CheckCircleIcon size={18} className="text-green-400" weight="fill" />
              ) : (
                <WarningCircleIcon size={18} className="text-white/30" weight="fill" />
              )}
              <span className="font-medium text-sm">
                {seeded ? "Database seeded" : "Database empty"}
              </span>
            </div>
            <button
              onClick={() => fetchStatus(password)}
              disabled={isLoading}
              className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
            >
              <ArrowClockwiseIcon
                size={16}
                className={loading === "status" ? "animate-spin" : ""}
              />
            </button>
          </div>

          {c && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Users",        c.users,      "/ 50"],
                ["Organizers",   c.orgProfiles,"/ 10"],
                ["Venues",       c.venues,     "/ 15"],
                ["Events",       c.events,     "/ 20"],
                ["Ticket types", c.ticketTypes,"/ 55"],
                ["Follows",      c.follows,    ""],
                ["Graph edges",  c.graphEdges, ""],
              ].map(([label, val, expected]) => (
                <div
                  key={label as string}
                  className="flex justify-between bg-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-white/40">{label}</span>
                  <span className={val === 0 ? "text-white/30" : "text-white font-medium"}>
                    {val}
                    {expected ? <span className="text-white/20 font-normal"> {expected}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result banner */}
        {result && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
            result.ok
              ? "bg-green-500/10 border border-green-500/20 text-green-300"
              : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}>
            {result.ok
              ? <CheckCircleIcon size={16} weight="fill" className="shrink-0" />
              : <WarningCircleIcon size={16} weight="fill" className="shrink-0" />
            }
            {result.message}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Seed */}
          <button
            onClick={() => runAction("seed")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium rounded-xl py-3.5 text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === "seed" ? (
              <CircleNotchIcon size={16} className="animate-spin" />
            ) : (
              <DatabaseIcon size={16} />
            )}
            {loading === "seed" ? "Seeding…" : seeded ? "Re-seed database" : "Seed database"}
          </button>

          {/* Teardown — two-step confirm */}
          {!confirmTeardown ? (
            <button
              onClick={() => setConfirmTeardown(true)}
              disabled={isLoading || !seeded}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 font-medium rounded-xl py-3.5 text-sm hover:bg-red-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <TrashIcon size={16} />
              Teardown database
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
              <p className="text-sm text-red-300 text-center">
                This removes all 50 users, 20 events, and all related data. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmTeardown(false)}
                  className="flex-1 bg-white/10 text-white font-medium rounded-xl py-2.5 text-sm hover:bg-white/15 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => runAction("teardown")}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-medium rounded-xl py-2.5 text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {loading === "teardown" ? (
                    <CircleNotchIcon size={14} className="animate-spin" />
                  ) : (
                    <TrashIcon size={14} />
                  )}
                  {loading === "teardown" ? "Removing…" : "Yes, remove all"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs pt-2">
          All seed records use the <code className="text-white/30">dd000</code> UUID prefix.
          Safe to remove before launch.
        </p>
      </div>
    </div>
  );
}
