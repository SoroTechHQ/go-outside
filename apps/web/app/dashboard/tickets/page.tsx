import { demoData, getEventBySlug } from "@gooutside/demo-data";
import { Button, SectionHeader, ShellCard, StatusPill } from "@gooutside/ui";

export default function TicketsPage() {
  const tickets = demoData.attendee.tickets;

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell py-10">
        <SectionHeader
          eyebrow="Attendee"
          index="01"
          title="My Tickets"
          description="Your confirmed bookings and entry passes."
        />

        <div className="mt-8 grid gap-5">
          {tickets.map((ticket) => {
            const event = getEventBySlug(ticket.eventSlug);
            return (
              <ShellCard key={ticket.id} className="grid gap-4 sm:grid-cols-[1fr,auto] sm:items-center">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--neon)]">
                    {ticket.typeLabel}
                  </p>
                  <h2 className="mt-2 font-display text-3xl italic text-[var(--text-primary)]">
                    {event?.title ?? ticket.eventSlug}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill tone={ticket.status === "active" ? "live" : "pending"}>{ticket.status}</StatusPill>
                    <StatusPill tone="draft">{ticket.reference}</StatusPill>
                    <StatusPill tone="free">{ticket.seatLabel}</StatusPill>
                  </div>
                </div>
                <Button href={`/dashboard/tickets/${ticket.id}`}>Open Ticket</Button>
              </ShellCard>
            );
          })}
        </div>
      </div>
    </main>
  );
}
