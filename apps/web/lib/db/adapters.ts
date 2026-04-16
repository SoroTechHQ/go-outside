/**
 * Adapters — map raw Supabase DB rows to the UI-compatible types
 * that the existing components (EventCard, etc.) already expect.
 */

import type { EventItem, Category, Organizer, AttendeeTicket } from "@gooutside/demo-data";

// ── Category descriptions (DB has no description column) ──────────────────

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  music:       "Live concerts, DJ sets, and everything in between. Accra's sound, amplified.",
  tech:        "Hackathons, product launches, and the innovators building Ghana's future.",
  "food-drink":"Food festivals, supper clubs, pop-up bars, and the best kitchens in Accra.",
  arts:        "Exhibitions, film nights, spoken word, and culture that moves you.",
  sports:      "Tournaments, fitness events, and community games across the city.",
  networking:  "Industry meetups, founder circles, and the connections that open doors.",
  education:   "Workshops, talks, masterclasses, and sessions worth your Saturday morning.",
  community:   "Neighbourhood events, social drives, and everything that brings Accra together.",
};

// ── Banner tone gradients per category (Tailwind classes for event banner bg) ─

const CATEGORY_BANNER_TONES: Record<string, string> = {
  music:       "from-[#2d0459] via-[#1a0230] to-[#0c0115]",
  tech:        "from-[#0c1d4a] via-[#091530] to-[#040a1a]",
  "food-drink":"from-[#3d1a00] via-[#2a1200] to-[#150900]",
  arts:        "from-[#3d0028] via-[#26001a] to-[#12000d]",
  sports:      "from-[#002d0e] via-[#001f09] to-[#000f04]",
  networking:  "from-[#002d3d] via-[#001f2a] to-[#000f14]",
  education:   "from-[#3d2a00] via-[#2a1e00] to-[#140f00]",
  community:   "from-[#1a0240] via-[#10012a] to-[#07011a]",
};

// ── Notification type → AppIcon key ──────────────────────────────────────────

const NOTIFICATION_ICON_MAP: Record<string, string> = {
  ticket_purchase: "ticket",
  event_reminder:  "bell",
  friend_going:    "users",
  review_reply:    "message-square",
  new_follower:    "user-plus",
  event_cancelled: "x-circle",
  event_update:    "refresh-cw",
  default:         "bell",
};

// ── Date / time formatters ───────────────────────────────────────────────────

function formatEventDate(dt: string): string {
  const d = new Date(dt);
  const day  = d.toLocaleDateString("en-GH", { weekday: "short" });
  const date = d.getDate();
  const mon  = d.toLocaleDateString("en-GH", { month: "short" });
  return `${day}, ${date} ${mon}`;
}

function formatEventTime(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatTimeAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Category adapter ────────────────────────────────────────────────────────

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  icon_key: string;
  color: string | null;
  is_active: boolean;
  sort_order: number;
};

export function adaptCategory(row: DbCategory): Category {
  return {
    slug:        row.slug,
    name:        row.name,
    iconKey:     row.icon_key,
    description: CATEGORY_DESCRIPTIONS[row.slug] ?? row.name,
  };
}

// ── Organizer adapter ────────────────────────────────────────────────────────

export type DbOrganizerRow = {
  user_id:           string;
  organization_name: string;
  status:            string;
  total_events:      number;
  users: {
    id:            string;
    first_name:    string;
    last_name:     string;
    location_city: string | null;
  };
  follower_count?: number;
};

export function adaptOrganizer(row: DbOrganizerRow): Organizer {
  const followers = row.follower_count ?? 0;
  return {
    id:             row.users.id,
    name:           row.organization_name,
    tag:            `@${row.users.first_name.toLowerCase()}${row.users.last_name.toLowerCase()}`,
    city:           row.users.location_city ?? "Accra",
    verified:       row.status === "approved",
    followersLabel: `${followers.toLocaleString()} follower${followers !== 1 ? "s" : ""}`,
    eventsLabel:    `${row.total_events} event${row.total_events !== 1 ? "s" : ""}`,
  };
}

// ── Event adapter ───────────────────────────────────────────────────────────

export type DbTicketTypeRow = {
  id:             string;
  name:           string;
  price:          number;
  price_type:     "free" | "paid";
  quantity_total: number | null;
  quantity_sold:  number;
  is_active:      boolean;
};

export type DbVenueRow = {
  id:   string;
  name: string;
  city: string;
  address: string;
};

export type DbEventRow = {
  id:                string;
  slug:              string;
  title:             string;
  description:       string;
  short_description: string | null;
  banner_url:        string | null;
  gallery_urls:      string[];
  start_datetime:    string;
  end_datetime:      string;
  total_capacity:    number | null;
  tickets_sold:      number;
  status:            string;
  is_featured:       boolean;
  avg_rating:        number | null;
  reviews_count:     number;
  saves_count:       number;
  tags:              string[];
  organizer_id:      string;
  is_online:         boolean;
  custom_location:   string | null;
  categories:        DbCategory;
  venues:            DbVenueRow | null;
  ticket_types:      DbTicketTypeRow[];
};

