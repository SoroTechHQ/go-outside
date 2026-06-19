"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  Check,
  X,
  Warning,
  CaretDown,
  SpinnerGap,
  QrCode,
} from "@phosphor-icons/react";
import Image from "next/image";

type OrganizerEvent = {
  id: string;
  title: string;
};

type AttendeeResult = {
  name: string;
  email: string;
  ticketType: string;
  purchasePrice: number;
  currency: string;
  avatarUrl: string | null;
};

type ScanResult =
  | { result: "valid"; attendee: AttendeeResult }
  | { result: "already_used"; checked_in_at: string | null }
  | { result: "invalid"; reason: string };

type ScanState = "idle" | "scanning" | "verifying" | ScanResult;

function formatReason(reason: string): string {
  const map: Record<string, string> = {
    malformed_payload: "QR code is malformed",
    invalid_signature: "QR code signature is invalid",
    token_expired: "QR code has expired",
    nonce_not_found: "QR code has already been used",
    nonce_expired: "QR code has expired",
    nonce_mismatch: "QR code is invalid",
    wrong_event: "This ticket is for a different event",
    ticket_not_found: "Ticket not found",
    cancelled: "Ticket has been cancelled",
    refunded: "Ticket has been refunded",
  };
  return map[reason] ?? `Invalid ticket (${reason})`;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`
    : name.slice(0, 2);
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white uppercase">
      {initials}
    </div>
  );
}

export default function ScannerClient() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanCount, setScanCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    fetch("/api/organizer/dashboard/overview")
      .then((r) => r.json())
      .then((data: { recentEvents?: { id: string; title: string }[] }) => {
        const evts = (data.recentEvents ?? []).map((e) => ({ id: e.id, title: e.title }));
        setEvents(evts);
        if (evts.length > 0 && evts[0]) {
          setSelectedEventId(evts[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const verify = useCallback(
    async (payload: string) => {
      if (!selectedEventId) return;
      pausedRef.current = true;
      setScanState("verifying");

      try {
        const res = await fetch("/api/organizer/scan/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload, eventId: selectedEventId }),
        });
        const data = await res.json() as ScanResult;
        setScanState(data);
        if (data.result === "valid") {
          setScanCount((c) => c + 1);
        }
      } catch {
        setScanState({ result: "invalid", reason: "network_error" });
      }

      setTimeout(() => {
        pausedRef.current = false;
        setScanState("scanning");
      }, 3000);
    },
    [selectedEventId],
  );

  const startScanLoop = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && !pausedRef.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            void verify(code.data);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [verify],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setScanState("scanning");
      startScanLoop(video);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera unavailable";
      setCameraError(msg);
    }
  }, [startScanLoop]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const isScanning = scanState === "scanning" || scanState === "verifying";

  const overlayColor =
    typeof scanState === "object"
      ? scanState.result === "valid"
        ? "bg-[#0e6130]/90"
        : scanState.result === "already_used"
          ? "bg-orange-600/90"
          : "bg-red-700/90"
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode size={20} weight="duotone" className="text-[#0e6130]" />
            <span className="text-sm font-semibold">Ticket Scanner</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {scanCount} checked in
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
            Select Event
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0e6130] disabled:opacity-40"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={isScanning}
            >
              {events.length === 0 && (
                <option value="">Loading events...</option>
              )}
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <CaretDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
            />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black" style={{ height: "60vh" }}>
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />

          <canvas ref={canvasRef} className="hidden" />

          {!isScanning && typeof scanState !== "object" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
              {cameraError ? (
                <>
                  <Warning size={40} className="text-orange-400" />
                  <p className="max-w-[200px] text-center text-sm text-white/70">{cameraError}</p>
                  <button
                    onClick={() => void startCamera()}
                    className="rounded-xl bg-[#0e6130] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6130]/80"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <Camera size={48} weight="duotone" className="text-white/40" />
                  <button
                    onClick={() => void startCamera()}
                    disabled={!selectedEventId}
                    className="rounded-xl bg-[#0e6130] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6130]/80 disabled:opacity-40"
                  >
                    Start Scanning
                  </button>
                  {!selectedEventId && (
                    <p className="text-xs text-white/40">Select an event first</p>
                  )}
                </>
              )}
            </div>
          )}

          {scanState === "scanning" && (
            <>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-56 w-56">
                  <span className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-[#0e6130] rounded-tl-md" />
                  <span className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-[#0e6130] rounded-tr-md" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#0e6130] rounded-bl-md" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#0e6130] rounded-br-md" />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-xs text-white/60">
                Point camera at QR code
              </div>
            </>
          )}

          {scanState === "verifying" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <SpinnerGap size={36} className="animate-spin text-white/60" />
              <p className="text-sm text-white/50">Verifying...</p>
            </div>
          )}

          {typeof scanState === "object" && overlayColor && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${overlayColor} transition-all`}>
              {scanState.result === "valid" && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Check size={36} weight="bold" className="text-white" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {scanState.attendee.avatarUrl ? (
                      <Image
                        src={scanState.attendee.avatarUrl}
                        alt={scanState.attendee.name}
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-white/30"
                      />
                    ) : (
                      <Initials name={scanState.attendee.name} />
                    )}
                    <p className="text-lg font-bold text-white">{scanState.attendee.name}</p>
                    <p className="text-sm text-white/70">{scanState.attendee.ticketType}</p>
                    <p className="text-xs text-white/50">{scanState.attendee.email}</p>
                  </div>
                  <div className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white">
                    Checked In
                  </div>
                </>
              )}

              {scanState.result === "already_used" && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Warning size={36} weight="bold" className="text-white" />
                  </div>
                  <p className="text-lg font-bold text-white">Already Checked In</p>
                  {scanState.checked_in_at && (
                    <p className="text-sm text-white/70">
                      {new Date(scanState.checked_in_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </>
              )}

              {scanState.result === "invalid" && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <X size={36} weight="bold" className="text-white" />
                  </div>
                  <p className="text-lg font-bold text-white">Invalid Ticket</p>
                  <p className="text-sm text-white/70 text-center px-6">
                    {formatReason(scanState.reason)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {isScanning && (
          <button
            onClick={() => {
              stopCamera();
              setScanState("idle");
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10"
          >
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
}
