import { ShellCard } from "./card";

export function StatCard({
  label,
  value,
  trend,
  tone = "neon",
}: {
  label: string;
  value: string;
  trend: string;
  tone?: "neon" | "pink" | "blue";
}) {
  const toneClass =
    tone === "pink"
      ? "text-[var(--pink)]"
      : tone === "blue"
        ? "text-[var(--blue)]"
        : "text-[var(--neon)]";

  return (
    <ShellCard className="p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="font-display text-3xl italic text-[var(--text-primary)]">{value}</span>
        <span className={`text-xs font-semibold ${toneClass}`}>{trend}</span>
      </div>
    </ShellCard>
  );
}
