"use client";

import Link from "next/link";
import Atropos from "atropos/react";
import "atropos/css";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { AttendeeTicket, EventItem } from "@gooutside/demo-data";
import { TicketQr } from "../ticket-qr";

// ─── Tier styles (mirrors [id]/page.tsx exactly) ──────────────────────────────

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
  // default — green
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
// Same layout as [id]/page.tsx lines 103-218, adapted for stack context.

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

  // Top card gets the highest parallax offset — it "floats" furthest forward.
  // Each card below gets progressively lower offsets.
  const base = (totalCards - cardIndex) * 2; // e.g. 2 cards: top=4, bottom=2

  const o = (extra: number) => String(base + extra);

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${s.card} p-6 shadow-[0_32px_72px_rgba(0,0,0,0.55)] opacity-90`}
      data-atropos-offset={String(base)}
      // Darken lower cards so the top card clearly "owns" the stack
      style={{ filter: cardIndex === 0 ? "none" : `brightness(${1 - cardIndex * 0.07})` }}
    >
      {/* Radial glow */}
      <div className={`pointer-events-none absolute inset-0 ${s.glow}`} />

      {/* Expired tint */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-black/18" />

      {/* ── Header: brand + verified ── */}
      <div
        className="relative flex items-start justify-between"
        data-atropos-offset={o(1)}
      >
        <span className="text-sm font-bold tracking-tight text-white">GoOutside</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${s.badge} ${s.badgeText}`}
        >
          <CheckCircle size={10} weight="fill" />
          Verified
        </span>
      </div>

      {/* ── Event name + year ── */}
      <div className="relative mt-5" data-atropos-offset={o(3)}>
        <h2 className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">
          {event.title}
        </h2>
        <p className="font-display text-[2.1rem] font-bold italic leading-[1.04] text-white">
          {year}
        </p>
      </div>

      {/* Divider */}
      <div className={`relative mt-5 h-px ${s.divider}`} data-atropos-offset={o(0)} />

      {/* ── DATE / TIME / VENUE ── */}
      <div
        className="relative mt-4 grid grid-cols-3 gap-3"
        data-atropos-offset={o(1)}
      >
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
      <div
        className="relative mt-4 grid grid-cols-3 gap-3"
        data-atropos-offset={o(1)}
      >
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
      <div className="relative mt-5" data-atropos-offset={o(2)}>
        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${s.label}`}>
          Ticket Holder
        </p>
        <p className="mt-1 text-[1.35rem] font-bold uppercase tracking-[0.06em] text-white">
          {ticket.holderName}
        </p>
      </div>

      {/* Divider */}
      <div className={`relative mt-5 h-px ${s.divider}`} data-atropos-offset={o(0)} />

      {/* ── QR code — pops forward most ── */}
      <div className="relative mt-5 flex justify-center" data-atropos-offset={o(6)}>
        <div className="opacity-40 grayscale">
          <TicketQr reference={ticket.reference} />
        </div>
        {/* Expired overlay on QR */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <WarningCircle size={34} className="text-orange-400" weight="fill" />
          <span className="text-xs font-semibold text-orange-300">Event Ended</span>
        </div>
      </div>

      {/* ── Footer row ── */}
      <div
        className="relative mt-5 flex items-center justify-between"
        data-atropos-offset={o(1)}
      >
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

// Each card peeks this many px below the card above it
const PEEK = 172;

// ─── Stacked wrapper ──────────────────────────────────────────────────────────

export function StackedPastTickets({ tickets, events }: Props) {
  const count = tickets.length;

  return (
    <Atropos
      activeOffset={22}
      shadow
      shadowScale={1.05}
      shadowOffset={44}
      rotateXMax={8}
      rotateYMax={8}
      rotateTouch="scroll-y"
      className="w-full"
    >
      {/*
        Inner div must be `position: relative` and its height must accommodate
        every stacked card. Since cards are absolute, we pad the container
        with enough room: the top card fills naturally, each extra card adds PEEK.
        We use padding-bottom instead of a fixed height so the QR + footer
        of the top card always fits.
      */}
      <div
        className="relative w-full"
        style={{ paddingBottom: (count - 1) * PEEK }}
      >
        {tickets.map((ticket, i) => {
          const event = events[i];
          if (!event) return null;

          const isTop = i === 0;

          return (
            <Link
              key={ticket.id}
              href={`/dashboard/wallets/${ticket.id}`}
              className="block"
              style={
                isTop
                  ? undefined
                  : {
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `calc(100% - ${(count - i) * PEEK}px)`,
                      zIndex: count - i,
                    }
              }
            >
              <FullTicketCard
                cardIndex={i}
                event={event}
                ticket={ticket}
                totalCards={count}
              />
            </Link>
          );
        })}
      </div>
    </Atropos>
  );
}
