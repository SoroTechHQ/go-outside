import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShareNetwork, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { getAttendeeTicketById, getEventBySlug, type AttendeeTicket } from "@gooutside/demo-data";
import { TicketQr } from "../../../../components/ticket-qr";
import { AtroposTicket } from "../../../../components/wallet/AtroposTicket";

// ─── Tier styles ──────────────────────────────────────────────────────────────

type TierStyle = {
  card: string;
  glow: string;
  label: string;
  value: string;
  divider: string;
  gate: string;
  badge: string;
  badgeText: string;
  scanText: string;
};

function getTierStyle(tier: AttendeeTicket["tier"]): TierStyle {
  if (tier === "gold") {
    return {
      card: "from-[#3d2200] via-[#5a3400] to-[#3a2100]",
      glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(200,124,42,0.14),transparent_55%)]",
      label: "text-[#c87c2a]",
      value: "text-white",
      divider: "bg-[#c87c2a]/20",
      gate: "text-[#c87c2a]",
      badge: "border-[#c87c2a]/40 bg-[#c87c2a]/10",
      badgeText: "text-[#d4973a]",
      scanText: "text-[#c87c2a]",
    };
  }
  if (tier === "silver") {
    return {
      card: "from-[#1e2420] via-[#252d27] to-[#191e1a]",
      glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(122,154,132,0.10),transparent_55%)]",
      label: "text-[#7a9a84]",
      value: "text-white",
      divider: "bg-[#7a9a84]/20",
      gate: "text-[#7a9a84]",
      badge: "border-[#7a9a84]/40 bg-[#7a9a84]/10",
      badgeText: "text-[#9ab4a0]",
      scanText: "text-[#7a9a84]",
    };
  }
  return {
    card: "from-[#0e2212] via-[#152a1a] to-[#0b1a10]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(47,143,69,0.14),transparent_55%)]",
    label: "text-[#4a9f63]",
    value: "text-white",
    divider: "bg-[#4a9f63]/20",
    gate: "text-[#4a9f63]",
    badge: "border-[#4a9f63]/40 bg-[#4a9f63]/10",
    badgeText: "text-[#4a9f63]",
    scanText: "text-[#4a9f63]",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WalletTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = getAttendeeTicketById(id);
  if (!ticket) notFound();

  const event = getEventBySlug(ticket.eventSlug);
  if (!event) notFound();

  const s = getTierStyle(ticket.tier);
  const isPast = ticket.status === "past";
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-24">

      {/* Back nav */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[color:rgba(var(--bg-card-rgb),0.88)] px-4 py-3 backdrop-blur-md">
        <Link
          href="/dashboard/wallets"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {isPast ? "Past Ticket" : "Your Ticket"}
        </span>
        {isPast && (
          <span className="ml-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-400">
            Expired
          </span>
        )}
      </div>

      <div className="mx-auto max-w-sm px-4 py-8">

        {/* ── Ticket card with Atropos parallax ── */}
        <AtroposTicket>
          <div
            className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${s.card} p-6 shadow-[0_40px_90px_rgba(0,0,0,0.5)] ${isPast ? "opacity-90" : ""}`}
          >
            {/* Glow layer */}
            <div className={`pointer-events-none absolute inset-0 ${s.glow}`} />

            {/* Past expired overlay */}
            {isPast && (
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-black/20" />
            )}

            {/* ── Header: Brand + Verified ── */}
            <div className="relative flex items-start justify-between" data-atropos-offset="1">
              <span className="text-sm font-bold tracking-tight text-white">GoOutside</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${s.badge} ${s.badgeText}`}
              >
                <CheckCircle size={10} weight="fill" />
                Verified
              </span>
            </div>

            {/* ── Event name + year ── */}
            <div className="relative mt-5" data-atropos-offset="3">
              <h1 className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">
                {event.title}
              </h1>
              <p className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">
                {year}
              </p>
            </div>

            {/* Divider */}
            <div className={`relative mt-5 h-px ${s.divider}`} data-atropos-offset="0" />

            {/* ── DATE / TIME / VENUE ── */}
            <div className="relative mt-4 grid grid-cols-3 gap-3" data-atropos-offset="1">
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Date</p>
                <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>
                  {event.dateLabel.replace(/^[^,]+,\s*/, "")}
                </p>
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Time</p>
                <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>
                  {event.timeLabel}
                </p>
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Venue</p>
                <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>
                  {event.venue}
                </p>
              </div>
            </div>

            {/* ── SECTION / SEAT/ZONE / ISSUED ── */}
            <div className="relative mt-4 grid grid-cols-3 gap-3" data-atropos-offset="1">
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Section</p>
                <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>
                  {ticket.typeLabel}
                </p>
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Seat/Zone</p>
                <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>
                  {ticket.seatLabel}
                </p>
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Issued</p>
                <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>
                  {event.city}
                </p>
              </div>
            </div>

            {/* ── Ticket holder ── */}
            <div className="relative mt-5" data-atropos-offset="2">
              <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>
                Ticket Holder
              </p>
              <p className="mt-1 text-[1.35rem] font-bold uppercase tracking-[0.06em] text-white">
                {ticket.holderName}
              </p>
            </div>

            {/* Divider */}
            <div className={`relative mt-5 h-px ${s.divider}`} data-atropos-offset="0" />

            {/* ── QR code — pops forward most ── */}
            <div className="relative mt-5 flex justify-center" data-atropos-offset="6">
              <div className={isPast ? "opacity-40 grayscale" : ""}>
                <TicketQr reference={ticket.reference} />
              </div>
              {isPast && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <WarningCircle size={36} className="text-orange-400" weight="fill" />
                  <span className="text-xs font-semibold text-orange-300">No longer valid</span>
                </div>
              )}
            </div>

            {/* ── Footer row ── */}
            <div className="relative mt-5 flex items-center justify-between" data-atropos-offset="1">
              <span className={`text-sm font-bold ${s.gate}`}>Go</span>
              <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${s.scanText}`}>
                {isPast ? "Event Ended" : "Scan at Gate"}
              </span>
            </div>
          </div>
        </AtroposTicket>

        {/* Reference pill */}
        <div className="mt-4 flex justify-center">
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-2 text-[11px] font-semibold tracking-[0.12em] text-[var(--text-secondary)]">
            {ticket.reference}
          </span>
        </div>

        {/* ── Actions ── */}
        <div className="mt-6 space-y-3">
          {isPast ? (
            <>
              {/* Expired notice */}
              <div className="flex items-start gap-3 rounded-[16px] border border-orange-500/20 bg-orange-500/6 px-4 py-4">
                <WarningCircle size={18} className="mt-0.5 shrink-0 text-orange-400" weight="fill" />
                <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  This ticket is no longer valid. The event has already taken place.
                </p>
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                type="button"
              >
                <ShareNetwork size={17} />
                {ticket.shareLabel}
              </button>
            </>
          ) : (
            <>
              <a
                className="flex w-full items-center justify-center rounded-full bg-[var(--brand)] py-3.5 text-sm font-bold text-[var(--brand-contrast)] transition hover:opacity-90"
                href="#"
              >
                {ticket.calendarLabel}
              </a>
              <a
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                href="#"
              >
                <ShareNetwork size={17} />
                {ticket.shareLabel}
              </a>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
