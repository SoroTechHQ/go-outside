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
} from "@phosphor-icons/react";

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
  // Granular message prefs — backed by /api/user/notification-prefs
  messages_in_app?:           boolean;
  messages_push?:             boolean;
  messages_email?:            boolean;
  messages_email_delay_mins?: number;
};

type Props = {
  isOrganizer:   boolean;
  orgName:       string | null;
  notifPrefs:    NotifPrefs;
  maskedEmail?:  string;
};

export function SettingsClient({ isOrganizer, orgName, notifPrefs, maskedEmail }: Props) {
  const router = useRouter();

  const [showOrgForm,   setShowOrgForm]   = useState(false);
  const [orgNameVal,    setOrgNameVal]    = useState("");
  const [orgBioVal,     setOrgBioVal]     = useState("");
  const [primaryScene,  setPrimaryScene]  = useState("");
  const [converting,    setConverting]    = useState(false);
  const [convertErr,    setConvertErr]    = useState<string | null>(null);
  const [converted,     setConverted]     = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const [prefs,       setPrefs]       = useState<NotifPrefs>(notifPrefs);
  const [savingNotif, setSavingNotif] = useState(false);
  const [msgEmailDelay, setMsgEmailDelay] = useState(notifPrefs.messages_email_delay_mins ?? 60);

  useEffect(() => {
    if (!converted) return;
    setShowCelebrate(true);
    const t = setTimeout(() => router.push("/organizer"), 2200);
    return () => clearTimeout(t);
  }, [converted, router]);

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
          bio:               orgBioVal.trim(),
          primary_scene:     primaryScene || null,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json() as { error?: string };
        throw new Error(error ?? "Something went wrong");
      }
      setShowOrgForm(false);
      setConverted(true);
    } catch (e) {
      setConvertErr((e as Error).message);
    } finally {
      setConverting(false);
    }
  }

  async function handleNotifToggle(key: keyof NotifPrefs) {
    if (key === "push" && !prefs.push) {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
    }

    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSavingNotif(true);
    try {
      await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_prefs: updated }),
      });
    } catch {
      setPrefs(prefs);
    } finally {
      setSavingNotif(false);
    }
  }

  async function saveMsgPref(key: string, value: unknown) {
    setSavingNotif(true);
    try {
      await fetch("/api/user/notification-prefs", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } finally {
      setSavingNotif(false);
    }
  }

  const inputCls =
    "w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[#4a9f63]/60 focus:ring-1 focus:ring-[#4a9f63]/20";

  const isOrganizerNow = isOrganizer || converted;

  if (showCelebrate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <div className="flex flex-col items-center justify-center gap-5 rounded-[24px] border border-[#4a9f63]/20 bg-[#4a9f63]/6 px-8 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4a9f63]/20">
            <Confetti size={32} weight="fill" className="text-[#4a9f63]" />
          </div>
          <div>
            <p className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
              Welcome to GoOutside for Organizers
            </p>
            <p className="mt-1.5 text-[13px] text-[var(--text-tertiary)]">
              Taking you to your dashboard…
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#4a9f63]/15 px-5 py-2 text-[12px] font-semibold text-[#4a9f63]">
            <CheckCircle size={14} weight="fill" />
            Organizer profile created
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 md:py-10">

      {/* ── Account Type ───────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Account Type
          </p>
        </div>

        {isOrganizerNow ? (
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4a9f63]/15">
                <Buildings size={18} className="text-[#4a9f63]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {orgName ?? "Organizer"}
                </p>
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
          </div>
        ) : (
          <div className="px-5 py-5">
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
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      Become an Organizer
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                      Create and sell tickets for your events
                    </p>
                  </div>
                </div>
                <CaretDown size={14} className="shrink-0 text-[var(--text-tertiary)]" />
              </button>
            ) : (
              <div className="mt-4 space-y-4 rounded-[14px] border border-[#4a9f63]/20 bg-[#4a9f63]/6 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#4a9f63]">
                    Organizer Setup
                  </p>
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
                  <input
                    value={orgNameVal}
                    onChange={(e) => setOrgNameVal(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Sankofa Sessions"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Short Bio
                  </label>
                  <textarea
                    value={orgBioVal}
                    onChange={(e) => setOrgBioVal(e.target.value.slice(0, 200))}
                    rows={2}
                    className={`${inputCls} resize-none`}
                    placeholder="What kind of events do you run?"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Primary Scene <span className="normal-case font-normal text-[var(--text-tertiary)]">(optional)</span>
                  </label>
                  <select
                    value={primaryScene}
                    onChange={(e) => setPrimaryScene(e.target.value)}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="">Select your main vibe…</option>
                    {PRIMARY_SCENES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                    Helps people find your profile. Your events can be any category.
                  </p>
                </div>

                {convertErr && (
                  <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-500">
                    {convertErr}
                  </p>
                )}

                <button
                  onClick={handleConvert}
                  disabled={converting || !orgNameVal.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4a9f63] py-3 text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(74,159,99,0.3)] transition hover:bg-[#3d8f56] disabled:opacity-50 active:scale-[0.98]"
                >
                  {converting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Converting…
                    </>
                  ) : (
                    <>
                      <Buildings size={15} />
                      Convert to Organizer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Notifications ──────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Notifications
            {savingNotif && <span className="ml-2 text-[#4a9f63]">saving…</span>}
          </p>
        </div>
        {(
          [
            {
              key:   "email"  as const,
              label: "Email notifications",
              desc:  maskedEmail
                ? `Reminders and receipts sent to ${maskedEmail}`
                : "Event reminders and ticket receipts",
            },
            {
              key:   "push"   as const,
              label: "Push notifications",
              desc:  "Browser alerts for activity and events near you",
            },
            {
              key:   "in_app" as const,
              label: "In-app notifications",
              desc:  "Activity bell and feed inside the app",
            },
          ] satisfies { key: keyof NotifPrefs; label: string; desc: string }[]
        ).map(({ key, label, desc }, i, arr) => (
          <button
            key={key}
            onClick={() => handleNotifToggle(key)}
            className={`flex w-full items-center justify-between px-5 py-4 transition hover:bg-[var(--bg-elevated)] active:scale-[0.995] ${
              i < arr.length - 1 ? "border-b border-[var(--border-subtle)]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <BellSimple size={16} className="shrink-0 text-[var(--text-tertiary)]" />
              <div className="text-left">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{desc}</p>
              </div>
            </div>
            {/* Toggle pill */}
            <div
              className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 ${
                prefs[key] ? "bg-[#4a9f63]" : "bg-[var(--border-card)]"
              }`}
            >
              <div
                className={`absolute top-[3px] h-5 w-5 rounded-full shadow transition-transform duration-200 ${
                  prefs[key] ? "translate-x-[22px] bg-white" : "translate-x-[3px] bg-[var(--bg-base)]"
                }`}
              />
            </div>
          </button>
        ))}
      </section>

      {/* ── Message Notification Detail ────────────────────────────────── */}
      {prefs.email && (
        <section className="overflow-hidden rounded-[20px] border border-[var(--border-card)] bg-[var(--bg-card)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Message Email Reminder
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[12px] text-[var(--text-tertiary)] mb-3">
              Send an email if you haven&apos;t replied to a DM after:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 30,  label: "30 min" },
                { value: 60,  label: "1 hour" },
                { value: 120, label: "2 hours" },
                { value: 0,   label: "Never" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={async () => {
                    setMsgEmailDelay(opt.value);
                    await saveMsgPref("messages_email_delay_mins", opt.value);
                  }}
                  className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
                    msgEmailDelay === opt.value
                      ? "bg-[#4a9f63] text-white"
                      : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#4a9f63]/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
