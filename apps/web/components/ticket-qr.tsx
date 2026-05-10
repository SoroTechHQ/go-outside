"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// ── Static past-ticket display (greyed out, no fetch) ─────────────────────────

export function TicketQrStatic({ reference }: { reference: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--border-card)] bg-white p-5 shadow-[0_14px_32px_rgba(0,0,0,0.18)] opacity-40 grayscale">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#081008"
        includeMargin
        level="M"
        size={220}
        value={`gooutside-ticket:${reference}`}
      />
    </div>
  );
}

// ── Live rotating QR (active tickets only) ────────────────────────────────────

type QrState =
  | { phase: "loading" }
  | { phase: "ready"; payload: string }
  | { phase: "checked_in" }
  | { phase: "error" };

export function LiveTicketQR({ ticketId }: { ticketId: string }) {
  const [state, setState] = useState<QrState>({ phase: "loading" });
  const [countdown, setCountdown] = useState(30);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchPayload() {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/qr-token`, {
        credentials: "include",
      });
      if (res.status === 400) {
        setState({ phase: "checked_in" });
        clearInterval(refreshRef.current!);
        clearInterval(countRef.current!);
        return;
      }
      if (!res.ok) {
        setState({ phase: "error" });
        return;
      }
      const { payload } = (await res.json()) as { payload: string };
      setState({ phase: "ready", payload });
      setCountdown(30);
    } catch {
      setState({ phase: "error" });
    }
  }

  useEffect(() => {
    fetchPayload();
    refreshRef.current = setInterval(fetchPayload, 30_000);
    countRef.current = setInterval(
      () => setCountdown((c) => (c > 1 ? c - 1 : 30)),
      1_000,
    );
    return () => {
      clearInterval(refreshRef.current!);
      clearInterval(countRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // ── Checked in ──
  if (state.phase === "checked_in") {
    return (
      <div className="flex h-[230px] w-[230px] flex-col items-center justify-center gap-3 rounded-[28px] border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.06)] p-5">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="22" fill="rgba(74,222,128,0.15)" />
          <path d="M13 22.5L19.5 29L31 16" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-center text-[11px] font-semibold leading-snug text-[#4ade80]">
          Checked In
          <br />
          <span className="font-normal text-[#86efac]">Enjoy the event!</span>
        </p>
      </div>
    );
  }

  // ── Loading ──
  if (state.phase === "loading") {
    return (
      <div className="flex h-[230px] w-[230px] items-center justify-center rounded-[28px] border border-[var(--border-card)] bg-white p-5 shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--brand)]" />
      </div>
    );
  }

  // ── Error ──
  if (state.phase === "error") {
    return (
      <div className="flex h-[230px] w-[230px] flex-col items-center justify-center gap-3 rounded-[28px] border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.06)] p-5">
        <p className="text-center text-[11px] font-semibold text-[#fb7185]">
          Could not load QR
        </p>
        <button
          onClick={fetchPayload}
          className="rounded-full border border-[rgba(251,113,133,0.3)] px-3 py-1 text-[10px] font-semibold text-[#fb7185] transition hover:bg-[rgba(251,113,133,0.08)]"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Ready ──
  return (
    <div className="relative rounded-[28px] border border-[var(--border-card)] bg-white p-5 shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#081008"
        includeMargin
        level="H"
        size={220}
        value={state.payload}
      />

      {/* Sweep bar animation */}
      <div className="pointer-events-none absolute inset-5 overflow-hidden rounded-[18px]">
        <div className="sweep-bar" />
      </div>

      {/* Countdown pill */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(14,20,16,0.75)] px-3 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
        {countdown}s
      </div>
    </div>
  );
}
