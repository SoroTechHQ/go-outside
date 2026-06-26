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
  Image as ImageIcon,
  ArrowClockwise,
  MagnifyingGlass,
  UserCheck,
} from "@phosphor-icons/react";
import Image from "next/image";

type ManualTicket = {
  id: string;
  name: string;
  email: string | null;
  ticketType: string;
  status: string;
  checkedInAt: string | null;
};

function ManualLookupPanel({ eventId, onCheckedIn }: { eventId: string; onCheckedIn: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ManualTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/organizer/scan/search?q=${encodeURIComponent(q)}&eventId=${eventId}`)
      .then((r) => r.json())
      .then((d: { tickets?: ManualTicket[] }) => { setResults(d.tickets ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  function handleInput(v: string) {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  }

  async function handleCheckIn(ticketId: string) {
    setCheckingIn(ticketId);
    const res = await fetch("/api/organizer/scan/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId }),
    });
    const data = (await res.json()) as { result: string };
    setCheckingIn(null);
    if (data.result === "valid") {
      setCheckedIn(ticketId);
      setResults((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "used", checkedInAt: new Date().toISOString() } : t));
      onCheckedIn();
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#0e6130]/60 focus:outline-none focus:ring-1 focus:ring-[#0e6130]/40"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
        />
        {loading && <SpinnerGap size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-white/40" />}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                {t.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{t.name}</p>
                <p className="truncate text-xs text-white/50">{t.email ?? ""} · {t.ticketType}</p>
              </div>
              {t.status === "used" || checkedIn === t.id ? (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                  <Check size={12} weight="bold" />
                  In
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleCheckIn(t.id)}
                  disabled={checkingIn === t.id}
                  className="flex items-center gap-1.5 rounded-full bg-[#0e6130] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0e6130]/80 disabled:opacity-50"
                >
                  {checkingIn === t.id ? <SpinnerGap size={12} className="animate-spin" /> : <UserCheck size={12} />}
                  Check in
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && (
        <p className="text-center text-sm text-white/40">No attendees found for "{query}"</p>
      )}
    </div>
  );
}

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

type CameraErrorKind = "permission_denied" | "not_found" | "other";

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
    network_error: "Network error — please try again",
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

function PermissionDeniedPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
        <Camera size={28} className="text-orange-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-white">Camera access blocked</p>
        <p className="mt-1 text-sm text-white/60">
          Your browser blocked the camera. Reset it by clicking the lock/camera icon in your
          address bar and allowing camera access, then tap Retry below.
        </p>
      </div>
      <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left text-xs text-white/50 space-y-1">
        <p className="font-semibold text-white/70">How to reset:</p>
        <p>Chrome / Edge: click the lock icon → Camera → Allow</p>
        <p>Safari: Settings → Websites → Camera → Allow</p>
        <p>Firefox: click the camera icon in the address bar → Remove block</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-[#0e6130] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6130]/80"
      >
        <ArrowClockwise size={16} />
        Retry camera
      </button>
    </div>
  );
}

export default function ScannerClient() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanCount, setScanCount] = useState(0);
  const [cameraError, setCameraError] = useState<{ kind: CameraErrorKind; message: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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
      const name = err instanceof Error ? err.name : "";
      const message = err instanceof Error ? err.message : "Camera unavailable";
      const kind: CameraErrorKind =
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "permission_denied"
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "not_found"
            : "other";
      setCameraError({ kind, message });
    }
  }, [startScanLoop]);

  const handleGalleryFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          void verify(code.data);
        } else {
          setScanState({ result: "invalid", reason: "malformed_payload" });
          setTimeout(() => setScanState("idle"), 3000);
        }
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [verify],
  );

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const [activeTab, setActiveTab] = useState<"scan" | "lookup">("scan");
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
      {/* Hidden gallery file input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryFile}
      />

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

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["scan", "lookup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); if (tab === "scan" && !isScanning) stopCamera(); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                activeTab === tab ? "bg-[#0e6130] text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {tab === "scan" ? <QrCode size={15} /> : <MagnifyingGlass size={15} />}
              {tab === "scan" ? "Scan QR" : "Manual lookup"}
            </button>
          ))}
        </div>

        {activeTab === "lookup" && selectedEventId && (
          <ManualLookupPanel eventId={selectedEventId} onCheckedIn={() => setScanCount((c) => c + 1)} />
        )}

        <div className={activeTab === "lookup" ? "hidden" : ""}>
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
                cameraError.kind === "permission_denied" ? (
                  <PermissionDeniedPanel onRetry={() => void startCamera()} />
                ) : (
                  <>
                    <Warning size={40} className="text-orange-400" />
                    <p className="max-w-[220px] text-center text-sm text-white/70">
                      {cameraError.kind === "not_found"
                        ? "No camera found on this device"
                        : cameraError.message}
                    </p>
                    <button
                      onClick={() => void startCamera()}
                      className="rounded-xl bg-[#0e6130] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6130]/80"
                    >
                      Try Again
                    </button>
                  </>
                )
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

        {/* Action buttons */}
        <div className="flex gap-3">
          {isScanning ? (
            <button
              onClick={() => {
                stopCamera();
                setScanState("idle");
              }}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10"
            >
              Stop Camera
            </button>
          ) : (
            <button
              onClick={() => void startCamera()}
              disabled={!selectedEventId}
              className="flex-1 rounded-xl bg-[#0e6130] py-3 text-sm font-semibold text-white transition hover:bg-[#0e6130]/80 disabled:opacity-40"
            >
              Start Scanning
            </button>
          )}

          {/* Gallery picker — always available */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={!selectedEventId || scanState === "verifying"}
            title="Scan QR from photo"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10 disabled:opacity-40"
          >
            <ImageIcon size={18} />
            <span className="hidden sm:inline">From photo</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-white/30">
          Use "From photo" to scan a QR code from your camera roll or a screenshot.
        </p>
        </div>{/* end scan tab wrapper */}
      </div>
    </div>
  );
}
