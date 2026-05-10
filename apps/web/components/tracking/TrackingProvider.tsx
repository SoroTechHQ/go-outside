"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { collectFingerprint } from "../../lib/fingerprint";

// ── Types ─────────────────────────────────────────────────────────────────────

type MicroEvent = {
  event_type: string;
  page_path?: string;
  target_element?: string;
  target_entity_id?: string;
  entity_type?: string;
  hover_duration_ms?: number;
  x?: number;
  y?: number;
  scroll_depth_pct?: number;
  payload?: Record<string, unknown>;
  ts: string;
};

type TrackingContextValue = {
  sessionToken: string | null;
  trackEvent: (e: Omit<MicroEvent, "ts">) => void;
  trackHoverStart: (entityId: string, entityType: string, element?: string) => () => void;
  trackClick: (entityId: string, entityType: string, element?: string) => void;
  trackSearch: (query: string) => void;
  trackSave: (entityId: string, entityType?: string) => void;
  trackCartAdd: (entityId: string) => void;
};

const TrackingContext = createContext<TrackingContextValue>({
  sessionToken: null,
  trackEvent: () => undefined,
  trackHoverStart: () => () => undefined,
  trackClick: () => undefined,
  trackSearch: () => undefined,
  trackSave: () => undefined,
  trackCartAdd: () => undefined,
});

