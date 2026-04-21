"use client";

import { useCallback } from "react";

type EdgeType =
  | "card_view" | "card_hover" | "card_long_dwell" | "card_click"
  | "peek_open" | "save" | "unsave" | "not_interested" | "share"
  | "ticket_intent" | "keyboard_save" | "scroll_past"
  | "long_dwell" | "short_dwell" | "skipped" | "viewed" | "shared"
  | "saved" | "interested_in" | "follows";

type Source = "feed" | "search" | "peek_panel" | "keyboard" | "direct" | "hover";

type TrackPayload = {
  eventId: string;
  type: EdgeType;
  dwellMs?: number;
  source?: Source;
  sessionId?: string;
  position?: number;
  section?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export function useTrackInteraction() {
  return useCallback((payload: TrackPayload) => {
    // Fire-and-forget — never await this, never block the UI
    fetch(`${API_BASE}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id:    payload.eventId,
        action_type: payload.type,
        dwell_ms:    payload.dwellMs,
        source:      payload.source,
        session_id:  payload.sessionId,
        position:    payload.position,
        section:     payload.section,
      }),
      keepalive: true,
    }).catch(() => null);
  }, []);
}
