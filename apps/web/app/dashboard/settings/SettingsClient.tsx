"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Buildings,
  BellSimple,
  ArrowRight,
  CheckCircle,
  ChartBar,
  CaretDown,
  X,
  Confetti,
  Lightning,
  DeviceMobile,
  Monitor,
  Shield,
  SignOut,
  PaintBrush,
  CaretLeft,
  SunDim,
  MoonStars,
  UserCircle,
  ChatCircleDots,
} from "@phosphor-icons/react";
import { useClerk } from "@clerk/nextjs";
import { useAnimationSettings } from "../../../lib/animation-settings";
import { enableBrowserPush, getSavedBrowserPushState } from "../../../lib/notifications/browser-push";

const PRIMARY_SCENES = [
  "Music & Nightlife",
  "Arts & Culture",
  "Food & Drink",
  "Sports & Fitness",
  "Tech & Business",
  "Fashion & Lifestyle",
  "Comedy & Entertainment",
  "Education & Workshops",
  "Wellness & Spirituality",
  "Community & Social",
  "Other",
];

type NotifPrefs = {
  email:  boolean;
  push:   boolean;
  in_app: boolean;
  messages_in_app?:           boolean;
  messages_push?:             boolean;
  messages_email?:            boolean;
  messages_email_delay_mins?: number;
};

type ActiveSession = {
  id: string;
  lastActiveAt: number;
  createdAt: number;
  latestActivity: {
    deviceType:  string | null;
    browserName: string | null;
    country:     string | null;
    city:        string | null;
    ipAddress:   string | null;
    isMobile:    boolean | null;
  } | null;
};

type Props = {
  isOrganizer:    boolean;
  orgName:        string | null;
  notifPrefs:     NotifPrefs;
  maskedEmail?:   string;
  activeSessions: ActiveSession[];
};

type Section = "account-type" | "notifications" | "appearance" | "security";

const NAV_GROUPS: { label: string; items: { id: Section; label: string; icon: React.ElementType; desc: string }[] }[] = [
  {
    label: "Your account",
    items: [
      { id: "account-type", label: "Account type", icon: Buildings, desc: "Organizer or attendee mode" },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", icon: BellSimple, desc: "Push, email & in-app alerts" },
      { id: "appearance",    label: "Appearance",    icon: PaintBrush, desc: "Theme and motion settings" },
    ],
  },
  {
    label: "Security",
    items: [
      { id: "security", label: "Security & Devices", icon: Shield, desc: "Password, sessions, 2FA" },
    ],
  },
];

const SECTION_TITLES: Record<Section, string> = {
  "account-type": "Account type",
  "notifications": "Notifications",
  "appearance": "Appearance",
  "security": "Security & Devices",
};

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* ─── Toggle pill ─────────────────────────────────────────────────────────── */
function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-[#4a9f63]" : "bg-[var(--border-card)]"}`}>
      <div className={`absolute top-[3px] h-5 w-5 rounded-full shadow transition-transform duration-200 ${on ? "translate-x-[22px] bg-white" : "translate-x-[3px] bg-[var(--bg-base)]"}`} />
    </div>
  );
}

