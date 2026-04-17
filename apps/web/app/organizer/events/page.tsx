import Link from "next/link";
import { ArrowRight, Ticket } from "@phosphor-icons/react/dist/ssr";
import EventCardMini from "../_components/EventCardMini";
import { getOrganizerDashboardData } from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";

export default async function OrganizerEventsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const dashboard = user.role === "organizer" || user.role === "admin"
    ? await getOrganizerDashboardData(user.id)
    : null;

  if (!dashboard) return null;

  return (
    <div className="p-5 md:p-7">
      <section className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_16px_44px_rgba(6,14,9,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Workspace
            </p>
            <h1 className="mt-3 font-display text-[2.2rem] italic text-[var(--text-primary)]">My Events</h1>
            <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[var(--text-secondary)]">
              Event list plus quick per-event stats. This expands the dashboard table from the mockup into its own workspace page.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black"
            href="/organizer/events/new"
          >
            <Ticket size={16} weight="fill" />
            New Event
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {dashboard.recentEvents.map((event) => (
          <EventCardMini
            key={event.id}
            capacity={event.capacity}
            category={event.category}
            dateLabel={event.dateLabel}
            revenue={event.revenue}
            snippets={event.snippets}
            sold={event.sold}
            soldRatio={event.soldRatio}
            statusLabel={event.statusLabel}
            statusTone={event.statusTone}
            title={event.title}
            venue={event.venue}
          />
        ))}
      </section>

      <section className="mt-6 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <Link className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)]" href="/organizers">
          Public organizer directory
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
