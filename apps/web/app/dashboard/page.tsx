import Link from "next/link";
import {
  demoData,
  getAttendeeTicketById,
  getCategoryBySlug,
  getEventBySlug,
  getOrganizerById,
  getRecommendedEvents,
  getSavedEvents,
} from "@gooutside/demo-data";
import { Button, EventCard, MobileBottomNav, SectionHeader, ShellCard, StatusPill } from "@gooutside/ui";
import { PublicHeader } from "../../components/public-header";

export default function DashboardPage() {
  const ticket = getAttendeeTicketById(demoData.attendee.upcomingTicketId);
  const upcomingEvent = ticket ? getEventBySlug(ticket.eventSlug) : undefined;
  const organizer = upcomingEvent ? getOrganizerById(upcomingEvent.organizerId) : undefined;
  const savedEvents = getSavedEvents();
  const recommendedEvents = getRecommendedEvents();

  return (
    <main className="pb-24">
      <PublicHeader />
      <div className="container-shell py-10">
        <SectionHeader
          description={demoData.attendee.homeHeading}
          eyebrow={demoData.attendee.roleLabel}
          index="07"
          title={`Hey, ${demoData.attendee.name}`}
        />

        {ticket && upcomingEvent && organizer ? (
          <ShellCard className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">Upcoming ticket</p>
              <h2 className="mt-4 font-display text-4xl italic text-[var(--text-primary)]">{upcomingEvent.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{upcomingEvent.shortDescription}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <StatusPill tone="live">{ticket.status}</StatusPill>
                <StatusPill tone="free">{ticket.typeLabel}</StatusPill>
                <StatusPill tone="draft">{ticket.reference}</StatusPill>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={`/dashboard/tickets/${ticket.id}`}>Open Ticket</Button>
                <Button href="/events" variant="ghost">Keep Exploring</Button>
              </div>
            </div>
            <div className={`rounded-[24px] border border-[var(--border-subtle)] bg-gradient-to-br ${upcomingEvent.bannerTone} p-6`}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">{upcomingEvent.dateLabel}</p>
              <div className="mt-4 font-display text-3xl italic text-white">{upcomingEvent.venue}</div>
              <p className="mt-3 text-sm text-white/70">{organizer.name}</p>
            </div>
          </ShellCard>
        ) : null}

        <section className="mt-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Saved events</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Events you may want to revisit before they sell out.</p>
            </div>
            <Link className="text-sm font-semibold text-[var(--neon)]" href="/events?saved=true">Open feed</Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {savedEvents.map((event) => {
              const category = getCategoryBySlug(event.categorySlug);
              const savedOrganizer = getOrganizerById(event.organizerId);
              return category && savedOrganizer ? (
                <EventCard key={event.id} category={category} event={event} organizer={savedOrganizer} />
              ) : null;
            })}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Recommended for you</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Based on your saved scenes and recent ticket behavior.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {recommendedEvents.map((event) => {
              const category = getCategoryBySlug(event.categorySlug);
              const recommendedOrganizer = getOrganizerById(event.organizerId);
              return category && recommendedOrganizer ? (
                <EventCard key={event.id} category={category} event={event} organizer={recommendedOrganizer} />
              ) : null;
            })}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <h2 className="font-display text-3xl italic text-[var(--text-primary)]">Recent activity</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Notification previews from your attendee inbox.</p>
          </div>
          <div className="grid gap-4">
            {demoData.attendee.notifications.map((item) => (
              <ShellCard key={item.title} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.meta}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{item.timeLabel}</p>
              </ShellCard>
            ))}
          </div>
        </section>
      </div>
      <MobileBottomNav links={demoData.navigation.attendeeTabs} />
    </main>
  );
}