export function adaptEvent(row: DbEventRow): EventItem {
  const cat    = row.categories;
  const venue  = row.venues;
  const tts    = (row.ticket_types ?? []).filter((t) => t.is_active);

  const prices    = tts.map((t) => Number(t.price));
  const minPrice  = prices.length ? Math.min(...prices) : 0;
  const maxPrice  = prices.length ? Math.max(...prices) : 0;
  const isFree    = tts.length === 0 || tts.every((t) => t.price_type === "free");

  const priceLabel = isFree
    ? "Free"
    : minPrice === maxPrice
    ? `GHS ${minPrice.toLocaleString()}`
    : `GHS ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}`;

  const locationName = venue?.name ?? row.custom_location ?? (row.is_online ? "Online" : "TBA");
  const locationCity = venue?.city ?? "Accra";

  const remaining = row.total_capacity != null
    ? row.total_capacity - row.tickets_sold
    : null;
  const capacityLabel = remaining != null
    ? `${remaining.toLocaleString()} left`
    : "Open entry";

  return {
    id:               row.id,
    slug:             row.slug,
    title:            row.title,
    eyebrow:          cat.name,
    city:             locationCity,
    venue:            locationName,
    locationLine:     venue ? `${venue.name}, ${locationCity}` : locationName,
    dateLabel:        formatEventDate(row.start_datetime),
    timeLabel:        formatEventTime(row.start_datetime, row.end_datetime),
    priceLabel,
    priceValue:       minPrice,
    capacityLabel,
    shortDescription: row.short_description ?? row.description.slice(0, 160),
    description:      row.description,
    categorySlug:     cat.slug,
    organizerId:      row.organizer_id,
    status:           row.status === "published" ? "live" : row.status,
    featured:         row.is_featured,
    trending:         row.saves_count > 10,
    saved:            false, // overridden per-user in authenticated contexts
    rating:           row.avg_rating != null ? row.avg_rating.toFixed(1) : "—",
    bannerTone:       CATEGORY_BANNER_TONES[cat.slug] ?? "from-[#0e2212] via-[#152a1a] to-[#0b1a10]",
    ticketTypes: tts.map((t) => ({
      name:           t.name,
      priceLabel:     t.price_type === "free" ? "Free" : `GHS ${Number(t.price).toLocaleString()}`,
      remainingLabel: t.quantity_total != null
        ? `${(t.quantity_total - t.quantity_sold).toLocaleString()} remaining`
        : "Available",
    })),
    gallery: row.gallery_urls ?? [],
    tags:    row.tags ?? [],
  };
}

// ── Ticket adapter ───────────────────────────────────────────────────────────

function deriveTicketTier(price: number): AttendeeTicket["tier"] {
  if (price >= 200) return "gold";
  if (price >= 80)  return "silver";
  return "default";
}

export type DbTicketRow = {
  id:            string;
  status:        "active" | "used" | "cancelled" | "refunded";
  purchase_price: number;
  qr_code:       string;
  created_at:    string;
  attendee_name: string | null;
  events: {
    slug:           string;
    title:          string;
    start_datetime: string;
    end_datetime:   string;
    venues: DbVenueRow | null;
    custom_location: string | null;
    is_online:      boolean;
  };
  ticket_types: {
    name:  string;
    price: number;
  };
  users: {
    first_name: string;
    last_name:  string;
  };
};

export function adaptTicket(row: DbTicketRow): AttendeeTicket {
  const ev = row.events;
  const displayStatus = row.status === "used" ? "past" : row.status;

  return {
    id:           row.id,
    eventSlug:    ev.slug,
    status:       displayStatus,
    tier:         deriveTicketTier(Number(row.purchase_price)),
    typeLabel:    row.ticket_types.name,
    reference:    `REF-${row.id.slice(0, 8).toUpperCase()}`,
    seatLabel:    "General",
    holderName:   row.attendee_name ?? `${row.users.first_name} ${row.users.last_name}`,
    calendarLabel: formatEventDate(ev.start_datetime),
    shareLabel:   "Share",
  };
}

// ── Notification adapter ─────────────────────────────────────────────────────

export type DbNotificationRow = {
  id:         string;
  type:       string;
  title:      string;
  body:       string;
  is_read:    boolean;
  created_at: string;
};

export function adaptNotification(row: DbNotificationRow) {
  return {
    id:        row.id,
    iconKey:   NOTIFICATION_ICON_MAP[row.type] ?? NOTIFICATION_ICON_MAP.default,
    title:     row.title,
    meta:      row.body,
    timeLabel: formatTimeAgo(row.created_at),
    isRead:    row.is_read,
  };
}
