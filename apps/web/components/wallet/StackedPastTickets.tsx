"use client";

import { useRef } from "react";
import Link from "next/link";
import Atropos from "atropos/react";
import "atropos/css";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { AttendeeTicket, EventItem } from "@gooutside/demo-data";
import { TicketQr } from "../ticket-qr";

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

// ─── Full ticket card ─────────────────────────────────────────────────────────

function FullTicketCard({
  ticket,
  event,
  cardIndex,
  totalCards,
}: {
  ticket: AttendeeTicket;
  event: EventItem;
  cardIndex: number;
  totalCards: number;
}) {
  const s = getTierStyle(ticket.tier);
  const year = new Date().getFullYear();
  const base = (totalCards - cardIndex) * 2;
  const o = (extra: number) => String(base + extra);

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${s.card} p-6 shadow-[0_32px_72px_rgba(0,0,0,0.55)]`}
      data-atropos-offset={String(base)}
      style={{
        // BUG FIX 1: removed opacity-90 class — it was making lower cards
        // fade out but also dimming the top card unintentionally.
        // Use brightness only on lower cards for the depth effect.
        filter: cardIndex === 0 ? "none" : `brightness(${1 - cardIndex * 0.08})`,
      }}
    >
      <div className={`pointer-events-none absolute inset-0 ${s.glow}`} />
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-black/[0.08]" />

      {/* Header */}
      <div className="relative flex items-start justify-between" data-atropos-offset={o(1)}>
        <span className="text-sm font-bold tracking-tight text-white">GoOutside</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${s.badge} ${s.badgeText}`}>
          <CheckCircle size={10} weight="fill" />
          Verified
        </span>
      </div>

      {/* Event name + year */}
      <div className="relative mt-5" data-atropos-offset={o(3)}>
        <h2 className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">
          {event.title}
        </h2>
        <p className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">
          {year}
        </p>
      </div>

      <div className={`relative mt-5 h-px ${s.divider}`} data-atropos-offset={o(0)} />

      {/* Date / Time / Venue */}
      <div className="relative mt-4 grid grid-cols-3 gap-3" data-atropos-offset={o(1)}>
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

      {/* Section / Seat / Issued */}
      <div className="relative mt-4 grid grid-cols-3 gap-3" data-atropos-offset={o(1)}>
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

      {/* Ticket holder */}
      <div className="relative mt-5" data-atropos-offset={o(2)}>
        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>
          Ticket Holder
        </p>
        <p className="mt-1 text-[1.35rem] font-bold uppercase tracking-[0.06em] text-white">
          {ticket.holderName}
        </p>
      </div>

      <div className={`relative mt-5 h-px ${s.divider}`} data-atropos-offset={o(0)} />

      {/* QR */}
      <div className="relative mt-5 flex justify-center" data-atropos-offset={o(6)}>
        <div className="opacity-40 grayscale">
          <TicketQr reference={ticket.reference} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <WarningCircle size={34} className="text-orange-400" weight="fill" />
          <span className="text-xs font-semibold text-orange-300">Event Ended</span>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-5 flex items-center justify-between" data-atropos-offset={o(1)}>
        <span className={`text-sm font-bold ${s.gate}`}>Go</span>
        <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${s.scanText}`}>
          Event Ended
        </span>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tickets: AttendeeTicket[];
  events: (EventItem | undefined)[];
};

// How many px of the card below peeks out from under the card above.
// This only needs to show the top strip (brand + event name) of each card.
const PEEK = 120;

// ─── Stacked wrapper ──────────────────────────────────────────────────────────

export function StackedPastTickets({ tickets, events }: Props) {
  const count = tickets.length;

  // Key fix: Atropos wraps each card individually — NOT the whole stack.
  // Wrapping the entire stack as one Atropos plane caused the perspective
  // clipping bug: the 3D rotation treated all cards as one flat surface,
  // making lower cards slide out from the wrong edge on tilt.
  // Each card now gets its own tilt context so they behave independently.
  // Only the top card gets full tilt; lower cards get reduced rotation
  // so they feel heavier and more settled in the stack.

  return (
    <div
      className="relative w-full"
      style={{ minHeight: 560 + (count - 1) * PEEK }}
    >
      {[...tickets].reverse().map((ticket, reversedI) => {
        const i = count - 1 - reversedI;
        const event = events[i];
        if (!event) return null;

        const isTop = i === 0;
        const rotateMax = Math.max(2, 8 - i * 2);

        return (
          <div
            key={ticket.id}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * PEEK,
              zIndex: count - i,
            }}
          >
            <Atropos
              activeOffset={isTop ? 22 : 8}
              shadow={isTop}
              shadowScale={1.05}
              shadowOffset={44}
              rotateXMax={rotateMax}
              rotateYMax={rotateMax}
              rotateTouch={isTop ? "scroll-y" : false}
              className="w-full"
            >
              <Link
                href={`/dashboard/wallets/${ticket.id}`}
                className="block"
              >
                <FullTicketCard
                  cardIndex={i}
                  event={event}
                  ticket={ticket}
                  totalCards={count}
                />
              </Link>
            </Atropos>
          </div>
        );
      })}
    </div>
  );
}