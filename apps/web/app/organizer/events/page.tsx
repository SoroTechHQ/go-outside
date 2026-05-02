import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import EventCardMini from "../_components/EventCardMini";
import { getOrganizerDashboardData } from "../_lib/dashboard";
import { getOrCreateSupabaseUser } from "../../../lib/db/users";

export default async function OrganizerEventsPage() {
  const user = await getOrCreateSupabaseUser();
  if (!user) return null;

  const dashboard =
    user.role === "organizer" || user.role === "admin"
      ? await getOrganizerDashboardData(user.id)
      : null;

  if (!dashboard) return null;

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Workspace
          </p>
          <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--text-primary)]">
            My Events
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {dashboard.organizer.totalEvents} event{dashboard.organizer.totalEvents !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-[#4fa824] active:scale-[0.97]"
          href="/organizer/events/new"
        >
          <Plus size={15} weight="bold" />
          New Event
        </Link>
      </div>

      {dashboard.recentEvents.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-16 text-center shadow-[0_4px_24px_rgba(5,12,8,0.08)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)]/10">
            <Plus size={24} className="text-[var(--brand)]" weight="bold" />
          </div>
          <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No events yet</p>
          <p className="mt-2 max-w-xs text-[13px] text-[var(--text-secondary)]">
            Create your first event and start selling tickets on GoOutside.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-[#4fa824]"
            href="/organizer/events/new"
          >
            <Plus size={15} weight="bold" />
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {dashboard.recentEvents.map((event) => (
            <Link key={event.id} className="block" href={`/organizer/events/${event.id}`}>
              <EventCardMini
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
