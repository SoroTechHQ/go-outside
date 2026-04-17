"use client";

import { useState } from "react";
import {
  TrendUp,
  Fire,
  MapPin,
  Ticket,
  Heart,
  Users,
  ArrowRight,
  MagnifyingGlass,
  Lightning,
  Star,
  DotsThreeVertical,
  BookmarkSimple,
  Share,
} from "@phosphor-icons/react";

// ── Types ─────────────────────────────────────────────────────────────────────
type TrendingEvent = {
  id: string;
  title: string;
  category: string;
  emoji: string;
  venue: string;
  city: string;
  date: string;
  imageUrl: string;
  ticketsSold: number;
  totalTickets: number;
  saves: number;
  attendees: number;
  trending: "hot" | "rising" | "new";
  rank: number;
  rankChange: number;
  organizer: string;
  price: string;
};

type TrendingLocation = {
  id: string;
  name: string;
  city: string;
  eventCount: number;
  imageUrl: string;
  trend: number;
};

type TrendingTopic = {
  id: string;
  tag: string;
  postCount: number;
  category: string;
  trending: boolean;
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const TRENDING_EVENTS: TrendingEvent[] = [
  {
    id: "1",
    title: "Afrobeats Night ft. Sarkodie",
    category: "Music",
    emoji: "🎵",
    venue: "Accra Sports Stadium",
    city: "Accra",
    date: "Sat, May 10",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=640&fit=crop",
    ticketsSold: 4200,
    totalTickets: 5000,
    saves: 1840,
    attendees: 4200,
    trending: "hot",
    rank: 1,
    rankChange: 0,
    organizer: "Pulse Ghana",
    price: "GHS 120",
  },
  {
    id: "2",
    title: "Chale Wote Street Art Festival",
    category: "Culture",
    emoji: "🎨",
    venue: "James Town",
    city: "Accra",
    date: "Fri, Aug 22",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&w=640&fit=crop",
    ticketsSold: 2100,
    totalTickets: 3000,
    saves: 980,
    attendees: 2100,
    trending: "hot",
    rank: 2,
    rankChange: 1,
    organizer: "Accra Arts Council",
    price: "Free",
  },
  {
    id: "3",
    title: "Ghana Tech Summit 2025",
    category: "Tech",
    emoji: "💻",
    venue: "Movenpick Hotel",
    city: "Accra",
    date: "Thu, Jun 5",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&w=640&fit=crop",
    ticketsSold: 850,
    totalTickets: 1200,
    saves: 432,
    attendees: 850,
    trending: "rising",
    rank: 3,
    rankChange: 3,
    organizer: "GhTech",
    price: "GHS 350",
  },
  {
    id: "4",
    title: "Kumasi Food Festival",
    category: "Food",
    emoji: "🍲",
    venue: "Kejetia Market Area",
    city: "Kumasi",
    date: "Sun, May 18",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&w=640&fit=crop",
    ticketsSold: 620,
    totalTickets: 800,
    saves: 310,
    attendees: 620,
    trending: "rising",
    rank: 4,
    rankChange: -1,
    organizer: "Ashanti Foodies",
    price: "GHS 50",
  },
  {
    id: "5",
    title: "Midnight Football Fiesta",
    category: "Sports",
    emoji: "⚽",
    venue: "El Wak Stadium",
    city: "Accra",
    date: "Fri, May 30",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&w=640&fit=crop",
    ticketsSold: 290,
    totalTickets: 500,
    saves: 180,
    attendees: 290,
    trending: "new",
    rank: 5,
    rankChange: 5,
    organizer: "GFA Events",
    price: "GHS 80",
  },
];

const TRENDING_LOCATIONS: TrendingLocation[] = [
  {
    id: "l1",
    name: "Accra Sports Stadium",
    city: "Accra",
    eventCount: 12,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&w=400&fit=crop",
    trend: 34,
  },
  {
    id: "l2",
    name: "James Town",
    city: "Accra",
    eventCount: 8,
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&w=400&fit=crop",
    trend: 22,
  },
  {
    id: "l3",
    name: "National Theatre",
    city: "Accra",
    eventCount: 6,
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&w=400&fit=crop",
    trend: 18,
  },
  {
    id: "l4",
    name: "Labadi Beach",
    city: "Accra",
    eventCount: 5,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&w=400&fit=crop",
    trend: 15,
  },
];

const TRENDING_TOPICS: TrendingTopic[] = [
  { id: "t1", tag: "#AfrobeatsNight", postCount: 4820, category: "Music", trending: true },
  { id: "t2", tag: "#ChaleWote2025", postCount: 3240, category: "Culture", trending: true },
  { id: "t3", tag: "#AccraVibes", postCount: 2890, category: "Lifestyle", trending: true },
  { id: "t4", tag: "#GhTechSummit", postCount: 1540, category: "Tech", trending: true },
  { id: "t5", tag: "#KumasiFood", postCount: 980, category: "Food", trending: false },
  { id: "t6", tag: "#GoOutside", postCount: 7200, category: "Platform", trending: true },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function TrendingBadge({ type }: { type: TrendingEvent["trending"] }) {
  if (type === "hot") return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">
      <Fire size={9} weight="fill" /> Hot
    </span>
  );
  if (type === "rising") return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
      <TrendUp size={9} weight="bold" /> Rising
    </span>
  );
  return (
    <span className="flex items-center gap-1 rounded-full bg-[var(--brand-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand)]">
      <Lightning size={9} weight="fill" /> New
    </span>
  );
}

