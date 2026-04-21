"use client";

import { useEffect, useRef } from "react";
import { useTrackInteraction } from "./useTrackInteraction";

type Options = {
  eventId: string | null | undefined;
  source?: "feed" | "search" | "direct";
  section?: string;
  position?: number;
  dwellThresholdMs?: number;
};

export function useViewportTrack(
  ref: React.RefObject<Element | null>,
  { eventId, source = "feed", section, position, dwellThresholdMs = 2000 }: Options,
) {
  const track = useTrackInteraction();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!eventId || !ref.current) return;
    firedRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timerRef.current = setTimeout(() => {
            if (!firedRef.current) {
              firedRef.current = true;
              track({ eventId, type: "card_view", source, section, position });
            }
          }, dwellThresholdMs);
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps
}
