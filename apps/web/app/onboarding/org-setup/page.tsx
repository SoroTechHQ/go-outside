"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Buildings, ArrowRight, CheckCircle, SpinnerGap } from "@phosphor-icons/react";

const PRIMARY_SCENES = [
  "Music & Nightlife",
  "Arts & Culture",
  "Food & Drink",
  "Sports & Fitness",
  "Tech & Business",
  "Fashion & Lifestyle",
  "Comedy & Entertainment",
  "Community & Social",
];

const inputCls =
  "w-full rounded-[12px] border border-[var(--ob-input-border)] bg-[var(--ob-input-bg)] px-4 py-3 text-[14px] text-[var(--ob-input-text)] outline-none transition focus:border-[var(--ob-input-focus-border)] focus:ring-1 focus:ring-[var(--ob-input-focus-ring)] placeholder:text-[var(--ob-input-placeholder)]";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ob-label)]";

type Status = "idle" | "submitting" | "pending" | "approved";

export default function OrgSetupPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [orgName,  setOrgName]  = useState("");
  const [bio,      setBio]      = useState("");
  const [scene,    setScene]    = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [status,   setStatus]   = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // If the user is already an organizer, skip straight to the dashboard
  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      const res = await fetch("/api/users/me").catch(() => null);
      if (!res?.ok) return;
      const data = await res.json() as { role?: string };
      if (data.role === "organizer" || data.role === "admin") {
        router.replace("/organizer");
      }
    })();
  }, [isLoaded, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = orgName.trim();
    if (!name) return;

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/account/become-organizer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          organization_name: name,
          bio:               bio.trim() || undefined,
          primary_scene:     scene || undefined,
        }),
      });
      const json = await res.json() as { ok: boolean; pending?: boolean; error?: string };

      if (!json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }

      if (json.pending) {
        setStatus("pending");
      } else {
        setStatus("approved");
        setTimeout(() => { window.location.href = "/organizer"; }, 1400);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--ob-progress-track)] border-t-[var(--brand)]" />
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(47,143,69,0.10)", border: "1px solid rgba(47,143,69,0.18)" }}
        >
          <CheckCircle size={32} weight="fill" style={{ color: "var(--brand)" }} />
        </div>
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--ob-heading)" }}>
            You&apos;re an organizer!
          </h2>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ob-text-muted)" }}>
            Taking you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.18)" }}
        >
          <SpinnerGap size={32} weight="bold" className="text-amber-500" />
        </div>
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--ob-heading)" }}>
            Application submitted
          </h2>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ob-text-muted)" }}>
            Our team will review your request. You&apos;ll be notified when it&apos;s approved — usually within 24 hours.
          </p>
        </div>
        <button
          onClick={() => { window.location.href = "/home"; }}
          className="mt-2 flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
          style={{ background: "var(--brand)" }}
        >
          Explore GoOutside while you wait <ArrowRight size={13} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--ob-stat-bg)", border: "1px solid var(--ob-stat-border)" }}
        >
          <Buildings size={30} weight="regular" style={{ color: "var(--brand)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--ob-heading)" }}>
            Set up your organizer profile
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: "var(--ob-text-muted)" }}>
            This is what attendees will see when they find your events
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>
            Organization name <span className="text-red-400">*</span>
          </label>
          <input
            ref={inputRef}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className={inputCls}
            placeholder="e.g. Sankofa Sessions"
            autoComplete="organization"
            maxLength={80}
          />
        </div>

        <div>
          <label className={labelCls}>
            Short bio{" "}
            <span className="normal-case font-normal" style={{ color: "var(--ob-text-faint)" }}>
              (optional)
            </span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="What kind of events do you run? What makes your events special?"
          />
          <p className="mt-1 text-right text-[11px]" style={{ color: "var(--ob-text-faint)" }}>
            {bio.length} / 200
          </p>
        </div>

        <div>
          <label className={labelCls}>
            Primary scene{" "}
            <span className="normal-case font-normal" style={{ color: "var(--ob-text-faint)" }}>
              (optional)
            </span>
          </label>
          <select
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            className={`${inputCls} appearance-none`}
          >
            <option value="">Select your main vibe…</option>
            {PRIMARY_SCENES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--ob-text-faint)" }}>
            Helps attendees find your profile. Your events can be any category.
          </p>
        </div>

        {error && (
          <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !orgName.trim()}
          className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white transition disabled:opacity-50 active:scale-[0.98]"
          style={{ background: "var(--brand)", boxShadow: "0 4px 16px rgba(47,143,69,0.22)" }}
        >
          {status === "submitting" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Setting up…
            </>
          ) : (
            <>Launch my dashboard <ArrowRight size={14} weight="bold" /></>
          )}
        </button>

        <p className="text-center text-[12px]" style={{ color: "var(--ob-text-faint)" }}>
          You can always update these details from your organizer settings
        </p>
      </form>

      {/* Skip link — lets them explore as attendee while waiting */}
      <div className="mt-6 text-center">
        <button
          onClick={() => { window.location.href = "/home"; }}
          className="text-[12px] transition hover:opacity-80"
          style={{ color: "var(--ob-text-faint)" }}
        >
          Skip for now and explore as attendee
        </button>
      </div>
    </div>
  );
}
