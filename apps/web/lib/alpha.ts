export type AlphaFeedbackType = "bug" | "ux" | "feature" | "delight" | "pulse_check";

export interface AlphaFeedbackPayload {
  type: AlphaFeedbackType;
  rating?: number;
  message: string;
  screenshotDataUrl?: string;
  pageUrl: string;
  browserInfo: BrowserInfo;
}

export interface BrowserInfo {
  userAgent: string;
  viewport: { width: number; height: number };
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  online: boolean;
}

export function collectBrowserInfo(): BrowserInfo {
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
  };
}

export const ALPHA_STORAGE_KEY = "gooutside_alpha";
export const ALPHA_SESSION_KEY = "gooutside_alpha_session";

export function isAlphaMode(): boolean {
  if (typeof window === "undefined") return false;
  const urlAlpha = new URLSearchParams(window.location.search).get("alpha");
  if (urlAlpha === "true" || urlAlpha === "1") return true;
  return localStorage.getItem(ALPHA_STORAGE_KEY) === "true";
}

export function setAlphaMode(value: boolean) {
  if (value) {
    localStorage.setItem(ALPHA_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(ALPHA_STORAGE_KEY);
  }
}

export const FEEDBACK_TYPES: {
  key: AlphaFeedbackType;
  label: string;
  emoji: string;
  description: string;
  color: string;
}[] = [
  { key: "bug",     label: "Bug",       emoji: "🐛", description: "Something broke",       color: "#ef4444" },
  { key: "ux",      label: "Feels Off", emoji: "🤔", description: "Confusing or awkward",  color: "#f59e0b" },
  { key: "feature", label: "Idea",      emoji: "💡", description: "Would love this",        color: "#3b82f6" },
  { key: "delight", label: "Love It",   emoji: "❤️", description: "This is great",          color: "#10b981" },
];

export const DEV_EMAIL = "dev@gooutside.club";
export const FROM_EMAIL = "GoOutside Alpha <alpha@mail.gooutside.club>";

// ── Console log capture ──────────────────────────────────────────────────────
// Intercepts console.error / console.warn / console.log and keeps a ring
// buffer of the last MAX_LOGS entries. Industry-standard approach used by
// Sentry, LogRocket, and Datadog for replay/debugging.

const MAX_LOGS = 60;

export interface CapturedLog {
  level: "error" | "warn" | "log" | "info";
  args: string[];
  ts: number; // epoch ms
  url: string;
}

let _logs: CapturedLog[] = [];
let _capturing = false;

const _originals: Record<string, (...args: unknown[]) => void> = {};

function serialize(args: unknown[]): string[] {
  return args.map((a) => {
    if (a instanceof Error) return `${a.name}: ${a.message}`;
    if (typeof a === "object" && a !== null) {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  });
}

export function startConsoleCapture() {
  if (typeof window === "undefined" || _capturing) return;
  _capturing = true;

  (["error", "warn", "log", "info"] as const).forEach((level) => {
    const orig = console[level].bind(console);
    _originals[level] = orig;
    console[level] = (...args: unknown[]) => {
      _logs.push({ level, args: serialize(args), ts: Date.now(), url: window.location.pathname });
      if (_logs.length > MAX_LOGS) _logs.shift();
      orig(...args);
    };
  });

  window.addEventListener("error", (e) => {
    _logs.push({ level: "error", args: [`Uncaught: ${e.message}`, `${e.filename}:${e.lineno}`], ts: Date.now(), url: window.location.pathname });
    if (_logs.length > MAX_LOGS) _logs.shift();
  });

  window.addEventListener("unhandledrejection", (e) => {
    _logs.push({ level: "error", args: [`UnhandledPromise: ${String(e.reason)}`], ts: Date.now(), url: window.location.pathname });
    if (_logs.length > MAX_LOGS) _logs.shift();
  });
}

export function stopConsoleCapture() {
  if (!_capturing) return;
  (["error", "warn", "log", "info"] as const).forEach((level) => {
    if (_originals[level]) (console[level] as unknown) = _originals[level];
  });
  _capturing = false;
  _logs = [];
}

export function getCaptureLogs(): CapturedLog[] {
  return [..._logs];
}
