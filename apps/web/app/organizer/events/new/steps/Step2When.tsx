"use client";

import { useWizard } from "../WizardContext";

const TIMEZONES = [
  "Africa/Accra",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export function Step2When() {
  const { state, setField } = useWizard();

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Start date & time
        </label>
        <input
          className="mt-2 w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none [color-scheme:dark]"
          type="datetime-local"
          value={state.startDatetime}
          onChange={(e) => setField("startDatetime", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          End date & time
        </label>
        <input
          className="mt-2 w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none [color-scheme:dark]"
          min={state.startDatetime || undefined}
          type="datetime-local"
          value={state.endDatetime}
          onChange={(e) => setField("endDatetime", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Timezone
        </label>
        <select
          className="mt-2 w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand)]/50 focus:outline-none"
          value={state.timezone}
          onChange={(e) => setField("timezone", e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {state.startDatetime && state.endDatetime && (
        <div className="rounded-[16px] bg-[var(--bg-elevated)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Summary
          </p>
          <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
            {new Date(state.startDatetime).toLocaleDateString("en-GH", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            {new Date(state.startDatetime).toLocaleTimeString("en-GH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" – "}
            {new Date(state.endDatetime).toLocaleTimeString("en-GH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" ("}
            {state.timezone}
            {")"}
          </p>
        </div>
      )}
    </div>
  );
}
