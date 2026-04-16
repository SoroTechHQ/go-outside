/**
 * Cookie utilities for GoOutside
 *
 * go_done   — HttpOnly, Secure. Set by /api/onboarding/complete.
 *             Read by /home server component to skip Clerk metadata round-trip.
 *
 * go_prefs  — Client-readable. Stores location, interests, score, tier after
 *             onboarding completes. Used for instant feed personalization.
 *
 * go_draft  — Client-readable, 1-day TTL. Persists onboarding form state
 *             across refreshes and back-navigation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPrefs {
  city:      string;
  interests: string[];
  vibe:      Record<string, unknown> | null;
  score:     number;
  tier:      string;
}

export interface OnboardingDraft {
  profile?: {
    first_name?: string;
    last_name?:  string;
    username?:   string;
    phone?:      string;
    city?:       string;
  };
  vibe?:         Record<string, unknown>;
  pastEventIds?: string[];
  interests?:    string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Low-level client helpers (browser-only — always guard with typeof window)
// ─────────────────────────────────────────────────────────────────────────────

function clientSet(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function clientGet(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function clientDelete(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// ─────────────────────────────────────────────────────────────────────────────
// go_prefs  — user preferences (client-readable)
// ─────────────────────────────────────────────────────────────────────────────

export function saveUserPrefs(prefs: UserPrefs) {
  clientSet("go_prefs", JSON.stringify(prefs), 30);
}

export function getUserPrefs(): UserPrefs | null {
  try {
    const raw = clientGet("go_prefs");
    return raw ? (JSON.parse(raw) as UserPrefs) : null;
  } catch {
    return null;
  }
}

export function clearUserPrefs() {
  clientDelete("go_prefs");
}

// ─────────────────────────────────────────────────────────────────────────────
// go_draft  — onboarding form draft (client-readable, 1-day TTL)
// ─────────────────────────────────────────────────────────────────────────────

export function saveOnboardingDraft(patch: Partial<OnboardingDraft>) {
  const existing = getOnboardingDraft();
  clientSet("go_draft", JSON.stringify({ ...existing, ...patch }), 1);
}

export function getOnboardingDraft(): OnboardingDraft {
  try {
    const raw = clientGet("go_draft");
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function clearOnboardingDraft() {
  clientDelete("go_draft");
}
