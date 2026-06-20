"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowsOut, X } from "@phosphor-icons/react";

// ── Static past-ticket display (greyed out, no fetch) ─────────────────────────

export function TicketQrStatic({ reference }: { reference: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border-card)] bg-white p-4 shadow-[0_14px_32px_rgba(0,0,0,0.18)] opacity-40 grayscale">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#081008"
        includeMargin
        level="M"
        size={180}
        value={`gooutside-ticket:${reference}`}
      />
    </div>
  );
}

// ── Shared QR fetch hook ───────────────────────────────────────────────────────

type QrState =
  | { phase: "loading" }
  | { phase: "ready"; payload: string }
  | { phase: "checked_in" }
  | { phase: "error" };

function useQrToken(ticketId: string) {
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

  return { state, countdown, retry: fetchPayload };
}

// ── Live rotating QR — compact card size ──────────────────────────────────────

export function LiveTicketQR({ ticketId }: { ticketId: string }) {
  const { state, countdown, retry } = useQrToken(ticketId);

  if (state.phase === "checked_in") {
    return (
      <div className="flex h-[196px] w-[196px] flex-col items-center justify-center gap-3 rounded-[20px] border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.06)] p-4">
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

  if (state.phase === "loading") {
    return (
      <div className="flex h-[196px] w-[196px] items-center justify-center rounded-[20px] border border-[var(--border-card)] bg-white p-4 shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--brand)]" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex h-[196px] w-[196px] flex-col items-center justify-center gap-3 rounded-[20px] border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.06)] p-4">
        <p className="text-center text-[11px] font-semibold text-[#fb7185]">
          Could not load QR
        </p>
        <button
          onClick={retry}
          className="rounded-full border border-[rgba(251,113,133,0.3)] px-3 py-1 text-[10px] font-semibold text-[#fb7185] transition hover:bg-[rgba(251,113,133,0.08)]"
        >
          Retry
        </button>
      </div>
    );
  }

  // ready
  return (
    <div className="relative rounded-[20px] border border-[var(--border-card)] bg-white p-4 shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
      <QRCodeSVG
        bgColor="#ffffff"
        fgColor="#081008"
        includeMargin
        level="H"
        size={180}
        value={state.payload}
      />
      <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-[14px]">
        <div className="sweep-bar" />
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(14,20,16,0.75)] px-3 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
        {countdown}s
      </div>
    </div>
  );
}

// ── Fullscreen QR modal ────────────────────────────────────────────────────────

function FullscreenQRModal({
  ticketId,
  eventTitle,
  onClose,
}: {
  ticketId: string;
  eventTitle: string;
  onClose: () => void;
}) {
  const { state, countdown, retry } = useQrToken(ticketId);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const qrSize = Math.min(typeof window !== "undefined" ? window.innerWidth - 80 : 280, 320);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="qr-backdrop"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{ background: "rgba(4, 10, 6, 0.92)", backdropFilter: "blur(18px)" }}
      >
        {/* Card */}
        <motion.div
          key="qr-card"
          className="relative flex flex-col items-center gap-5 rounded-[32px] p-7"
          initial={{ scale: 0.4, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 40, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 340,
            damping: 26,
            mass: 0.9,
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(145deg, rgba(18,30,20,0.95), rgba(10,18,12,0.98))",
            border: "1px solid rgba(47,143,69,0.25)",
            boxShadow: "0 0 0 1px rgba(47,143,69,0.08), 0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(47,143,69,0.12)",
          }}
        >
          {/* Glow ring behind QR */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[32px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            style={{
              background: "radial-gradient(ellipse at 50% 60%, rgba(47,143,69,0.15), transparent 70%)",
            }}
          />

          {/* Event label */}
          <motion.p
            className="relative text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(47,143,69,0.9)]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
          >
            {eventTitle}
          </motion.p>

          {/* QR code */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
          >
            {state.phase === "loading" && (
              <div
                className="flex items-center justify-center rounded-[20px] bg-white"
                style={{ width: qrSize + 32, height: qrSize + 32 }}
              >
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#0e6130]" />
              </div>
            )}

            {state.phase === "error" && (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.05)]"
                style={{ width: qrSize + 32, height: qrSize + 32 }}
              >
                <p className="text-sm font-semibold text-[#fb7185]">Could not load QR</p>
                <button
                  onClick={retry}
                  className="rounded-full border border-[rgba(251,113,133,0.3)] px-4 py-1.5 text-xs font-semibold text-[#fb7185]"
                >
                  Retry
                </button>
              </div>
            )}

            {state.phase === "checked_in" && (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.06)]"
                style={{ width: qrSize + 32, height: qrSize + 32 }}
              >
                <svg width="56" height="56" viewBox="0 0 44 44" fill="none">
                  <circle cx="22" cy="22" r="22" fill="rgba(74,222,128,0.15)" />
                  <path d="M13 22.5L19.5 29L31 16" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-semibold text-[#4ade80]">Checked In</p>
              </div>
            )}

            {state.phase === "ready" && (
              <div className="relative rounded-[20px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                <QRCodeSVG
                  bgColor="#ffffff"
                  fgColor="#081008"
                  includeMargin
                  level="H"
                  size={qrSize}
                  value={state.payload}
                />
                <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-[14px]">
                  <div className="sweep-bar" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Countdown + label */}
          {state.phase === "ready" && (
            <motion.div
              className="relative flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="rounded-full bg-[rgba(47,143,69,0.15)] px-4 py-1.5 text-[11px] font-semibold tabular-nums text-[rgba(47,143,69,0.9)]">
                Refreshes in {countdown}s
              </div>
              <p className="text-[10px] text-[rgba(255,255,255,0.3)]">Present this to the gate scanner</p>
            </motion.div>
          )}
        </motion.div>

        {/* Close pill */}
        <motion.button
          className="mt-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white/70 backdrop-blur-sm transition hover:bg-white/12 hover:text-white"
          onClick={onClose}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.28 }}
          aria-label="Close"
        >
          <X size={16} weight="bold" />
          Close
        </motion.button>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// ── Expand QR button — drop this into the actions section ─────────────────────

export function ExpandQRButton({
  ticketId,
  eventTitle,
}: {
  ticketId: string;
  eventTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
      >
        <ArrowsOut size={17} />
        Expand QR
      </button>

      {open && (
        <FullscreenQRModal
          ticketId={ticketId}
          eventTitle={eventTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
