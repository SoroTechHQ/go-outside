import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { demoData, getEventBySlug, type AttendeeTicket, type EventItem } from "@gooutside/demo-data";
import { StackedPastTickets } from "../../../components/wallet/StackedPastTickets";

// ─── Tier helpers (server-safe) ───────────────────────────────────────────────

function tierGradient(tier: AttendeeTicket["tier"]) {
  if (tier === "gold") return "from-[#3d2200] via-[#5a3400] to-[#3a2100]";
  if (tier === "silver") return "from-[#1e2420] via-[#252d27] to-[#191e1a]";
  return "from-[#0e2212] via-[#152a1a] to-[#0b1a10]";
}

function tierAccentColor(tier: AttendeeTicket["tier"]) {
  if (tier === "gold") return "#c87c2a";
  if (tier === "silver") return "#7a9a84";
  return "#4a9f63";
}

// ─── Upcoming mini-card ───────────────────────────────────────────────────────

function UpcomingCard({ ticket, event }: { ticket: AttendeeTicket; event: EventItem }) {
  const grad = tierGradient(ticket.tier);
  const accent = tierAccentColor(ticket.tier);

  return (
    <Link
      href={`/dashboard/wallets/${ticket.id}`}
      className="group flex min-w-[160px] flex-col overflow-hidden rounded-[20px] border border-white/5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      {/* Coloured top section */}
      <div className={`bg-gradient-to-br ${grad} flex h-[112px] flex-col justify-between p-4`}>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
          {ticket.typeLabel}
        </span>
        <div>
          <p className="line-clamp-1 text-[15px] font-bold leading-tight text-white">{event.title}</p>
          <p className="mt-0.5 text-[10px]" style={{ color: accent }}>
            {event.dateLabel.replace(/^[^,]+,\s*/, "")}
          </p>
        </div>
      </div>

      {/* White/card bottom strip */}
      <div className="bg-[var(--bg-card)] px-4 py-3">
        <p className="text-[10px] text-[var(--text-tertiary)]">
          {event.timeLabel} · {event.city}
        </p>
        <div
          className="mt-2.5 w-full rounded-full py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand-contrast)]"
          style={{ backgroundColor: "var(--brand)" }}
        >
          View Ticket
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletsPage() {
  const tickets = demoData.attendee.tickets as AttendeeTicket[];
  const upcoming = tickets.filter((t) => t.status === "active");
  const past     = tickets.filter((t) => t.status === "past");

  const xpPoints: number = (demoData.attendee as unknown as { xpPoints: number }).xpPoints ?? 0;
  const xpTier: string   = (demoData.attendee as unknown as { xpTier: string }).xpTier ?? "Explorer";

  const pastEvents = past.map((t) => getEventBySlug(t.eventSlug));

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-48 text-[var(--text-primary)]">
      <div className="mx-auto max-w-lg px-4 pt-8">

        {/* ── XP / Wallet Banner ── */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0e2212] via-[#152a1a] to-[#0b1a10] px-6 py-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(47,143,69,0.18),transparent_58%)]" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-[#4a9f63]/40 bg-[#4a9f63]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a9f63]">
                {xpTier}
              </span>
              <p className="mt-3 font-display text-[2.6rem] font-bold italic leading-none tracking-tight text-white">
                {xpPoints.toLocaleString()} XP
              </p>
              <p className="mt-2 text-[11px] text-white/40">
                Earned across {tickets.length} events
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/60 transition hover:bg-white/12 hover:text-white"
            >
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* ── Upcoming Events ── */}
        <section className="mt-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Upcoming Events
            </h2>
            <span className="text-[11px] text-[var(--text-tertiary)]">{upcoming.length} active</span>
          </div>

          {upcoming.length > 0 ? (
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {upcoming.map((ticket) => {
                const event = getEventBySlug(ticket.eventSlug);
                return event ? (
                  <UpcomingCard key={ticket.id} event={event} ticket={ticket} />
                ) : null;
              })}
            </div>
          ) : ( 
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">No upcoming events.</p>
              <Link className="mt-3 inline-block text-sm font-semibold text-[var(--brand)]" href="/">
                Explore events →
              </Link>
            </div>
          )}
        </section>

        {/* ── Past Tickets — stacked + Atropos parallax ── */}
        {past.length > 0 && (
          <section className="mt-10 pb-[120px]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Past Tickets
              </h2>
              <span className="text-[11px] text-[var(--text-tertiary)]">{past.length} attended</span>
            </div>



            {/* Client component — handles stack rendering */}
            <div className="mt-24 isolate">
              <StackedPastTickets tickets={past} events={pastEvents} />
            </div>
          </section>
        )}

      </div>
    </main>
  );
}