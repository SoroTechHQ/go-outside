"use client";

import { useRef, useEffect } from "react";
import { useTrackInteraction } from "./useTrackInteraction";

export function useEventDwell(eventId: string | null | undefined) {
  const startRef = useRef(Date.now());
  const track = useTrackInteraction();

  useEffect(() => {
    if (!eventId) return;
    startRef.current = Date.now();
    return () => {
      const ms = Date.now() - startRef.current;
      if (ms >= 8000) {
        track({ eventId, type: "long_dwell", dwellMs: ms, source: "direct" });
      } else if (ms < 2000) {
        track({ eventId, type: "short_dwell", dwellMs: ms, source: "direct" });
      }
    };
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps
}
