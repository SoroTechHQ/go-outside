// ── Types ────────────────────────────────────────────────────────────────────

export type NavLink = {
  label: string;
  href: string;
  iconKey?: string;
};

export type Category = {
  slug: string;
  name: string;
  iconKey: string;
  description: string;
};

export type Organizer = {
  id: string;
  name: string;
  tag: string;
  city: string;
  verified: boolean;
  followersLabel: string;
  eventsLabel: string;
};

export type TicketType = {
  id: string;
  name: string;
  price: number;
  priceType: "free" | "paid";
  priceLabel: string;
  remainingLabel: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  city: string;
  venue: string;
  locationLine: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
  priceValue: number;
  capacityLabel: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  organizerId: string;
  status: string;
  featured: boolean;
  trending: boolean;
  saved: boolean;
  rating: string;
  bannerTone: string;
  bannerUrl: string | null;
  ticketTypes: TicketType[];
  gallery: string[];
  tags: string[];
  venueLat: number | null;
  venueLng: number | null;
  startDatetime: string | null;
  endDatetime: string | null;
};

export type Review = {
  eventSlug: string;
  author: string;
  title: string;
  body: string;
  rating: string;
};

export type TicketTier = "default" | "gold" | "silver";

export type AttendeeTicket = {
  id: string;
  eventSlug: string;
  status: string;
  tier?: TicketTier;
  typeLabel: string;
  reference: string;
  seatLabel: string;
  holderName: string;
  calendarLabel: string;
  shareLabel: string;
};

// Seed types (shapes only — no JSON import)
export type SeedUser = {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  [key: string]: unknown;
};
export type SeedEvent = { id: string; slug: string; title: string; [key: string]: unknown };
export type SeedEdge  = { from_id: string; to_id: string; edge_type: string; [key: string]: unknown };
export type SeedSnippet = { id: string; body: string; rating: number; [key: string]: unknown };
export type ScarcityState = "available" | "selling_fast" | "last_few" | "sold_out";

// ── Pure utility constants (no JSON import) ───────────────────────────────────

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  music:        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  "food-drink": "https://images.unsplash.com/photo-1555244162-803834f70033",
  food:         "https://images.unsplash.com/photo-1555244162-803834f70033",
  tech:         "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  arts:         "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7",
  sports:       "https://images.unsplash.com/photo-1461896836934-ffe607ba8211",
  networking:   "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  community:    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67",
  default:      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec",
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  music:        "🎵",
  tech:         "💻",
  food:         "🍽️",
  "food-drink": "🍽️",
  arts:         "🎨",
  sports:       "⚽",
  networking:   "🤝",
  community:    "🌃",
  default:      "✨",
};

export function getCategoryEmoji(slug?: string): string {
  if (!slug) return CATEGORY_EMOJIS.default!;
  return CATEGORY_EMOJIS[slug] ?? CATEGORY_EMOJIS.default!;
}

export function getEventImage(bannerUrl?: string, categorySlug?: string): string {
  if (bannerUrl) return bannerUrl;
  const image = CATEGORY_FALLBACK_IMAGES[categorySlug ?? "default"] ?? CATEGORY_FALLBACK_IMAGES.default!;
  return `${image}?auto=format&fit=crop&w=800&q=80`;
}
