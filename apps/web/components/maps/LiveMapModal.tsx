"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChatCircle,
  MapPin,
  NavigationArrow,
  UserCircle,
  Users,
  X,
} from "@phosphor-icons/react";
import { useLiveBroadcast } from "./useLiveBroadcast";

type Props = {
  eventId:   string;
  eventName: string;
  venueLat:  number;
  venueLng:  number;
  onClose:   () => void;
};

// Converts lat/lng to a percentage offset within our fixed map viewport
function toMapOffset(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  zoom: number = 0.008,
) {
  const x = 50 + (lng - centerLng) / zoom * 50;
  const y = 50 - (lat - centerLat) / zoom * 50;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

type PinProps = {
  x:        number;
  y:        number;
  isSelf:   boolean;
  isFriend: boolean;
  avatarUrl: string | null;
  firstName: string | null;
  username:  string | null;
  userId:   string;
  onSelect: (id: string) => void;
  selected: boolean;
};

function AttendeePin({ x, y, isSelf, isFriend, avatarUrl, firstName, username, userId, onSelect, selected }: PinProps) {
  const label = isSelf ? "You" : isFriend ? (firstName ?? "Friend") : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(userId)}
      className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 focus:outline-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all ${
        isSelf    ? "border-[var(--brand)] bg-[var(--brand)]" :
        isFriend  ? "border-white bg-white" :
                    "border-white/60 bg-white/30 backdrop-blur-sm"
      } ${selected ? "scale-125 ring-2 ring-[var(--brand)] ring-offset-1" : ""}`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={firstName ?? ""} className="h-full w-full rounded-full object-cover" />
        ) : isFriend || isSelf ? (
          <span className="text-xs font-bold text-[var(--brand)]">
            {isSelf ? "ME" : (firstName?.[0] ?? "?")}
          </span>
        ) : (
          <UserCircle size={22} className="text-white/70" weight="fill" />
        )}
      </div>
      {label && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {label}
        </span>
      )}
    </button>
  );
}

export function LiveMapModal({ eventId, eventName, venueLat, venueLng, onClose }: Props) {
  const { state, liveData, startBroadcasting, stopBroadcasting } = useLiveBroadcast(eventId, true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const attendees  = liveData?.attendees ?? [];
  const selected   = attendees.find((a) => a.userId === selectedUserId);

  const venuePct = toMapOffset(venueLat, venueLng, venueLat, venueLng);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[90] flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-3xl bg-[var(--bg-card)] mt-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--home-border)] px-5 py-4">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Who's here</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {liveData
                ? `${liveData.total} people · ${liveData.friendCount} friends`
                : "Loading…"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--home-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Map area — relative-positioned pins over a Google Maps embed */}
        <div className="relative flex-1 overflow-hidden bg-[var(--bg-surface)]">
          <iframe
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? ""}&q=${venueLat},${venueLng}&zoom=17`}
            title="Live map"
            allowFullScreen
          />

          {/* Attendee pins */}
          {attendees.map((a) => {
            const pos = toMapOffset(a.lat, a.lng, venueLat, venueLng);
            return (
              <AttendeePin
                key={a.userId}
                x={pos.x}
                y={pos.y}
                isSelf={a.isSelf}
                isFriend={a.isFriend}
                avatarUrl={a.avatarUrl}
                firstName={a.firstName}
                username={a.username}
                userId={a.userId}
                onSelect={setSelectedUserId}
                selected={selectedUserId === a.userId}
              />
            );
          })}

          {/* Venue pin */}
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${venuePct.x}%`, top: `${venuePct.y}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 shadow-lg">
                <MapPin size={16} weight="fill" className="text-white" />
              </div>
              <div className="mt-1 max-w-[100px] truncate rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                Venue
              </div>
            </div>
          </div>

          {/* Counts overlay */}
          {liveData && (
            <div className="absolute left-3 top-3 flex gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <Users size={12} weight="fill" />
                {liveData.total} here
              </div>
              {liveData.friendCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--brand)]/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  {liveData.friendCount} friends
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected attendee card */}
        {selected && selected.isFriend && !selected.isSelf && (
          <div className="border-t border-[var(--home-border)] bg-[var(--bg-card)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-dim)] text-[var(--brand)]">
                {selected.avatarUrl ? (
                  <img src={selected.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{selected.firstName?.[0] ?? "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)]">{selected.firstName ?? "Friend"}</p>
                {selected.username && (
                  <p className="text-sm text-[var(--text-secondary)]">@{selected.username}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/messages?user=${selected.userId}`}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  onClick={onClose}
                >
                  <ChatCircle size={15} weight="bold" />
                  Message
                </Link>
                <Link
                  href={`/dashboard/user/${selected.userId}`}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--home-border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  onClick={onClose}
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar — share my location toggle */}
        <div className="border-t border-[var(--home-border)] bg-[var(--bg-surface)] px-5 py-4">
          {state === "active" ? (
            <button
              type="button"
              onClick={stopBroadcasting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/50 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
            >
              <NavigationArrow size={15} weight="fill" />
              Stop sharing my location
            </button>
          ) : (
            <button
              type="button"
              onClick={startBroadcasting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <NavigationArrow size={15} weight="bold" />
              Share my location
            </button>
          )}
          <p className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
            Only visible to friends · Auto-stops 5 hours after the event
          </p>
        </div>
      </div>
    </div>
  );
}
