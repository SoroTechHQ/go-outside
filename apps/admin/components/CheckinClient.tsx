"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { checkInTicket } from "../app/organizer/events/[id]/checkin/actions";

type RecentScan = {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  checked_in_at: string | null;
};

type ScanResult =
  | { kind: "success"; name: string }
  | { kind: "already_checked_in"; checkedInAt: string }
  | { kind: "wrong_event" }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "error"; message: string }
  | null;

// ── Camera scanner (lazy-loaded to avoid SSR issues) ──────────────────────────

function useQrScanner(
  elementId: string,
  onResult: (decoded: string) => void,
  active: boolean,
) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (scanningRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scanningRef.current = false;
      }
      return;
    }

    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (!scanningRef.current) return;
            onResult(decoded);
          },
          () => {},
        )
        .then(() => {
          scanningRef.current = true;
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      if (scanningRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scanningRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

// ── Main component ────────────────────────────────────────────────────────────

export function CheckinClient({
  eventId,
  totalTickets,
  checkedInCount,
  initialScans,
}: {
  eventId: string;
  totalTickets: number;
  checkedInCount: number;
  initialScans: RecentScan[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [manualResult, setManualResult] = useState<{ success?: boolean; error?: string; name?: string } | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [checkedIn, setCheckedIn] = useState(checkedInCount);
  const [scans, setScans] = useState<RecentScan[]>(initialScans);
  const [cameraActive, setCameraActive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const lastScannedRef = useRef<string>("");
  const scanCooldownRef = useRef(false);

  // Track online status
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── QR scanner callback ──────────────────────────────────────────────────
  async function handleQrScan(payload: string) {
    if (scanCooldownRef.current || payload === lastScannedRef.current) return;
    lastScannedRef.current = payload;
    scanCooldownRef.current = true;

    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, eventId }),
      });
      const data = await res.json();

      if (res.status === 0 || !res.ok && data.result === undefined) {
        setIsOffline(true);
        setScanResult({ kind: "error", message: "Network error — check connection" });
        setTimeout(() => setScanResult(null), 4000);
        scanCooldownRef.current = false;
        return;
      }

      if (data.result === "ADMITTED") {
        setScanResult({ kind: "success", name: data.name });
        setCheckedIn((c) => c + 1);
        setScans((prev) => [
          { id: payload.slice(0, 8), attendee_name: data.name, attendee_email: null, checked_in_at: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]);
        setTimeout(() => {
          setScanResult(null);
          lastScannedRef.current = "";
          scanCooldownRef.current = false;
        }, 3500);
      } else if (data.result === "ALREADY_CHECKED_IN") {
        setScanResult({ kind: "already_checked_in", checkedInAt: data.checkedInAt ?? "earlier" });
        setTimeout(() => { setScanResult(null); scanCooldownRef.current = false; }, 4000);
      } else if (data.result === "WRONG_EVENT") {
        setScanResult({ kind: "wrong_event" });
        setTimeout(() => { setScanResult(null); scanCooldownRef.current = false; }, 4000);
      } else if (data.result === "EXPIRED") {
        setScanResult({ kind: "expired" });
        setTimeout(() => { setScanResult(null); scanCooldownRef.current = false; }, 4000);
      } else {
        setScanResult({ kind: "invalid" });
        setTimeout(() => { setScanResult(null); scanCooldownRef.current = false; }, 4000);
      }
    } catch {
      setIsOffline(true);
      setScanResult({ kind: "error", message: "Network error — check connection" });
      setTimeout(() => { setScanResult(null); scanCooldownRef.current = false; }, 4000);
    }
  }

  useQrScanner("qr-reader", handleQrScan, cameraActive);

  // ── Manual entry ─────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ref = inputRef.current?.value?.trim() ?? "";
    if (!ref) return;

    startTransition(async () => {
      const res = await checkInTicket(eventId, ref);
      setManualResult(res);
      if (res.success) {
        setCheckedIn((c) => c + 1);
        setScans((prev) => [
          { id: ref, attendee_name: res.name ?? null, attendee_email: null, checked_in_at: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]);
        if (inputRef.current) inputRef.current.value = "";
        setTimeout(() => setManualResult(null), 3000);
      }
    });
  }

  const pct = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

  function relTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left: scanner + manual entry ── */}
      <div className="space-y-5">

        {/* Offline banner */}
        {isOffline && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/08 px-4 py-3 text-sm font-semibold text-orange-400">
            OFFLINE MODE — Camera scan unavailable. Use manual entry below.
          </div>
        )}

        {/* QR Scanner */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          {/* Scan result overlay */}
          {scanResult && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                scanResult.kind === "success"
                  ? "border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] text-[var(--brand)]"
                  : scanResult.kind === "already_checked_in"
                  ? "border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] text-[#fb7185]"
                  : scanResult.kind === "wrong_event"
                  ? "border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] text-yellow-400"
                  : scanResult.kind === "expired"
                  ? "border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] text-[#fb7185]"
                  : "border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] text-[#fb7185]"
              }`}
            >
              {scanResult.kind === "success" && `✓ ${scanResult.name} — ADMITTED`}
              {scanResult.kind === "already_checked_in" && `Already checked in at ${scanResult.checkedInAt}`}
              {scanResult.kind === "wrong_event" && "Wrong event — ticket belongs to a different event"}
              {scanResult.kind === "expired" && "QR expired — ask attendee to refresh their ticket"}
              {scanResult.kind === "invalid" && "Invalid ticket — could not verify"}
              {scanResult.kind === "error" && scanResult.message}
            </div>
          )}

          {/* Camera viewport */}
          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-[24px] border-2 border-[var(--brand)]/30 bg-[#0e1410]">
            {/* Corner brackets */}
            <div className="absolute left-3 top-3 h-5 w-5 rounded-tl-[6px] border-l-2 border-t-2 border-[var(--neon)] pointer-events-none z-10" />
            <div className="absolute right-3 top-3 h-5 w-5 rounded-tr-[6px] border-r-2 border-t-2 border-[var(--neon)] pointer-events-none z-10" />
            <div className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-[6px] border-b-2 border-l-2 border-[var(--neon)] pointer-events-none z-10" />
            <div className="absolute bottom-3 right-3 h-5 w-5 rounded-br-[6px] border-b-2 border-r-2 border-[var(--neon)] pointer-events-none z-10" />

            {/* html5-qrcode mount point */}
            <div
              id="qr-reader"
              className={`h-full w-full ${cameraActive ? "block" : "hidden"}`}
              style={{ overflow: "hidden" }}
            />

            {/* Placeholder when camera off */}
            {!cameraActive && (
              <p className="px-8 text-center text-sm text-[var(--text-tertiary)]">
                Camera is off
                <br />
                <span className="text-[11px]">Press Start Camera below to begin scanning</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setCameraActive((v) => !v);
              setScanResult(null);
              lastScannedRef.current = "";
              scanCooldownRef.current = false;
            }}
            className={`mt-4 w-full rounded-xl px-6 py-2.5 text-sm font-semibold transition-opacity ${
              cameraActive
                ? "bg-[rgba(251,113,133,0.12)] text-[#fb7185] border border-[rgba(251,113,133,0.25)]"
                : "bg-[var(--brand)] text-[#0e1410]"
            }`}
          >
            {cameraActive ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        {/* Manual entry */}
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Manual entry
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Enter a ticket ID or attendee email address
          </p>

          {manualResult?.success && (
            <div className="mt-3 rounded-xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--brand)]">
              ✓ {manualResult.name} checked in successfully
            </div>
          )}
          {manualResult?.error && (
            <div className="mt-3 rounded-xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] px-4 py-3 text-sm text-[#fb7185]">
              {manualResult.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ticket ID or email address"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[#0e1410] transition-opacity disabled:opacity-50"
            >
              {isPending ? "Checking in…" : "Check In"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Right: progress + recent scans ── */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Check-in progress
          </p>
          <p className="mt-4 font-display text-4xl font-semibold text-[var(--text-primary)]">
            {checkedIn} / {totalTickets}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">attendees checked in</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--neon)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">{pct}% of ticket holders arrived</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Recent check-ins</h3>
          <div className="mt-4 space-y-3">
            {scans.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No check-ins yet.</p>
            ) : (
              scans.map((scan) => (
                <div
                  key={`${scan.id}-${scan.checked_in_at}`}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {scan.attendee_name ?? scan.attendee_email ?? "Attendee"}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {scan.checked_in_at ? relTime(scan.checked_in_at) : "just now"}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-[var(--status-live-border)] bg-[var(--status-live-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-live-text)]">
                    Checked in
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
