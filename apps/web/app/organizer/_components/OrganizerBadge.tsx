import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

export function OrganizerBadge({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/25 bg-[var(--brand)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)] ${className}`.trim()}
    >
      <CheckCircle size={compact ? 12 : 14} weight="fill" />
      {compact ? "Organizer" : "Verified Organizer"}
    </span>
  );
}

export default OrganizerBadge;
