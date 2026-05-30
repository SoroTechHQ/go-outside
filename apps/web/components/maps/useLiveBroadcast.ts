"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BroadcastState = "idle" | "active" | "error" | "closed";

type Attendee = {
  userId:    string;
  lat:       number;
  lng:       number;
  isSelf:    boolean;
  isFriend:  boolean;
  firstName: string | null;
  avatarUrl: string | null;
  username:  string | null;
  updatedAt: string;
};

type LiveData = {
  total:       number;
  friendCount: number;
  attendees:   Attendee[];
};

export function useLiveBroadcast(eventId: string, isInWindow: boolean) {
  const [state, setState]       = useState<BroadcastState>("idle");
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef                = useRef<number | null>(null);

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/live?event_id=${eventId}`);
      if (res.ok) setLiveData(await res.json());
    } catch {
      // silent — stale data is fine
    }
  }, [eventId]);

  const startBroadcasting = useCallback(() => {
    if (!navigator.geolocation) {
      setState("error");
      return;
    }

    setState("active");

    const broadcast = (pos: GeolocationPosition) => {
      fetch("/api/events/live", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      }).catch(() => {/* silent */});
    };

    watchRef.current = navigator.geolocation.watchPosition(broadcast, () => setState("error"), {
      enableHighAccuracy: true,
      maximumAge:         15000,
      timeout:            10000,
    });
  }, [eventId]);

  const stopBroadcasting = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setState("idle");
    fetch("/api/events/live", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ event_id: eventId }),
    }).catch(() => {/* silent */});
  }, [eventId]);

  // Poll attendees every 10s when the window is open
  useEffect(() => {
    if (!isInWindow) return;

    fetchAttendees();
    intervalRef.current = setInterval(fetchAttendees, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInWindow, fetchAttendees]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  return { state, liveData, startBroadcasting, stopBroadcasting };
}
