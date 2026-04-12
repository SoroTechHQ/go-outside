import Link from "next/link";
import {
  demoData,
  getAttendeeTicketById,
  getCategoryBySlug,
  getCategoryEmoji,
  getEventBySlug,
  getOrganizerById,
  getRecommendedEvents,
  getSavedEvents,
} from "@gooutside/demo-data";
import { Button, EventCard } from "@gooutside/ui";
import MessagesFAB from "../../components/messages/MessagesFAB";

export default function DashboardPage() {
  const ticket = getAttendeeTicketById(demoData.attendee.upcomingTicketId);
  const upcomingEvent = ticket ? getEventBySlug(ticket.eventSlug) : undefined;
  const organizer = upcomingEvent ? getOrganizerById(upcomingEvent.organizerId) : undefined;
  const savedEvents = getSavedEvents();
  const recommendedEvents = getRecommendedEvents();
  const interests = Array.from(
    new Set([...savedEvents, ...recommendedEvents].map((event) => event.categorySlug)),
  )
    .map((slug) => getCategoryBySlug(slug))
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  return (
    <main className="page-grid min-h-screen pb-36 md:pb-24">
      <div className="container-shell px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--brand)]">
            {demoData.attendee.roleLabel}
          </p>
          <h1 className="mt-4 font-display text-[2.35rem] italic text-[var(--text-primary)] md:text-[2.8rem]">
            Hey, {demoData.attendee.name}
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {demoData.attendee.homeHeading}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[720px]">
          <section className="relative overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-7 py-8 shadow-[0_18px_48px_rgba(12,18,12,0.1)] md:px-8">
            <div className="pointer-events-none absolute left-10 right-10 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--brand),transparent)] opacity-30" />

            {ticket && upcomingEvent && organizer ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
                  Upcoming ticket
                </p>
                <h2 className="mt-4 text-center font-display text-[2rem] italic text-[var(--text-primary)] md:text-[2.25rem]">
                  {upcomingEvent.title}
                </h2>
                <p className="mx-auto mt-3 max-w-[540px] text-center text-sm leading-7 text-[var(--text-secondary)]">
                  {upcomingEvent.shortDescription}
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[ticket.status, ticket.typeLabel, ticket.reference].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button href={`/dashboard/wallets/${ticket.id}`}>Open Ticket</Button>
                  <Button href="/" variant="ghost">
                    Keep Exploring
                  </Button>
                </div>

                <div className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    {upcomingEvent.dateLabel} · {upcomingEvent.timeLabel}
                  </p>
                  <p className="mt-3 font-display text-2xl italic text-[var(--text-primary)]">
                    {upcomingEvent.venue}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{organizer.name}</p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="font-display text-3xl italic text-[var(--text-primary)]">
                  No upcoming events
                </p>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Your next night out will show up here once you book.
                </p>
                <div className="mt-6">
                  <Button href="/">Explore events</Button>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mx-auto mt-14 max-w-[920px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Your interests</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                The feed uses these first when it decides what rises.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-[var(--brand)]"
              href="/dashboard/profile#interests"
            >
              Edit interests →
            </Link>
          </div>

          <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1">
            {interests.map((interest) => (
              <span
                key={interest.slug}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
              >
                <span>{getCategoryEmoji(interest.slug)}</span>
                {interest.name}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-[1080px]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Saved events</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Events you may want to revisit before they sell out.
              </p>
            </div>
            <Link className="text-sm font-semibold text-[var(--brand)]" href="/events?saved=true">
              Open feed →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {savedEvents.map((event) => {
              const category = getCategoryBySlug(event.categorySlug);
              const savedOrganizer = getOrganizerById(event.organizerId);
              return category && savedOrganizer ? (
                <EventCard
                  key={event.id}
                  category={category}
                  event={event}
                  organizer={savedOrganizer}
                />
              ) : null;
            })}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-[1080px]">
          <div className="mb-6">
            <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Based on your vibe</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              A tighter recommendation shelf driven by recent saves and your active ticket.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {recommendedEvents.slice(0, 4).map((event) => {
              const category = getCategoryBySlug(event.categorySlug);
              const recommendedOrganizer = getOrganizerById(event.organizerId);
              return category && recommendedOrganizer ? (
                <EventCard
                  key={event.id}
                  category={category}
                  event={event}
                  organizer={recommendedOrganizer}
                />
              ) : null;
            })}
          </div>
        </section>
      </div>
      <MessagesFAB />
    </main>
  );
}
