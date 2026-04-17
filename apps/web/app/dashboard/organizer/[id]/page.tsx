"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Globe,
  InstagramLogo,
  TwitterLogo,
  Users,
  Ticket,
  Star,
  CheckCircle,
  CalendarBlank,
  ArrowRight,
  Heart,
  ShareNetwork,
  Fire,
  TrendUp,
  Phone,
  EnvelopeSimple,
  UserPlus,
  UserMinus,
} from "@phosphor-icons/react";

// ── Mock organizer data ───────────────────────────────────────────────────────
const MOCK_ORGANIZER = {
  id: "org-123",
  name: "Pulse Ghana",
  handle: "@pulse.ghana",
  bio: "Ghana's premier event production company. We create unforgettable experiences across music, arts, culture, and lifestyle. 🎵🎨",
  tagline: "Creating experiences that move you.",
  location: "Accra, Ghana",
  website: "https://pulseghana.com",
  instagram: "@pulseghana",
  twitter: "@pulseghana",
  phone: "+233 20 000 0000",
  email: "hello@pulseghana.com",
  logoUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=160&h=160&fit=crop",
  coverUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=1400&fit=crop",
  verified: true,
  joinedAt: "January 2023",
  followerCount: 12400,
  eventsHosted: 84,
  totalTicketsSold: 48200,
  avgRating: 4.8,
  reviewCount: 1240,
  tier: "Premier",
  upcomingEvents: [
    {
      id: "e1",
      title: "Afrobeats Night ft. Sarkodie",
      date: "Sat, May 10, 2025",
      venue: "Accra Sports Stadium",
      price: "GHS 120",
      imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&w=400&fit=crop",
      ticketsSold: 4200,
      totalTickets: 5000,
      isFeatured: true,
    },
    {
      id: "e2",
      title: "Afro Nation Pre-Party",
      date: "Fri, Jun 20, 2025",
      venue: "Labadi Beach Hotel",
      price: "GHS 200",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&w=400&fit=crop",
      ticketsSold: 320,
      totalTickets: 800,
      isFeatured: false,
    },
    {
      id: "e3",
      title: "New Year Countdown 2026",
      date: "Wed, Dec 31, 2025",
      venue: "Accra International Conference Centre",
      price: "GHS 500",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=400&fit=crop",
      ticketsSold: 0,
      totalTickets: 2000,
      isFeatured: false,
    },
  ],
  pastHighlights: [
    {
      id: "p1",
      title: "Chale Wote 2024",
      attendees: 8000,
      imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&w=400&fit=crop",
    },
    {
      id: "p2",
      title: "Afrobeats Night 2024",
      attendees: 5000,
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&w=400&fit=crop",
    },
    {
      id: "p3",
      title: "Independence Day Bash",
      attendees: 3200,
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=400&fit=crop",
    },
  ],
  reviews: [
    {
      id: "r1",
      user: "Kofi M.",
      avatar: "KM",
      rating: 5,
      text: "Pulse Ghana never disappoints. The production quality is world class.",
      event: "Afrobeats Night",
      date: "Apr 2025",
    },
    {
      id: "r2",
      user: "Ama O.",
      avatar: "AO",
      rating: 5,
      text: "Security was tight, sound was immaculate, vibes were unmatched. 10/10",
      event: "Chale Wote 2024",
      date: "Aug 2024",
    },
  ],
};

type Tab = "events" | "highlights" | "reviews" | "about";

