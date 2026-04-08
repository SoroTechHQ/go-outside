import { notFound } from "next/navigation";
import { CalendarBlank, MapPinLine, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { getAttendeeTicketById, getEventBySlug } from "@gooutside/demo-data";
import { Button, StatusPill } from "@gooutside/ui";
import { TicketQr } from "../../../../components/ticket-qr";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = getAttendeeTicketById(id);

  if (!ticket) {
    notFound();
  }

  const event = getEventBySlug(ticket.eventSlug);

  if (!event) {
    notFound();
  }

  return (
    <main className="page-grid min-h-screen bg-[var(--bg-base)] pb-24 text-[var(--text-primary)]">
      <div className="container-shell py-8">
        <div className="mx-auto max-w-xl rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          <div className={`rounded-[24px] bg-gradient-to-br ${event.bannerTone} p-5`}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">{event.dateLabel}</p>
            <h1 className="mt-3 font-display text-4xl italic text-white">{event.title}</h1>
            <p className="mt-2 text-sm text-white/72">{ticket.typeLabel}</p>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <TicketQr reference={ticket.reference} />
          </div>

          <div className="mt-6 flex items-center justify-center">
            <StatusPill tone="live">{ticket.status}</StatusPill>
          </div>

          <div className="mt-6 grid gap-4 rounded-[24px] border border-white/6 bg-white/3 p-4">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <CalendarBlank size={18} />
              <span>{event.dateLabel} · {event.timeLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <MapPinLine size={18} />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/6 pt-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Reference</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{ticket.reference}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Seat</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{ticket.seatLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button className="w-full">
              <CalendarBlank size={18} />
              {ticket.calendarLabel}
            </Button>
            <Button className="w-full" variant="ghost">
              <ShareNetwork size={18} />
              {ticket.shareLabel}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
