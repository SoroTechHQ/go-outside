import Link from "next/link";
import {
  CalendarBlank,
  CheckCircle,
  Clock,
  ImageSquare,
  MapPin,
  Ticket,
} from "@phosphor-icons/react/dist/ssr";

const FIELD_CARDS = [
  {
    icon: CalendarBlank,
    title: "Timing",
    body: "Choose the launch date, go-live window, and the best moment to open ticket sales.",
  },
  {
    icon: Ticket,
    title: "Ticketing",
    body: "Set your price ladder, reserve VIP inventory, and track capacity from the same draft.",
  },
  {
    icon: MapPin,
    title: "Venue",
    body: "Anchor the event to a reusable venue or publish with a custom location for pop-ups.",
  },
  {
    icon: ImageSquare,
    title: "Creative",
    body: "Drop in banner art, gallery frames, and the exact story you want the feed to carry.",
  },
];

export default function OrganizerNewEventPage() {
  return (
    <div className="p-5 md:p-7">
      <section className="overflow-hidden rounded-[34px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_24px_72px_rgba(6,14,9,0.12)]">
        <div className="border-b border-[var(--border-subtle)] px-6 py-6 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
            Organizer Workspace
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-[2.5rem] italic leading-none text-[var(--text-primary)]">
                Create a new event
              </h1>
              <p className="mt-4 max-w-[720px] text-[15px] leading-8 text-[var(--text-secondary)]">
                This is the next organizer surface after the dashboard: a focused event draft studio with ticketing, publishing, and promotion controls.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                href="/organizer"
              >
                Back to dashboard
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black"
                type="button"
              >
                <CheckCircle size={16} weight="fill" />
                Save draft
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:px-8 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="space-y-6">
            <article className="rounded-[28px] bg-[var(--bg-elevated)] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Draft blueprint
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {FIELD_CARDS.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
                      <Icon size={18} weight="fill" />
                    </span>
                    <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-2 text-[13px] leading-7 text-[var(--text-secondary)]">{body}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] bg-[var(--bg-elevated)] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Event title", value: "Afrobeats Night Vol. 8" },
                  { label: "Category", value: "Music & Concerts" },
                  { label: "Venue", value: "Front/Back, Accra" },
                  { label: "Date", value: "Saturday, May 16" },
                ].map((field) => (
                  <div key={field.label} className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      {field.label}
                    </p>
                    <p className="mt-2 text-[14px] font-medium text-[var(--text-primary)]">{field.value}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-4">
            <article className="rounded-[28px] bg-[var(--bg-elevated)] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
                  <Clock size={18} weight="fill" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">Launch checklist</p>
                  <p className="mt-1 text-[12px] text-[var(--text-secondary)]">The first version of this page should handle these blocks.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  "Event basics and category selection",
                  "Venue lookup or custom location",
                  "Ticket tiers, caps, and pricing",
                  "Banner upload and gallery order",
                  "Publish now vs schedule later",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[20px] bg-[var(--bg-card)] px-4 py-3">
                    <CheckCircle size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" weight="fill" />
                    <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