/* ─── Section: Account Type ───────────────────────────────────────────────── */
function AccountTypeSection({
  isOrganizer, orgName, onConverted,
}: {
  isOrganizer: boolean;
  orgName: string | null;
  onConverted: () => void;
}) {
  const router = useRouter();
  const [showOrgForm,    setShowOrgForm]    = useState(false);
  const [orgNameVal,     setOrgNameVal]     = useState("");
  const [orgBioVal,      setOrgBioVal]      = useState("");
  const [primaryScene,   setPrimaryScene]   = useState("");
  const [converting,     setConverting]     = useState(false);
  const [convertErr,     setConvertErr]     = useState<string | null>(null);
  const [confirmRevert,  setConfirmRevert]  = useState(false);
  const [reverting,      setReverting]      = useState(false);
  const [revertErr,      setRevertErr]      = useState<string | null>(null);

  async function handleRevertToAttendee() {
    setReverting(true);
    setRevertErr(null);
    try {
      const res = await fetch("/api/account/become-attendee", { method: "POST" });
      if (!res.ok) {
        const { error } = await res.json() as { error?: string };
        throw new Error(error ?? "Something went wrong");
      }
      // Full reload so server re-derives the new role
      window.location.href = "/dashboard/settings";
    } catch (e) {
      setRevertErr((e as Error).message);
      setReverting(false);
    }
  }

  const inputCls = "w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[#4a9f63]/60 focus:ring-1 focus:ring-[#4a9f63]/20";

  async function handleConvert() {
    if (!orgNameVal.trim()) { setConvertErr("Organization name is required"); return; }
    setConverting(true);
    setConvertErr(null);
    try {
      const res = await fetch("/api/account/become-organizer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_name: orgNameVal.trim(),
          bio: orgBioVal.trim(),
          primary_scene: primaryScene || null,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json() as { error?: string };
        throw new Error(error ?? "Something went wrong");
      }
      setShowOrgForm(false);
      onConverted();
    } catch (e) {
      setConvertErr((e as Error).message);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-4">
      {isOrganizer ? (
        <div className="rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4a9f63]/15">
              <Buildings size={18} className="text-[#4a9f63]" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{orgName ?? "Organizer"}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#4a9f63]">
                <CheckCircle size={11} weight="fill" />
                Verified Organizer
              </p>
            </div>
            <button
              onClick={() => router.push("/organizer")}
              className="flex items-center gap-1.5 rounded-full bg-[#4a9f63]/15 px-4 py-2 text-[11px] font-bold text-[#4a9f63] transition hover:bg-[#4a9f63]/25 active:scale-[0.97]"
            >
              <ChartBar size={13} />
              Dashboard
              <ArrowRight size={11} />
            </button>
          </div>

          {/* Switch back to attendee */}
          {!confirmRevert ? (
            <button
              onClick={() => setConfirmRevert(true)}
              className="mt-4 flex w-full items-center gap-2.5 rounded-[12px] border border-[var(--border-subtle)] px-4 py-3 text-left text-[12px] text-[var(--text-secondary)] transition hover:border-[var(--border-default)] hover:text-[var(--text-primary)] active:scale-[0.99]"
            >
              <UserCircle size={15} className="shrink-0" />
              Switch back to attendee account
            </button>
          ) : (
            <div className="mt-4 rounded-[12px] border border-red-500/20 bg-red-500/6 p-4">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Switch to attendee?</p>
              <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                Your organizer profile and events are preserved. You can switch back at any time.
              </p>
              {revertErr && (
                <p className="mt-2 text-[11px] text-red-500">{revertErr}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRevertToAttendee}
                  disabled={reverting}
                  className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {reverting ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                  {reverting ? "Switching…" : "Yes, switch to attendee"}
                </button>
                <button
                  onClick={() => { setConfirmRevert(false); setRevertErr(null); }}
                  disabled={reverting}
                  className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
              <Buildings size={18} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Attendee</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                Discover and attend events across Ghana.
              </p>
            </div>
          </div>

          {!showOrgForm ? (
            <button
              onClick={() => setShowOrgForm(true)}
              className="mt-4 flex w-full items-center justify-between rounded-[14px] border border-[#4a9f63]/25 bg-[#4a9f63]/8 px-5 py-4 transition hover:bg-[#4a9f63]/15 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <Buildings size={16} className="text-[#4a9f63]" />
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">Become an Organizer</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">Create and sell tickets for your events</p>
                </div>
              </div>
              <CaretDown size={14} className="shrink-0 text-[var(--text-tertiary)]" />
            </button>
          ) : (
            <div className="mt-4 space-y-4 rounded-[14px] border border-[#4a9f63]/20 bg-[#4a9f63]/6 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#4a9f63]">Organizer Setup</p>
                <button
                  onClick={() => { setShowOrgForm(false); setConvertErr(null); }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                >
                  <X size={12} />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input value={orgNameVal} onChange={(e) => setOrgNameVal(e.target.value)} className={inputCls} placeholder="e.g. Sankofa Sessions" />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Short Bio</label>
                <textarea value={orgBioVal} onChange={(e) => setOrgBioVal(e.target.value.slice(0, 200))} rows={2} className={`${inputCls} resize-none`} placeholder="What kind of events do you run?" />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Primary Scene <span className="normal-case font-normal text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <select value={primaryScene} onChange={(e) => setPrimaryScene(e.target.value)} className={`${inputCls} appearance-none`}>
                  <option value="">Select your main vibe…</option>
                  {PRIMARY_SCENES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {convertErr && (
                <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-500">{convertErr}</p>
              )}

              <button
                onClick={handleConvert}
                disabled={converting || !orgNameVal.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4a9f63] py-3 text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(74,159,99,0.3)] transition hover:bg-[#3d8f56] disabled:opacity-50 active:scale-[0.98]"
              >
                {converting ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Converting…</>
                ) : (
                  <><Buildings size={15} />Convert to Organizer</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
            <UserCircle size={18} className="text-[var(--text-tertiary)]" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Edit Profile</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">Update your bio, photo and location</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[11px] font-bold text-[var(--text-secondary)] transition hover:border-[#4a9f63]/40 hover:text-[#4a9f63] active:scale-[0.97]"
          >
            Edit
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section: Notifications ──────────────────────────────────────────────── */
function NotificationsSection({
  notifPrefs: initialPrefs,
  maskedEmail,
}: {
  notifPrefs: NotifPrefs;
  maskedEmail?: string;
}) {
  const [prefs, setPrefs] = useState<NotifPrefs>(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [msgEmailDelay, setMsgEmailDelay] = useState(initialPrefs.messages_email_delay_mins ?? 60);

  useEffect(() => {
    getSavedBrowserPushState().then((result) => {
      // Don't surface config/env-level errors to users — they can't do anything about them.
      if (!result.ok && result.status !== "missing_vapid_key") {
        setPushStatusMessage(result.message);
      }
    }).catch(() => undefined);
  }, []);

  async function handleToggle(key: keyof NotifPrefs) {
    if (key === "push" && !prefs.push) {
      setPushStatusMessage(null);
      const result = await enableBrowserPush();
      setPushStatusMessage(result.message);
      if (!result.ok) return;
    }
    const nextValue = !prefs[key];
    const updated = { ...prefs, [key]: nextValue };
    if (key === "email") updated.messages_email = nextValue;
    if (key === "push")  updated.messages_push  = nextValue;
    if (key === "in_app") updated.messages_in_app = nextValue;
    setPrefs(updated);
    setSaving(true);
    try {
      await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notification_prefs: updated }) });
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  }

  async function saveMsgPref(key: string, value: unknown) {
    setSaving(true);
    try {
      await fetch("/api/user/notification-prefs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: value }) });
    } finally {
      setSaving(false);
    }
  }

  const notifItems = [
    {
      key: "email" as const,
      label: "Email notifications",
      desc: maskedEmail ? `Reminders and receipts sent to ${maskedEmail}` : "Event reminders and ticket receipts",
    },
    {
      key: "push" as const,
      label: "Push notifications",
      desc: "Browser alerts for activity and events near you",
    },
    {
      key: "in_app" as const,
      label: "In-app notifications",
      desc: "Activity bell and feed inside the app",
    },
  ] satisfies { key: keyof NotifPrefs; label: string; desc: string }[];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Alerts</p>
          {saving && <span className="text-[11px] text-[#4a9f63]">saving…</span>}
        </div>
        {notifItems.map(({ key, label, desc }, i, arr) => (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            className={`flex w-full items-center justify-between px-5 py-4 transition hover:bg-[var(--bg-elevated)] active:scale-[0.995] ${i < arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}`}
          >
            <div className="flex items-center gap-3">
              <BellSimple size={16} className="shrink-0 text-[var(--text-tertiary)]" />
              <div className="text-left">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{desc}</p>
                {key === "push" && pushStatusMessage ? (
                  <p className="mt-1.5 max-w-[380px] text-[11px] leading-relaxed text-[var(--brand)]">{pushStatusMessage}</p>
                ) : null}
              </div>
            </div>
            <Toggle on={!!prefs[key]} />
          </button>
        ))}
      </div>

      {prefs.email && (
        <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="flex items-center gap-2">
              <ChatCircleDots size={14} className="text-[var(--text-tertiary)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Message Email Reminder</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="mb-3 text-[12px] text-[var(--text-tertiary)]">
              Send an email if you haven&apos;t replied to a DM after:
            </p>
            <div className="flex flex-wrap gap-2">
              {[{ value: 30, label: "30 min" }, { value: 60, label: "1 hour" }, { value: 120, label: "2 hours" }, { value: 0, label: "Never" }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={async () => { setMsgEmailDelay(opt.value); await saveMsgPref("messages_email_delay_mins", opt.value); }}
                  className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${msgEmailDelay === opt.value ? "bg-[#4a9f63] text-white" : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#4a9f63]/40"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section: Appearance ─────────────────────────────────────────────────── */
function AppearanceSection() {
  const { reduceMotion, setReduceMotion } = useAnimationSettings();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const sync = () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("gooutside-theme", next);
    setTheme(next);
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Display</p>
      </div>

      <button
        onClick={toggleTheme}
        className="flex w-full items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4 transition hover:bg-[var(--bg-elevated)] active:scale-[0.995]"
      >
        <div className="flex items-center gap-3">
          {theme === "dark" ? <SunDim size={16} className="shrink-0 text-[var(--text-tertiary)]" /> : <MoonStars size={16} className="shrink-0 text-[var(--text-tertiary)]" />}
          <div className="text-left">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">
              {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
              Currently using {theme} mode
            </p>
          </div>
        </div>
        <div className={`rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]`}>
          Toggle
        </div>
      </button>

      <button
        onClick={() => setReduceMotion(!reduceMotion)}
        className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-[var(--bg-elevated)] active:scale-[0.995]"
      >
        <div className="flex items-center gap-3">
          <Lightning size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          <div className="text-left">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Reduce animations</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">Use simpler fade transitions instead of motion effects</p>
          </div>
        </div>
        <Toggle on={reduceMotion} />
      </button>
    </div>
  );
}

/* ─── Section: Security ───────────────────────────────────────────────────── */
function SecuritySection({ activeSessions: initialSessions }: { activeSessions: ActiveSession[] }) {
  const clerk = useClerk();
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  async function handleRevokeSession(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await fetch(`/api/account/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // silent
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    if (sessions.length <= 1) return;
    setRevokingAll(true);
    try {
      await Promise.all(sessions.slice(1).map((s) => fetch(`/api/account/sessions/${s.id}`, { method: "DELETE" })));
      setSessions((prev) => prev.slice(0, 1));
    } catch {
      // silent
    } finally {
      setRevokingAll(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Active Sessions</p>
          {sessions.length > 1 && (
            <button onClick={handleRevokeAll} disabled={revokingAll} className="text-[11px] font-semibold text-red-500 transition hover:opacity-70 disabled:opacity-40">
              {revokingAll ? "Signing out…" : "Sign out all other devices"}
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="px-5 py-5">
            <p className="text-[13px] text-[var(--text-tertiary)]">No active sessions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {sessions.map((s, i) => {
              const isCurrent = i === 0;
              const act = s.latestActivity;
              const isMobile = act?.isMobile ?? false;
              const deviceLabel = act?.deviceType ?? (isMobile ? "Mobile" : "Desktop");
              const browserLabel = act?.browserName ?? "GoOutside app";
              const locationLabel = act?.city && act?.country ? `${act.city}, ${act.country}` : (act?.country ?? "Unknown location");

              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
                    {isMobile ? <DeviceMobile size={18} className="text-[var(--text-secondary)]" /> : <Monitor size={18} className="text-[var(--text-secondary)]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{deviceLabel} · {browserLabel}</p>
                      {isCurrent && <span className="rounded-full bg-[#4a9f63]/15 px-2 py-0.5 text-[10px] font-bold text-[#4a9f63]">Current</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{locationLabel} · {relativeTime(s.lastActiveAt)}</p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-red-500/30 hover:text-red-500 disabled:opacity-40"
                    >
                      <SignOut size={12} />
                      {revokingId === s.id ? "Signing out…" : "Sign out"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-[var(--border-subtle)]">
          <button
            onClick={() => clerk.openUserProfile()}
            className="flex w-full items-center gap-3 px-5 py-4 transition hover:bg-[var(--bg-elevated)] active:scale-[0.995]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
              <Shield size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">Password &amp; security</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">Change password, manage 2FA</p>
            </div>
            <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main SettingsClient ─────────────────────────────────────────────────── */
export function SettingsClient({ isOrganizer, orgName, notifPrefs, maskedEmail, activeSessions }: Props) {
  const router = useRouter();
  const { signOut } = useClerk();

  const [section, setSection] = useState<Section>("account-type");
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [isOrganizerNow, setIsOrganizerNow] = useState(isOrganizer);

  useEffect(() => {
    if (!showCelebrate) return;
    const t = setTimeout(() => router.push("/organizer"), 2200);
    return () => clearTimeout(t);
  }, [showCelebrate, router]);

  if (showCelebrate) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-5 rounded-[24px] border border-[#4a9f63]/20 bg-[#4a9f63]/6 px-8 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4a9f63]/20">
            <Confetti size={32} weight="fill" className="text-[#4a9f63]" />
          </div>
          <div>
            <p className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">Welcome to GoOutside for Organizers</p>
            <p className="mt-1.5 text-[13px] text-[var(--text-tertiary)]">Taking you to your dashboard…</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#4a9f63]/15 px-5 py-2 text-[12px] font-semibold text-[#4a9f63]">
            <CheckCircle size={14} weight="fill" />
            Organizer profile created
          </div>
        </div>
      </div>
    );
  }

  function handleSelectSection(s: Section) {
    setSection(s);
    setMobileShowContent(true);
  }

  const activeNavItem = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === section);

  return (
    <div className="flex min-h-[calc(100vh-0px)]">
      {/* ── Left nav pane ──────────────────────────────────────────────────── */}
      <div className={`
        w-full shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]
        md:w-[280px] md:flex md:flex-col
        ${mobileShowContent ? "hidden md:flex" : "flex flex-col"}
      `}>
        {/* Header */}
        <div className="border-b border-[var(--border-subtle)] px-5 py-6">
          <h1 className="font-display text-[22px] font-bold italic text-[var(--text-primary)]">Settings</h1>
          <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Manage your account and preferences</p>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="mb-1 px-5 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSection(item.id)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-[var(--brand-dim)] text-[var(--brand)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${isActive ? "bg-[var(--brand)]/15" : "bg-[var(--bg-card)]"}`}>
                      <Icon size={16} weight={isActive ? "fill" : "regular"} className={isActive ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-medium leading-tight ${isActive ? "text-[var(--brand)]" : "text-[var(--text-primary)]"}`}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]">{item.desc}</p>
                    </div>
                    <ArrowRight size={13} className={`shrink-0 ${isActive ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sign out at bottom */}
        <div className="border-t border-[var(--border-subtle)] p-3">
          <button
            onClick={() => signOut(() => router.push("/"))}
            className="flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-red-500 transition hover:bg-red-500/8 active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10">
              <SignOut size={15} className="text-red-500" />
            </div>
            <span className="text-[13px] font-medium">Sign out</span>
          </button>
        </div>
      </div>

      {/* ── Right content pane ─────────────────────────────────────────────── */}
      <div className={`
        flex-1 min-w-0
        ${mobileShowContent ? "flex flex-col" : "hidden md:flex md:flex-col"}
      `}>
        {/* Content header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-5">
          {/* Mobile back button */}
          <button
            onClick={() => setMobileShowContent(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] md:hidden"
            aria-label="Back to settings menu"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div>
            <h2 className="font-display text-[18px] font-bold italic text-[var(--text-primary)]">
              {SECTION_TITLES[section]}
            </h2>
            {activeNavItem && (
              <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">{activeNavItem.desc}</p>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6">
          {section === "account-type" && (
            <AccountTypeSection
              isOrganizer={isOrganizerNow}
              orgName={orgName}
              onConverted={() => { setIsOrganizerNow(true); setShowCelebrate(true); }}
            />
          )}
          {section === "notifications" && (
            <NotificationsSection notifPrefs={notifPrefs} maskedEmail={maskedEmail} />
          )}
          {section === "appearance" && <AppearanceSection />}
          {section === "security" && <SecuritySection activeSessions={activeSessions} />}
        </div>
      </div>
    </div>
  );
}
