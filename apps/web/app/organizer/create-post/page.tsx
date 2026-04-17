import { CalendarBlank, Hash, MapPin, Sparkle, Ticket } from "@phosphor-icons/react/dist/ssr";

const FEATURE_ROWS = [
  { icon: Hash, label: "Hashtags", value: "#accraevents #weekendinaccra #afrobeatsnight" },
  { icon: Ticket, label: "Tagged event", value: "Afrobeats Night Vol. 8" },
  { icon: MapPin, label: "Location", value: "Front/Back, Accra" },
  { icon: CalendarBlank, label: "Schedule", value: "Saturday · 11:30 AM" },
];

export default function OrganizerCreatePostPage() {
  return (
    <div className="p-5 md:p-7">
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Content
        </p>
        <h1 className="mt-3 font-display text-[2.2rem] italic text-[var(--text-primary)]">Create Post</h1>
        <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[var(--text-secondary)]">
          The organizer post composer now reflects the PRD: event tagging, location, hashtags, and scheduled publishing all in one workspace view.
        </p>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <article className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Compose</p>
            <p className="mt-4 text-[15px] leading-8 text-[var(--text-secondary)]">
              Kwahu weekend is coming. Are you ready? Limited VIP tables left. Tap the card below and lock your spot before the weekend surge kicks in.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {FEATURE_ROWS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
                  <Icon size={16} weight="fill" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p>
                  <p className="mt-1 text-[13px] text-[var(--text-primary)]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Cross-post controls</p>
          <div className="mt-4 rounded-[24px] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Short-form feed</p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Video posts can also publish to the reels surface.</p>
              </div>
              <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--brand)]">
                On
              </span>
            </div>
          </div>

          <button
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black"
            type="button"
          >
            <Sparkle size={16} weight="fill" />
            Publish mock post
          </button>
        </aside>
      </section>
    </div>
  );
}
