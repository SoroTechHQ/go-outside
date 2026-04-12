"use client";

import Link from "next/link";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { AttendeeTicket, EventItem } from "@gooutside/demo-data";
import { TicketQr } from "../ticket-qr";

// ─── Tier styles ──────────────────────────────────────────────────────────────

type TierStyle = {
  card: string; glow: string; label: string; value: string;
  divider: string; gate: string; badge: string; badgeText: string; scanText: string;
};

function getTierStyle(tier: AttendeeTicket["tier"]): TierStyle {
  if (tier === "gold") return {
    card: "from-[#3d2200] via-[#5a3400] to-[#3a2100]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(200,124,42,0.14),transparent_55%)]",
    label: "text-[#c87c2a]", value: "text-white", divider: "bg-[#c87c2a]/20",
    gate: "text-[#c87c2a]", badge: "border-[#c87c2a]/40 bg-[#c87c2a]/10",
    badgeText: "text-[#d4973a]", scanText: "text-[#c87c2a]",
  };
  if (tier === "silver") return {
    card: "from-[#1e2420] via-[#252d27] to-[#191e1a]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(122,154,132,0.10),transparent_55%)]",
    label: "text-[#7a9a84]", value: "text-white", divider: "bg-[#7a9a84]/20",
    gate: "text-[#7a9a84]", badge: "border-[#7a9a84]/40 bg-[#7a9a84]/10",
    badgeText: "text-[#9ab4a0]", scanText: "text-[#7a9a84]",
  };
  return {
    card: "from-[#0e2212] via-[#152a1a] to-[#0b1a10]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(47,143,69,0.14),transparent_55%)]",
    label: "text-[#4a9f63]", value: "text-white", divider: "bg-[#4a9f63]/20",
    gate: "text-[#4a9f63]", badge: "border-[#4a9f63]/40 bg-[#4a9f63]/10",
    badgeText: "text-[#4a9f63]", scanText: "text-[#4a9f63]",
  };
}

// ─── Ticket card ──────────────────────────────────────────────────────────────

function FullTicketCard({ ticket, event, cardIndex, totalCards }: {
  ticket: AttendeeTicket; event: EventItem; cardIndex: number; totalCards: number;
}) {
  const s = getTierStyle(ticket.tier);
  const year = new Date().getFullYear();

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${s.card} p-6 shadow-[0_32px_72px_rgba(0,0,0,0.55)]`}
      style={{ filter: cardIndex === 0 ? "none" : `brightness(${1 - cardIndex * 0.08})` }}
    >
      <div className={`pointer-events-none absolute inset-0 ${s.glow}`} />
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-black/[0.08]" />

      <div className="relative flex items-start justify-between">
        <span className="text-sm font-bold tracking-tight text-white">GoOutside</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${s.badge} ${s.badgeText}`}>
          <CheckCircle size={10} weight="fill" /> Verified
        </span>
      </div>

      <div className="relative mt-5">
        <h2 className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">{event.title}</h2>
        <p className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">{year}</p>
      </div>

      <div className={`relative mt-5 h-px ${s.divider}`} />

      <div className="relative mt-4 grid grid-cols-3 gap-3">
        {([ ["Date", event.dateLabel.replace(/^[^,]+,\s*/, "")], ["Time", event.timeLabel], ["Venue", event.venue] ] as const).map(([l, v]) => (
          <div key={l}>
            <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>{l}</p>
            <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-3">
        {([ ["Section", ticket.typeLabel], ["Seat/Zone", ticket.seatLabel], ["Issued", event.city] ] as const).map(([l, v]) => (
          <div key={l}>
            <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>{l}</p>
            <p className={`mt-1 text-[12px] font-semibold leading-tight ${s.value}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-5">
        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>Ticket Holder</p>
        <p className="mt-1 text-[1.35rem] font-bold uppercase tracking-[0.06em] text-white">{ticket.holderName}</p>
      </div>

      <div className={`relative mt-5 h-px ${s.divider}`} />

      <div className="relative mt-5 flex justify-center">
        <div className="opacity-40 grayscale"><TicketQr reference={ticket.reference} /></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <WarningCircle size={34} className="text-orange-400" weight="fill" />
          <span className="text-xs font-semibold text-orange-300">Event Ended</span>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className={`text-sm font-bold ${s.gate}`}>Go</span>
        <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${s.scanText}`}>Event Ended</span>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = { tickets: AttendeeTicket[]; events: (EventItem | undefined)[]; };

/*
  PEEK = how many px of the card below are visible under the card above.
  This is the ONLY constant you ever need to tune.
  Negative margin approach: no JS measurement needed at all.

  Each card after the first gets a negative margin-top that pulls it
  up underneath the previous card. The amount to pull up is calculated
  as: -(100% of card height) + PEEK.

  BUT: margin % in CSS is relative to the *parent width*, not height.
  So we can't use % here directly on margin-top.

  Instead: we set each card wrapper to `position: relative` and use
  a translateY to move cards 1+ upward. Cards render in normal flow
  (each takes up full height in the document), then we translate them
  up so they visually overlap.

  The trick: we also set negative margin-top equal to the translateY
  so the *flow* collapses too — otherwise each card still takes up
  its full height in layout and we get the vertical list problem.

  Since we can't know card height in CSS without JS, we use a known
  fixed approximation for the negative margin but make it safe by also
  setting overflow:hidden on the container — so even if we're off by
  a little, nothing bleeds out.

  Tuning: if cards overlap too much → increase PULL_UP
          if cards don't overlap enough → decrease PULL_UP
  PULL_UP should equal roughly (card rendered height - PEEK).
*/

import { PEEK, PULL_UP } from "./stackConfig";
export { PEEK, PULL_UP, stackTopMargin } from "./stackConfig";

export function StackedPastTickets({ tickets, events }: Props) {
  const count = tickets.length;

  return (
    <div className="relative w-full">
      {tickets.map((ticket, i) => {
        const event = events[i];
        if (!event) return null;

        return (
          <div
            key={ticket.id}
            style={{
              // Pull every card after the first upward so it overlaps
              // the card above it, leaving only PEEK px visible.
              marginTop: i === 0 ? 0 : -PULL_UP,
              // Higher i = further back in the stack = lower z-index
              position: "relative",
              zIndex: count - i,
            }}
          >
            <Link href={`/dashboard/wallets/${ticket.id}`} className="block">
              <FullTicketCard
                cardIndex={i}
                event={event}
                ticket={ticket}
                totalCards={count}
              />
            </Link>
          </div>
        );
      })}
    </div>
  );
}