function RankChange({ change }: { change: number }) {
  if (change === 0) return <span className="text-[11px] text-[var(--text-tertiary)]">—</span>;
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[var(--brand)]">
      ↑{change}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-red-400">
      ↓{Math.abs(change)}
    </span>
  );
}

function TicketFillBar({ sold, total }: { sold: number; total: number }) {
  const pct = Math.min(100, Math.round((sold / total) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--brand)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-[var(--text-tertiary)] shrink-0">{pct}% sold</span>
    </div>
  );
}

function TrendingEventCard({ event, index }: { event: TrendingEvent; index: number }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="group relative flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm">
      {/* Rank */}
      <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-1">
        <span className="text-[18px] font-black text-[var(--text-tertiary)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <RankChange change={event.rankChange} />
      </div>

      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <img
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={event.imageUrl}
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-[var(--text-tertiary)]">
              {event.emoji} {event.category}
            </span>
            <TrendingBadge type={event.trending} />
          </div>
          <button
            className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors"
            onClick={() => setSaved((v) => !v)}
            type="button"
          >
            <BookmarkSimple
              size={16}
              weight={saved ? "fill" : "regular"}
              className={saved ? "text-[var(--brand)]" : ""}
            />
          </button>
        </div>

        <p className="mt-0.5 text-[14px] font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">
          {event.title}
        </p>

        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
          <MapPin size={10} weight="fill" />
          <span className="truncate">{event.venue} · {event.date}</span>
        </div>

        <div className="mt-2">
          <TicketFillBar sold={event.ticketsSold} total={event.totalTickets} />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <Users size={11} weight="fill" /> {event.attendees.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={11} weight="fill" /> {event.saves.toLocaleString()}
            </span>
          </div>
          <span className="text-[12px] font-bold text-[var(--brand)]">{event.price}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
type TabType = "events" | "locations" | "topics";

export default function TrendingPage() {
  const [tab, setTab] = useState<TabType>("events");
  const [search, setSearch] = useState("");

  const filteredEvents = TRENDING_EVENTS.filter((e) =>
    search === "" ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.city.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="page-grid min-h-screen pb-28">
      <div className="container-shell px-4 py-6 md:py-10">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Fire size={22} weight="fill" className="text-red-500" />
              <h1 className="text-[24px] font-black text-[var(--text-primary)] tracking-tight">
                Trending
              </h1>
            </div>
            <p className="text-[14px] text-[var(--text-tertiary)]">
              What's hot in Ghana right now · Updated every hour
            </p>
          </div>

          {/* Search */}
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5">
            <MagnifyingGlass size={15} weight="bold" className="text-[var(--text-tertiary)] shrink-0" />
            <input
              className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trending events, venues, topics…"
              value={search}
            />
          </div>

          {/* Tabs */}
          <div className="mb-5 flex rounded-2xl bg-[var(--bg-muted)] p-1 gap-1">
            {(["events", "locations", "topics"] as TabType[]).map((t) => (
              <button
                key={t}
                className="flex-1 rounded-xl py-2 text-[13px] font-semibold capitalize transition-all"
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "var(--bg-card)" : "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Events tab */}
          {tab === "events" && (
            <div className="space-y-3">
              {/* Hot right now banner */}
              {filteredEvents.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    alt={filteredEvents[0].title}
                    className="h-40 w-full object-cover"
                    src={filteredEvents[0].imageUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                        <Fire size={9} weight="fill" /> #1 Trending
                      </span>
                      <span className="text-[11px] text-white/70">{filteredEvents[0].date}</span>
                    </div>
                    <h2 className="text-[17px] font-black text-white leading-tight">
                      {filteredEvents[0].title}
                    </h2>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[12px] text-white/70">
                        <MapPin size={10} weight="fill" className="inline mr-1" />
                        {filteredEvents[0].venue}
                      </span>
                      <span className="rounded-xl bg-white/20 px-3 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
                        {filteredEvents[0].price}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {filteredEvents.slice(1).map((event, i) => (
                <TrendingEventCard key={event.id} event={event} index={i + 1} />
              ))}
            </div>
          )}

          {/* Locations tab */}
          {tab === "locations" && (
            <div className="space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-4">
                Hot Venues This Week
              </p>
              {TRENDING_LOCATIONS.map((loc, i) => (
                <div
                  key={loc.id}
                  className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-default)]"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      alt={loc.name}
                      className="h-16 w-16 rounded-xl object-cover"
                      src={loc.imageUrl}
                    />
                    <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-black text-[var(--text-tertiary)]">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">{loc.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                      <MapPin size={10} weight="fill" />
                      <span>{loc.city}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)]">
                        {loc.eventCount} upcoming events
                      </span>
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)]">
                        <TrendUp size={12} weight="bold" /> +{loc.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Topics tab */}
          {tab === "topics" && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-4">
                Trending Topics · Ghana
              </p>
              {TRENDING_TOPICS.map((topic, i) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:border-[var(--border-default)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-bold text-[var(--text-tertiary)] w-5 text-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-[var(--text-primary)]">{topic.tag}</p>
                      <p className="text-[12px] text-[var(--text-tertiary)]">
                        {topic.category} · {topic.postCount.toLocaleString()} posts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {topic.trending && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <Fire size={9} weight="fill" /> Trending
                      </span>
                    )}
                    <ArrowRight size={14} className="text-[var(--text-tertiary)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
