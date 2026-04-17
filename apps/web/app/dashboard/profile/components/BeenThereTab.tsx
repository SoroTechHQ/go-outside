import Link from "next/link";
import Image from "next/image";
import { Ticket } from "@phosphor-icons/react/dist/ssr";
import { type AttendeeTicket, type EventItem, getEventImage } from "@gooutside/demo-data";

function tierGradient(tier: AttendeeTicket["tier"]) {
  if (tier === "gold")   return "from-[#3d2200] via-[#5a3400] to-[#3a2100]";
  if (tier === "silver") return "from-[#1e2420] via-[#252d27] to-[#191e1a]";
  return "from-[#0e2212] via-[#152a1a] to-[#0b1a10]";
}

function tierAccent(tier: AttendeeTicket["tier"]): string {
  if (tier === "gold")   return "#c87c2a";
  if (tier === "silver") return "#7a9a84";
  return "#4a9f63";
}

function tierLabel(tier: AttendeeTicket["tier"]): string {
  if (tier === "gold")   return "Gold VIP";
  if (tier === "silver") return "Silver";
  return "General";
}

type Props = {
  tickets: AttendeeTicket[];
  events: EventItem[];
};

export function BeenThereTab({ tickets, events }: Props) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Ticket size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-[var(--text-secondary)]">
          No past events yet
        </p>
        <Link href="/" className="mt-2 text-[12px] font-semibold text-[#4a9f63] hover:underline">
          Explore events →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {tickets.map((ticket, i) => {
        const event = events[i];
        if (!event) return null;
        const accent = tierAccent(ticket.tier);
        const grad   = tierGradient(ticket.tier);
        const hasGoldBadge = i === 0; // mock — first event earns it
        const imgUrl = getEventImage(undefined, event.categorySlug);

        return (
          <Link
            key={ticket.id}
            href={`/wallets/${ticket.id}`}
            className="group relative overflow-hidden rounded-[18px] border border-white/5 transition hover:scale-[1.02] hover:border-white/10 active:scale-[0.98]"
          >
            <div className={`bg-gradient-to-br ${grad} relative p-4`}>
              {imgUrl && (
                <Image
                  src={imgUrl}
                  alt={event.title}
                  fill
                  className="object-cover object-center opacity-20 transition group-hover:opacity-25"
                />
              )}
              {/* Gold badge indicator */}
              {hasGoldBadge && (
                <span
                  className="absolute right-3 top-3 text-[11px] font-bold"
                  style={{ color: "#DAA520" }}
                  title="Gold Badge earned"
                >
                  ✦
                </span>
              )}

              {/* Tier badge */}
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color: accent,
                  backgroundColor: `${accent}18`,
                  border: `1px solid ${accent}38`,
                }}
              >
                {tierLabel(ticket.tier)}
              </span>

              {/* Event name */}
              <p className="mt-3 line-clamp-2 font-display text-[13px] font-bold italic leading-tight text-white">
                {event.title}
              </p>

              {/* Date */}
              <p className="mt-1.5 text-[10px]" style={{ color: accent }}>
                {event.dateLabel}
              </p>

              {/* Category */}
              <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-white/25">
                {event.categorySlug}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