export const useTracking = () => useContext(TrackingContext);

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateToken(): string {
  return "tk_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function post(payload: unknown) {
  fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

function postBeacon(payload: unknown) {
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      "/api/analytics/collect",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
  } else {
    post(payload);
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const eventQueue = useRef<MicroEvent[]>([]);
  const pageViewId = useRef<string | null>(null);
  const pageEnterTs = useRef<number>(Date.now());
  const maxScrollPct = useRef<number>(0);
  const clickCount = useRef<number>(0);
  const fingerprinted = useRef<boolean>(false);
  const hoverStartMap = useRef<Map<string, number>>(new Map());
  const clickHistory = useRef<{ ts: number; x: number; y: number }[]>([]);

  // ── Push micro-event to queue ──────────────────────────────────────────────
  const trackEvent = useCallback((e: Omit<MicroEvent, "ts">) => {
    eventQueue.current.push({ ...e, ts: new Date().toISOString() });
  }, []);

  // ── Track hover start, returns a cleanup fn ────────────────────────────────
  const trackHoverStart = useCallback(
    (entityId: string, entityType: string, element?: string) => {
      hoverStartMap.current.set(entityId, Date.now());
      return () => {
        const start = hoverStartMap.current.get(entityId);
        if (!start) return;
        const duration = Date.now() - start;
        hoverStartMap.current.delete(entityId);
        if (duration < 300) return; // ignore accidental hovers < 300ms
        trackEvent({
          event_type: "hover_event",
          target_entity_id: entityId,
          entity_type: entityType,
          target_element: element,
          hover_duration_ms: duration,
          page_path: window.location.pathname,
        });
      };
    },
    [trackEvent]
  );

  // ── Track click ────────────────────────────────────────────────────────────
  const trackClick = useCallback(
    (entityId: string, entityType: string, element?: string) => {
      trackEvent({
        event_type: "click",
        target_entity_id: entityId,
        entity_type: entityType,
        target_element: element,
        page_path: window.location.pathname,
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string) => {
      trackEvent({ event_type: "search", payload: { query }, page_path: window.location.pathname });
    },
    [trackEvent]
  );

  const trackSave = useCallback(
    (entityId: string, entityType = "event") => {
      trackEvent({ event_type: "save_event", target_entity_id: entityId, entity_type: entityType, page_path: window.location.pathname });
    },
    [trackEvent]
  );

  const trackCartAdd = useCallback(
    (entityId: string) => {
      trackEvent({ event_type: "add_to_cart", target_entity_id: entityId, entity_type: "event", page_path: window.location.pathname });
    },
    [trackEvent]
  );

  // ── Session init ───────────────────────────────────────────────────────────
  useEffect(() => {
    let token = sessionStorage.getItem("go_session");
    if (!token) {
      token = generateToken();
      sessionStorage.setItem("go_session", token);
    }
    setSessionToken(token);

    const deviceType = window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    const ua = navigator.userAgent;
    const browser = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Unknown";
    const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac/.test(ua) ? "macOS" : /Win/.test(ua) ? "Windows" : "Linux";

    post({
      type: "session_start",
      session_token: token,
      device_type: deviceType,
      referrer: document.referrer || null,
      browser,
      os,
    });

    // Session end on unload
    const handleUnload = () => {
      postBeacon({ type: "session_end", session_token: token, duration_seconds: Math.round((Date.now() - pageEnterTs.current) / 1000) });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Browser fingerprint — once per session ─────────────────────────────────
  useEffect(() => {
    if (fingerprinted.current || !sessionToken) return;
    fingerprinted.current = true;

    const run = async () => {
      try {
        const fp = await collectFingerprint();
        post({ type: "fingerprint", session_token: sessionToken, data: fp });
      } catch {
        // fingerprinting is best-effort
      }
    };

    // Run on idle so it doesn't compete with page render
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(run, { timeout: 5000 });
    } else {
      setTimeout(run, 2000);
    }
  }, [sessionToken]);

  // ── Page view tracking ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionToken) return;

    // Exit previous page view
    const prevPageViewId = pageViewId.current;
    if (prevPageViewId) {
      postBeacon({
        type: "page_exit",
        page_view_id: prevPageViewId,
        time_on_page_ms: Date.now() - pageEnterTs.current,
        scroll_depth_pct: maxScrollPct.current,
        click_count: clickCount.current,
      });
    }

    // Flush event queue from previous page
    const queued = eventQueue.current.splice(0);
    if (queued.length > 0) {
      post({ type: "events_batch", session_token: sessionToken, events: queued });
    }

    // Reset page-level counters
    maxScrollPct.current = 0;
    clickCount.current = 0;
    pageEnterTs.current = Date.now();

    // Start new page view
    const newPageViewId = generateToken();
    pageViewId.current = newPageViewId;

    post({
      type: "page_view",
      session_token: sessionToken,
      page_path: pathname,
      page_title: document.title || pathname,
      referrer: document.referrer || null,
      entered_at: new Date().toISOString(),
    });

    // Ping session every 25s to mark as active
    const ping = setInterval(() => {
      post({ type: "session_ping", session_token: sessionToken });
    }, 25_000);

    return () => clearInterval(ping);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, sessionToken]);

  // ── Global behavioral event listeners ────────────────────────────────────
  useEffect(() => {
    if (!sessionToken) return;

    // Scroll depth
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.body.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);
      if (pct > maxScrollPct.current) maxScrollPct.current = pct;
    };

    // Click tracking + rage click detection
    const handleClick = (e: MouseEvent) => {
      clickCount.current++;
      const now = Date.now();
      const { clientX: x, clientY: y } = e;
      clickHistory.current.push({ ts: now, x, y });
      // Keep last 10 clicks
      if (clickHistory.current.length > 10) clickHistory.current.shift();
      // Rage click: 3 clicks within 500ms in a 60px radius
      const recent = clickHistory.current.filter((c) => now - c.ts < 500 && Math.hypot(c.x - x, c.y - y) < 60);
      if (recent.length >= 3) {
        trackEvent({ event_type: "rage_click", x, y, page_path: pathname });
        clickHistory.current = [];
      }
    };

    // Exit intent: mouse leaves from top
    const handleMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.relatedTarget === null) {
        trackEvent({ event_type: "exit_intent", page_path: pathname });
      }
    };

    // Tab visibility
    const handleVisibility = () => {
      trackEvent({
        event_type: document.hidden ? "tab_blur" : "tab_focus",
        page_path: pathname,
      });
    };

    // Text selection
    const handleSelect = () => {
      const sel = window.getSelection()?.toString();
      if (sel && sel.length > 5) {
        trackEvent({ event_type: "text_selection", payload: { length: sel.length }, page_path: pathname });
      }
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key) {
        trackEvent({
          event_type: "keyboard_shortcut",
          payload: { key: e.key, meta: e.metaKey, ctrl: e.ctrlKey, shift: e.shiftKey },
          page_path: pathname,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick);
    document.addEventListener("mouseleave", handleMouseOut);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("selectionchange", handleSelect);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("mouseleave", handleMouseOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("selectionchange", handleSelect);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, sessionToken, trackEvent]);

  // ── Batch flush every 45 seconds ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionToken) return;
    const interval = setInterval(() => {
      const queued = eventQueue.current.splice(0);
      if (queued.length > 0) {
        post({ type: "events_batch", session_token: sessionToken, events: queued });
      }
    }, 45_000);
    return () => clearInterval(interval);
  }, [sessionToken]);

  return (
    <TrackingContext.Provider
      value={{ sessionToken, trackEvent, trackHoverStart, trackClick, trackSearch, trackSave, trackCartAdd }}
    >
      {children}
    </TrackingContext.Provider>
  );
}