export default function OrganizerProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");
  const [following, setFollowing] = useState(false);

  const org = MOCK_ORGANIZER;
  const fillPct = (sold: number, total: number) => Math.min(100, Math.round((sold / total) * 100));

  return (
    <main className="page-grid min-h-screen pb-24">
      <div className="container-shell">
        {/* Cover */}
        <div className="relative">
          <div className="h-44 md:h-60 overflow-hidden">
            <img alt="cover" className="h-full w-full object-cover" src={org.coverUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          </div>
          <button
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            type="button"
          >
            <ShareNetwork size={16} weight="bold" />
          </button>
        </div>

        <div className="px-4">
          {/* Logo + actions */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <img
                alt={org.name}
                className="h-24 w-24 rounded-2xl border-4 border-[var(--bg-card)] object-cover shadow-lg"
                src={org.logoUrl}
              />
              {org.verified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-card)]">
                  <CheckCircle size={20} weight="fill" className="text-[var(--brand)]" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-95 ${
                  following
                    ? "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                    : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                }`}
                onClick={() => setFollowing((v) => !v)}
                type="button"
              >
                {following ? (
                  <><UserMinus size={14} weight="bold" /> Following</>
                ) : (
                  <><UserPlus size={14} weight="bold" /> Follow</>
                )}
              </button>
            </div>
          </div>

          {/* Org info */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-black text-[var(--text-primary)] tracking-tight">{org.name}</h1>
              {org.verified && <CheckCircle size={18} weight="fill" className="text-[var(--brand)]" />}
            </div>
            <p className="text-[14px] text-[var(--text-tertiary)]">{org.handle}</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)] italic">{org.tagline}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{org.bio}</p>

            <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[var(--text-tertiary)]">
              {org.location && (
                <a className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                  <MapPin size={12} weight="fill" /> {org.location}
                </a>
              )}
              {org.website && (
                <a
                  className="flex items-center gap-1 text-[var(--brand)] hover:underline"
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={12} weight="fill" /> Website
                </a>
              )}
              {org.instagram && (
                <a className="flex items-center gap-1 hover:text-pink-500 transition-colors cursor-pointer">
                  <InstagramLogo size={12} weight="fill" /> {org.instagram}
                </a>
              )}
              {org.twitter && (
                <a className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                  <TwitterLogo size={12} weight="fill" /> {org.twitter}
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-4 gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
            {[
              { label: "Followers", value: `${(org.followerCount / 1000).toFixed(1)}K`, icon: Users },
              { label: "Events", value: org.eventsHosted, icon: CalendarBlank },
              { label: "Tickets", value: `${(org.totalTicketsSold / 1000).toFixed(0)}K+`, icon: Ticket },
              { label: "Rating", value: org.avgRating.toFixed(1), icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon size={15} className="text-[var(--text-tertiary)]" weight="fill" />
                <p className="text-[15px] font-black text-[var(--text-primary)]">{value}</p>
                <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Premier tier badge */}
          {org.tier === "Premier" && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-dim)] px-4 py-3">
              <Fire size={20} weight="fill" className="text-[var(--brand)] shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-[var(--brand)]">Premier Organizer</p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  Top 1% of organizers on GoOutside · {org.reviewCount.toLocaleString()} verified reviews
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-5 flex rounded-2xl bg-[var(--bg-muted)] p-1 gap-1">
            {([
              { id: "events", label: "Events" },
              { id: "highlights", label: "Past" },
              { id: "reviews", label: "Reviews" },
              { id: "about", label: "About" },
            ] as const).map((t) => (
              <button
                key={t.id}
                className="flex-1 rounded-xl py-2 text-[12px] font-semibold transition-all"
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? "var(--bg-card)" : "transparent",
                  color: tab === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Events tab */}
          {tab === "events" && (
            <div className="space-y-3 pb-8">
              {/* Featured event hero */}
              {org.upcomingEvents.filter((e) => e.isFeatured).map((event) => (
                <div
                  key={event.id}
                  className="relative overflow-hidden rounded-2xl cursor-pointer"
                  onClick={() => router.push("/")}
                >
                  <img alt={event.title} className="h-44 w-full object-cover" src={event.imageUrl} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[var(--brand)] px-2.5 py-1 text-[11px] font-bold text-white">
                      ⭐ Featured
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[17px] font-black text-white">{event.title}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-[12px] text-white/80">
                        <CalendarBlank size={10} className="inline mr-1" weight="fill" />
                        {event.date} · {event.venue}
                      </div>
                      <span className="rounded-xl bg-white/20 px-3 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
                        {event.price}
                      </span>
                    </div>
                    {/* Fill bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-white"
                          style={{ width: `${fillPct(event.ticketsSold, event.totalTickets)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/70 shrink-0">
                        {fillPct(event.ticketsSold, event.totalTickets)}% sold
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Other upcoming events */}
              {org.upcomingEvents.filter((e) => !e.isFeatured).map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 cursor-pointer transition hover:border-[var(--border-default)]"
                  onClick={() => router.push("/")}
                >
                  <img
                    alt={event.title}
                    className="h-16 w-16 rounded-xl object-cover shrink-0"
                    src={event.imageUrl}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">{event.title}</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                      <CalendarBlank size={10} className="inline mr-1" weight="fill" />
                      {event.date}
                    </p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      <MapPin size={10} className="inline mr-1" weight="fill" />
                      {event.venue}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <span className="text-[13px] font-bold text-[var(--brand)]">{event.price}</span>
                    <ArrowRight size={14} className="text-[var(--text-tertiary)]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Highlights tab */}
          {tab === "highlights" && (
            <div className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3">
              {org.pastHighlights.map((h) => (
                <div key={h.id} className="group relative overflow-hidden rounded-2xl aspect-square">
                  <img
                    alt={h.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={h.imageUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[12px] font-bold text-white line-clamp-2">{h.title}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">
                      <Users size={9} className="inline mr-0.5" weight="fill" />
                      {h.attendees.toLocaleString()} attended
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews tab */}
          {tab === "reviews" && (
            <div className="space-y-3 pb-8">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                <div className="text-center">
                  <p className="text-[40px] font-black text-[var(--text-primary)] leading-none">{org.avgRating}</p>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        weight={i < Math.floor(org.avgRating) ? "fill" : "regular"}
                        className={i < Math.floor(org.avgRating) ? "text-amber-400" : "text-[var(--text-tertiary)]"}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{org.reviewCount.toLocaleString()} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--text-tertiary)] w-2">{stars}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: stars === 5 ? "72%" : stars === 4 ? "20%" : "5%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {org.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[12px] font-bold text-[var(--text-secondary)]">
                        {review.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{review.user}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{review.event} · {review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={12} weight="fill" className="text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{review.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* About tab */}
          {tab === "about" && (
            <div className="space-y-4 pb-8">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-3">
                <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Contact</h3>
                {org.email && (
                  <a
                    className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    href={`mailto:${org.email}`}
                  >
                    <EnvelopeSimple size={15} className="text-[var(--text-tertiary)] shrink-0" weight="fill" />
                    {org.email}
                  </a>
                )}
                {org.phone && (
                  <a
                    className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    href={`tel:${org.phone}`}
                  >
                    <Phone size={15} className="text-[var(--text-tertiary)] shrink-0" weight="fill" />
                    {org.phone}
                  </a>
                )}
                {org.website && (
                  <a
                    className="flex items-center gap-2.5 text-[13px] text-[var(--brand)] hover:underline"
                    href={org.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={15} className="shrink-0" weight="fill" />
                    {org.website.replace("https://", "")}
                  </a>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                <h3 className="text-[14px] font-bold text-[var(--text-primary)] mb-3">Social Media</h3>
                <div className="flex gap-3">
                  {org.instagram && (
                    <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 px-3 py-2 text-[12px] font-semibold text-white transition hover:opacity-90">
                      <InstagramLogo size={14} weight="fill" /> Instagram
                    </button>
                  )}
                  {org.twitter && (
                    <button className="flex items-center gap-1.5 rounded-xl bg-[#1DA1F2] px-3 py-2 text-[12px] font-semibold text-white transition hover:opacity-90">
                      <TwitterLogo size={14} weight="fill" /> Twitter
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                <h3 className="text-[14px] font-bold text-[var(--text-primary)] mb-2">About</h3>
                <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{org.bio}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                  <CalendarBlank size={12} weight="fill" />
                  Member since {org.joinedAt}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
