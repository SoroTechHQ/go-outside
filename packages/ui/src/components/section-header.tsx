export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-end gap-4">
      <span className="font-display text-6xl italic leading-none text-[var(--section-number)]">
        {index}
      </span>
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--neon)]">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
