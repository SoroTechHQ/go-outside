"use client";

import { useState, useEffect, useCallback } from "react";
import { MapTrifold, Users } from "@phosphor-icons/react";
import { LiveMapModal } from "./LiveMapModal";

type Props = {
  eventId:      string;
  eventName:    string;
  venueLat:     number;
  venueLng:     number;
  startDatetime: string;
  endDatetime:   string;
};

function isInLiveWindow(startDatetime: string, endDatetime: string): boolean {
  const now      = Date.now();
  const startMs  = new Date(startDatetime).getTime();
  const endMs    = new Date(endDatetime).getTime();
  return now >= startMs - 3 * 60 * 60 * 1000 && now <= endMs + 5 * 60 * 60 * 1000;
}

export function LiveAttendeeBanner({
  eventId, eventName, venueLat, venueLng, startDatetime, endDatetime,
}: Props) {
  const [inWindow, setInWindow]   = useState(false);
  const [total, setTotal]         = useState<number | null>(null);
  const [friends, setFriends]     = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const checkWindow = useCallback(() => {
    setInWindow(isInLiveWindow(startDatetime, endDatetime));
  }, [startDatetime, endDatetime]);

  useEffect(() => {
    checkWindow();
    const t = setInterval(checkWindow, 60_000);
    return () => clearInterval(t);
  }, [checkWindow]);

  useEffect(() => {
    if (!inWindow) return;
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/events/live?event_id=${eventId}`);
        if (res.ok) {
          const data = await res.json() as { total: number; friendCount: number };
          setTotal(data.total);
          setFriends(data.friendCount);
        }
      } catch {/* silent */}
    };
    fetchCount();
    const t = setInterval(fetchCount, 30_000);
    return () => clearInterval(t);
  }, [inWindow, eventId]);

  if (!inWindow) return null;

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand-dim)] px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Pulsing green dot */}
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--brand)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {total !== null ? (
                <>
                  <span className="text-[var(--brand)]">{total}</span>
                  {" "}people at this event right now
                  {friends !== null && friends > 0 && (
                    <> · <span className="text-[var(--brand)]">{friends}</span> friends</>
                  )}
                </>
              ) : (
                "Live event — see who's here"
              )}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Tap to open the live map</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.97]"
        >
          <MapTrifold size={15} weight="bold" />
          See who's here
        </button>
      </div>

      {modalOpen && (
        <LiveMapModal
          eventId={eventId}
          eventName={eventName}
          venueLat={venueLat}
          venueLng={venueLng}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
