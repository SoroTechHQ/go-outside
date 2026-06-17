import type { DateRange } from "./types";

// ── Date chip values the UI exposes ──────────────────────────────────────────
// Must stay in sync with DATE_CHIPS in SearchPillExpanded and resolveWhen here.

export const WHEN_CHIPS = [
  { label: "Today",        value: "today"     },
  { label: "Tonight",      value: "tonight"   },
  { label: "Tomorrow",     value: "tomorrow"  },
  { label: "This weekend", value: "weekend"   },
  { label: "Next week",    value: "next-week" },
  { label: "This month",   value: "month"     },
  { label: "Any time",     value: ""          },
] as const;

export type WhenChip = (typeof WHEN_CHIPS)[number]["value"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const startOfDay = (d: Date): string =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();

const endOfDay = (d: Date): string =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// Returns the next occurrence of a weekday (0=Sun … 6=Sat) at or after `base`
const nextWeekday = (base: Date, target: number): Date => {
  const r = new Date(base);
  const diff = (target - r.getDay() + 7) % 7;
  r.setDate(r.getDate() + diff);
  return r;
};

// ── Main resolver ─────────────────────────────────────────────────────────────

/**
 * Converts a "when" string to an ISO datetime range.
 *
 * Supported values:
 *  - "today"        → midnight … 23:59 today
 *  - "tonight"      → 17:00 today … 23:59 today
 *  - "tomorrow"     → midnight … 23:59 tomorrow
 *  - "weekend"      → Friday midnight … Sunday 23:59
 *  - "next-week"    → Monday … following Sunday
 *  - "month"        → today … last day of month
 *  - "YYYY-MM-DD"   → single day
 *  - "YYYY-MM-DD:YYYY-MM-DD" → explicit range
 *  - ""  / null     → null (no filter, caller applies NOW_ISO fallback)
 */
export function resolveWhen(when: string | null | undefined): DateRange | null {
  if (!when) return null;

  const now = new Date();

  if (when === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (when === "tonight") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
    return { from: from.toISOString(), to: endOfDay(now) };
  }

  if (when === "tomorrow") {
    const tom = addDays(now, 1);
    return { from: startOfDay(tom), to: endOfDay(tom) };
  }

  if (when === "weekend") {
    const friday = nextWeekday(now, 5);
    const sunday = addDays(friday, 2);
    return { from: startOfDay(friday), to: endOfDay(sunday) };
  }

  if (when === "next-week") {
    const monday = nextWeekday(addDays(now, 1), 1);
    const sunday = addDays(monday, 6);
    return { from: startOfDay(monday), to: endOfDay(sunday) };
  }

  if (when === "month") {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: startOfDay(now), to: endOfDay(end) };
  }

  // Explicit range: "YYYY-MM-DD:YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}$/.test(when)) {
    const [fromStr, toStr] = when.split(":") as [string, string];
    return {
      from: startOfDay(new Date(fromStr + "T00:00:00")),
      to: endOfDay(new Date(toStr + "T00:00:00")),
    };
  }

  // Single date: "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(when)) {
    const d = new Date(when + "T00:00:00");
    return { from: startOfDay(d), to: endOfDay(d) };
  }

  return null;
}
