"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Buildings,
  BellSimple,
  ArrowRight,
  CheckCircle,
  ChartBar,
  CaretDown,
  X,
  Check,
} from "@phosphor-icons/react";

const ORGANIZER_CATEGORIES = [
  "Music", "Nightlife", "Arts & Culture", "Food & Drink",
  "Sports", "Tech & Business", "Fashion", "Comedy",
  "Education", "Wellness", "Community", "Other",
];

type NotifPrefs = {
  email:  boolean;
  push:   boolean;
  in_app: boolean;
};

type Props = {
  isOrganizer:   boolean;
  orgName:       string | null;
  notifPrefs:    NotifPrefs;
};

export function SettingsClient({ isOrganizer, orgName, notifPrefs }: Props) {
  const router = useRouter();

  // Organizer conversion state
  const [showOrgForm,  setShowOrgForm]  = useState(false);
  const [orgNameVal,   setOrgNameVal]   = useState("");
  const [orgBioVal,    setOrgBioVal]    = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [converting,   setConverting]   = useState(false);
  const [convertErr,   setConvertErr]   = useState<string | null>(null);
  const [converted,    setConverted]    = useState(false);

  // Notification state
  const [prefs,        setPrefs]        = useState<NotifPrefs>(notifPrefs);
  const [savingNotif,  setSavingNotif]  = useState(false);

  function toggleCat(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

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
          organizer_category: selectedCats,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json() as { error?: string };
        throw new Error(error ?? "Something went wrong");
      }
      setConverted(true);
      setShowOrgForm(false);
    } catch (e) {
      setConvertErr((e as Error).message);
    } finally {
      setConverting(false);
    }
  }

  async function handleNotifToggle(key: keyof NotifPrefs) {
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

  const inputCls =
    "w-full rounded-[12px] border border-white/10 bg-white/6 px-4 py-3 text-[13px] text-white placeholder-white/25 outline-none transition focus:border-[#4a9f63]/50 focus:ring-1 focus:ring-[#4a9f63]/20";

  const isOrganizerNow = isOrganizer || converted;

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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/6">
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
                <CaretDown
                  size={14}
                  className="shrink-0 text-[var(--text-tertiary)] transition-transform"
                />
              </button>
            ) : (
              <div className="mt-4 space-y-4 rounded-[14px] border border-[#4a9f63]/20 bg-[#4a9f63]/6 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#4a9f63]">
                    Organizer Setup
                  </p>
                  <button
                    onClick={() => { setShowOrgForm(false); setConvertErr(null); }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Organization Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={orgNameVal}
                    onChange={(e) => setOrgNameVal(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Sankofa Sessions"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
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
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ORGANIZER_CATEGORIES.map((cat) => {
                      const active = selectedCats.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCat(cat)}
                          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition active:scale-[0.96] ${
                            active
                              ? "border-[#4a9f63]/50 bg-[#4a9f63]/20 text-[#4a9f63]"
                              : "border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20"
                          }`}
                        >
                          {active && <Check size={9} className="mr-1 inline" weight="bold" />}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {convertErr && (
                  <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
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
            {savingNotif && (
              <span className="ml-2 text-[#4a9f63]">saving…</span>
            )}
          </p>
        </div>
        {(
          [
            { key: "email"  as const, label: "Email notifications",  desc: "Event reminders and receipts" },
            { key: "push"   as const, label: "Push notifications",   desc: "Real-time alerts on your device" },
            { key: "in_app" as const, label: "In-app notifications", desc: "Activity bell in the app" },
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
                prefs[key] ? "bg-[#4a9f63]" : "bg-white/12"
              }`}
            >
              <div
                className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  prefs[key] ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            </div>
          </button>
        ))}
      </section>

    </div>
  );
}
