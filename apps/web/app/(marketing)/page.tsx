import { headers } from "next/headers";
import { supabaseAdmin } from "../../lib/supabase";
import { LandingClient } from "./LandingClient";
import { LANDING_EVENTS, TICKER_EVENTS, CATEGORY_COLORS } from "../../lib/landing-data";
import type { LandingEvent, TickerEvent } from "../../lib/landing-data";

/* ── Category name normalisation ─────────────────────────────────────── */

const CATEGORY_SHORT: Record<string, string> = {
  "Music & Concerts":       "Music",
  "Tech & Innovation":      "Tech",
  "Food & Drink":           "Food",
  "Arts & Culture":         "Arts",
  "Sports & Fitness":       "Sports",
  "Business & Networking":  "Networking",
  "Education & Workshops":  "Education",
  "Community & Social":     "Community",
};

/* ── Fallback images per category ────────────────────────────────────── */

const FALLBACK_IMAGES: Record<string, string> = {
  Music:      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  Tech:       "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
  Food:       "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
  Arts:       "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80",
  Sports:     "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  Networking: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80",
  Education:  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
  Community:  "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=800&q=80",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GH", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "numeric",
    minute:  "2-digit",
  });
}

function scarcity(totalCap: number | null, sold: number): { state: string; label: string } | undefined {
  if (!totalCap) return undefined;
  const remaining = totalCap - sold;
  const ratio     = remaining / totalCap;
  if (ratio <= 0.10) return { state: "almost_sold_out", label: `${remaining} left` };
  if (ratio <= 0.25) return { state: "selling_fast",   label: "Selling fast" };
  return undefined;
}

/* ── Data fetch ───────────────────────────────────────────────────────── */

type RawEvent = {
  id:               string;
  title:            string;
  slug:             string;
  banner_url:       string | null;
  start_datetime:   string;
  total_capacity:   number | null;
  tickets_sold:     number;
  short_description: string | null;
  custom_location:  string | null;
  categories:       { name: string; color: string | null } | null;
  venues:           { name: string; city: string; address: string } | null;
  ticket_types:     { price: number; price_type: string; is_active: boolean }[];
};

async function fetchLandingEvents(visitorCity: string | null): Promise<{ events: LandingEvent[]; tickerItems: TickerEvent[] }> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      id, title, slug, banner_url, start_datetime, total_capacity, tickets_sold, short_description, custom_location,
      categories(name, color),
      venues(name, city, address),
      ticket_types(price, price_type, is_active)
    `)
    .eq("status", "published")
    .gt("start_datetime", new Date().toISOString())
    .limit(40);

  if (error || !data || data.length < 3) {
    return { events: LANDING_EVENTS, tickerItems: TICKER_EVENTS };
  }

  const raw = data as unknown as RawEvent[];

  // Geo-boost: put visitor's city events first, rest follows in DB order.
  // Shuffle happens client-side (once per page load, stable within the session).
  let sorted: RawEvent[];
  if (visitorCity) {
    const city = visitorCity.toLowerCase();
    sorted = [
      ...raw.filter((e) => e.venues?.city?.toLowerCase().includes(city)),
      ...raw.filter((e) => !e.venues?.city?.toLowerCase().includes(city)),
    ];
  } else {
    sorted = raw;
  }

  const events: LandingEvent[] = sorted.slice(0, 20).map((e) => {
    const catFull  = e.categories?.name ?? "";
    const cat      = CATEGORY_SHORT[catFull] ?? catFull.split(" ")[0] ?? "Event";
    const location = e.venues
      ? `${e.venues.name}, ${e.venues.city}`
      : (e.custom_location ?? "Accra");

    const activeTickets = e.ticket_types.filter((t) => t.is_active);
    const hasFree   = activeTickets.some((t) => t.price_type === "free");
    const minPrice  = activeTickets.length
      ? Math.min(...activeTickets.map((t) => t.price))
      : 0;
    const isFree    = hasFree || minPrice === 0;
    const priceStr  = isFree ? "Free" : `GHS ${minPrice.toLocaleString()}`;

    return {
      id:          e.id,
      slug:        e.slug,
      title:       e.title,
      category:    cat,
      eyebrow:     location.toUpperCase(),
      imageUrl:    e.banner_url ?? FALLBACK_IMAGES[cat] ?? FALLBACK_IMAGES.Music!,
      price:       priceStr,
      minPrice,
      isFree,
      date:        formatDate(e.start_datetime),
      location,
      scarcity:    scarcity(e.total_capacity, e.tickets_sold),
    };
  });

  const tickerItems: TickerEvent[] = sorted.slice(0, 12).map((e) => {
    const catFull  = e.categories?.name ?? "";
    const cat      = CATEGORY_SHORT[catFull] ?? catFull.split(" ")[0] ?? "Event";
    const city     = e.venues?.city ?? "Accra";
    const activeTickets = e.ticket_types.filter((t) => t.is_active);
    const hasFree  = activeTickets.some((t) => t.price_type === "free");
    const minP     = activeTickets.length ? Math.min(...activeTickets.map((t) => t.price)) : 0;

    let signal: string;
    if (hasFree || minP === 0) {
      signal = "Free";
    } else if (e.total_capacity) {
      const remaining = e.total_capacity - e.tickets_sold;
      signal = remaining < e.total_capacity * 0.25 ? `${remaining} left` : `GHS ${minP}`;
    } else {
      signal = `GHS ${minP}`;
    }

    return { category: cat, name: e.title, location: city, signal };
  });

  return { events, tickerItems };
}

/* ── Page (server component) ─────────────────────────────────────────── */

export default async function LandingPage() {
  // Vercel injects geo headers; fall back gracefully in dev
  const headersList  = await headers();
  const visitorCity  = headersList.get("x-vercel-ip-city") ?? null;

  const { events, tickerItems } = await fetchLandingEvents(visitorCity);

  // Ensure we always have at least 7 events for the layout (featured + grid + weekend row)
  const padded = events.length >= 7 ? events : [
    ...events,
    ...LANDING_EVENTS.slice(0, Math.max(0, 7 - events.length)),
  ];

  return <LandingClient events={padded} tickerItems={tickerItems} />;
}
