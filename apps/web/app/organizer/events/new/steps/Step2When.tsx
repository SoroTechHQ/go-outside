"use client";

import { useWizard } from "../WizardContext";
import { DateTimePicker } from "../../../../../components/ui/DateTimePicker";

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
      <DateTimePicker
        label="Start date & time"
        placeholder="Pick a start date and time…"
        value={state.startDatetime}
        onChange={(val) => setField("startDatetime", val)}
        showTime
      />

      <DateTimePicker
        label="End date & time"
        placeholder="Pick an end date and time…"
        value={state.endDatetime}
        onChange={(val) => setField("endDatetime", val)}
        minDate={state.startDatetime || undefined}
        showTime
      />

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
