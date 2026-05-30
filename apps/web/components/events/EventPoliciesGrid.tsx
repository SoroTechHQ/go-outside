import { POLICY_MAP, type EventPolicies } from "../../lib/event-policies";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

// Default fallback policies shown when no organizer-set policies exist
const DEFAULT_POLICIES: EventPolicies = {
  standard: ["cancellation_full", "age_18", "photo_allowed", "id_required"],
  custom: [],
};

export function EventPoliciesGrid({
  policies,
}: {
  policies?: EventPolicies | null;
}) {
  const { standard, custom } = policies ?? DEFAULT_POLICIES;

  return (
    <div className="space-y-3">
      {/* Icon grid for standard policies */}
      {standard.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {standard.map((key) => {
            const def = POLICY_MAP[key];
            if (!def) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)] px-3 py-2.5"
              >
                <span className={`shrink-0 ${def.color ?? "text-[var(--brand)]"}`}>{def.icon}</span>
                <span className="text-xs font-medium leading-tight text-[var(--text-secondary)]">{def.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom text policies */}
      {custom.length > 0 && (
        <div className="divide-y divide-[var(--home-border)] overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--bg-surface)]">
          {custom.map((text, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <ShieldCheck size={13} weight="fill" className="mt-0.5 shrink-0 text-[var(--brand)]" />
              <p className="text-xs text-[var(--text-secondary)]">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
