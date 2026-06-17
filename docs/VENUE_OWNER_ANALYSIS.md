# GoOutside — Venue Owner Use Case Analysis
**Date:** 2026-06-17  
**Context:** Client question from Gabby — "Can venue owners use it? Like someone who owns a restaurant."

---

## 1. Who Is a Venue Owner on GoOutside?

A **venue owner** is different from an event organizer. They own or manage the physical space where things happen.

| Type | Examples (Ghana context) |
|------|--------------------------|
| Food & drink | Restaurant, chop bar, rooftop bar, bar & grill, lounge |
| Entertainment | Club, comedy club, karaoke spot, billiards hall |
| Multi-use | Hotel pool, beach resort, garden venue, event center |
| Boutique | Spa, gallery, bakery with events, private club |

Right now GoOutside treats venue as a field on an event. The proposal here is to elevate **Venue** into its own first-class entity — a profile that venue owners control, separate from but linked to event organizers.

---

## 2. What Would a Venue Owner Put on the Site?

Think of it like a "living listing" — always-on, not tied to a single event.

### Venue Profile Page (`/venues/[slug]`)
- **Name, logo, cover photo/video** (hero)
- **Category tags** — Restaurant / Bar / Club / Event Space
- **Location** — address, Google Maps pin, neighborhood
- **Operating hours** — day-by-day schedule
- **Capacity** — standing, seated, private rooms
- **Amenities** — parking, AC, outdoor space, generator (important in Ghana), accessibility
- **Vibes** — Afrobeats nights, Jazz evenings, Quiet workspace, Sports screenings, etc.
- **Price range** — GHS tier (¢, ¢¢, ¢¢¢)
- **Gallery** — photos, short videos
- **Menu** — for restaurants; link to full PDF or embedded items
- **Upcoming events at this venue** — auto-pulled from events that tag this venue
- **Past events** — social proof
- **Reviews & Pulse ratings** — community score
- **Contact + booking CTA** — WhatsApp link, phone, reservation system

---

## 3. How Does the Venue Owner Benefit?

### Discovery
- Ghana people currently find restaurants/bars via Instagram, word-of-mouth, or random Google searches with zero personalization.
- GoOutside already has users segmented by **vibe, location, and interest** from onboarding. A venue owner is immediately visible to the exact crowd that matches their brand.
- Their venue shows up in event feeds when organizers host there — **passive discovery** at no extra cost.

### Credibility
- A verified venue badge + real community Pulse scores replaces fake Google reviews.
- "75 people from Accra's nightlife crowd have been here" is more powerful than 4.2 stars from anonymous reviewers.

### Recurring Business (not just one-time events)
- An event organizer uses GoOutside for a single event.
- A venue owner benefits **every week** — weekly schedule posts, happy hour deals, recurring nights.
- This is higher LTV (lifetime value) for us.

### Direct Table/Space Booking
- Phase 2: venue owners can accept reservations directly through the app. No middleman.

---

## 4. How Does GoOutside Make Money From This?

This is the key question. Multiple revenue streams:

### A. Venue Subscription (Primary Revenue)
**Monthly SaaS fee to maintain a live, verified venue profile.**

| Tier | Price (GHS/month) | What's included |
|------|-------------------|-----------------|
| Basic | GHS 150 (~$10) | Profile page, photo gallery, hours, map pin |
| Standard | GHS 350 (~$23) | + Featured in search, weekly schedule posts, analytics dashboard |
| Premium | GHS 700 (~$46) | + Priority placement, promoted to matched users via push/email, reservation module, WhatsApp integration |

**Projection:** 50 venues at Standard = GHS 17,500/month (~$1,150). 200 venues = GHS 70,000/month (~$4,600). This is predictable, recurring revenue — far better than one-off event fees.

### B. Featured Placement / Boost (Paid Promotion)
- Venue pays to be **pinned at the top** of category results ("Restaurants in Osu") for 7 or 30 days.
- Similar to Google Ads but hyper-local and within GoOutside's engaged user base.
- Price: GHS 200–500 per boost slot.

### C. Booking Commission
- When a user reserves a table, private space, or package directly through GoOutside, we take **8–12% commission**.
- This aligns our incentive with the venue actually getting business, not just a listing fee.

### D. Event Hosting Revenue Share
- When an external organizer books a venue via GoOutside (we add a venue-booking flow), we take a **platform fee** from both sides — venue pays a listing commission, organizer pays a booking fee.
- Medium-term feature, but high value.

### E. Deals & Offers Module
- Venue pushes a **time-limited deal** ("2-for-1 cocktails before 9pm Friday") that appears as a card in the GoOutside feed for matched users.
- Charge per deal publish: GHS 50–150/deal.
- Users love deals. Venues love moving slow hours. We get paid for the bridge.

### F. Data & Analytics Reports (Premium Tier)
- Monthly PDF report: who visited, what neighborhoods they came from, peak hours, vibe match score.
- Ghanaian SME owners are hungry for this — most have zero analytics today.
- Add-on: GHS 200/month on top of subscription.

---

## 5. What Does the Tech Build Look Like?

### New Database Tables

```sql
-- venues table (new first-class entity)
venues (
  id uuid PRIMARY KEY,
  owner_clerk_id text,          -- links to Clerk user
  name text,
  slug text UNIQUE,
  description text,
  category text[],              -- ['restaurant','bar','event_space']
  location_city text,
  location_address text,
  lat numeric, lng numeric,
  hours jsonb,                  -- { mon: { open: '11:00', close: '22:00' }, ... }
  capacity_seated int,
  capacity_standing int,
  amenities text[],
  price_tier int,               -- 1-3
  cover_url text,
  logo_url text,
  gallery_urls text[],
  verified boolean DEFAULT false,
  subscription_tier text,       -- 'basic' | 'standard' | 'premium'
  subscription_active boolean,
  pulse_score numeric,
  created_at timestamptz
)

-- venue_media (gallery)
venue_media (id, venue_id, url, type, position)

-- venue_reviews
venue_reviews (id, venue_id, user_id, rating int, body text, created_at)

-- venue_deals
venue_deals (
  id, venue_id, title, description,
  discount_type,                -- 'percent' | 'flat' | 'freebie'
  discount_value numeric,
  valid_from timestamptz,
  valid_until timestamptz,
  active boolean
)

-- venue_bookings (Phase 2)
venue_bookings (
  id, venue_id, user_id,
  date date, time_slot text,
  party_size int,
  package text,
  status text,                  -- pending | confirmed | cancelled
  total_ghs numeric,
  platform_fee_ghs numeric
)
```

### New Route Structure

```
/venues/                        — Browse venues (filter: city, category, vibe, price)
/venues/[slug]/                 — Public venue profile page
/venues/[slug]/book/            — Reservation flow (Phase 2)

/venue-dashboard/               — Venue owner backend (NEW, parallel to /organizer/)
  overview/                     — Stats: views, saves, bookings, revenue
  profile/                      — Edit venue details, photos, hours
  deals/                        — Create/manage deals
  schedule/                     — Weekly recurring event schedule
  bookings/                     — Manage incoming reservations
  analytics/                    — Audience breakdown, peak times
  billing/                      — Subscription tier + payment history
```

### New API Routes

```
GET  /api/venues                 — List/search venues
GET  /api/venues/[id]           — Single venue
POST /api/venues                 — Create venue (onboarding)
PATCH /api/venues/[id]          — Update venue
GET  /api/venues/[id]/deals     — Active deals for venue
POST /api/venues/[id]/deals     — Create deal
GET  /api/venues/[id]/events    — Events happening at venue
POST /api/venues/[id]/reviews   — Leave review
POST /api/venues/[id]/book      — Create booking (Phase 2)
GET  /api/venue-dashboard/stats — Venue owner analytics
```

### Frontend Components Needed

- `VenueCard.tsx` — compact card for listings/search
- `VenueProfilePage.tsx` — full venue detail page
- `VenueGallery.tsx` — photo grid + lightbox
- `VenueDealCard.tsx` — deal badge surfaced in feeds
- `VenueHoursWidget.tsx` — "Open now" / next open time
- `VenueBookingFlow.tsx` — reservation UI (Phase 2)
- `VenueDashboardLayout.tsx` — owner backend shell

### Integration Points with Existing System

| Existing Feature | How Venue Plugs In |
|-----------------|-------------------|
| Events (`/events/[slug]`) | Event's `venue_id` field links to venue profile — auto backlinks |
| Search (`/search`) | Venues become a 4th search result type alongside events/users/snippets |
| Home Feed | Venue deals surface as a "Deals Near You" card between event cards |
| Pulse Points | Users earn PP for visiting a venue (check-in QR at venue) |
| Organizer Dashboard | Organizer can tag a venue when creating an event; venue owner sees it |
| Maps/Location | Venues pin to city map view (future feature) |

---

## 6. Venue Owner Onboarding Flow

```
/venue-onboarding/
  1. basics/     — Name, category, location, description
  2. hours/      — Operating hours by day
  3. media/      — Upload logo + cover + gallery (3+ photos minimum)
  4. amenities/  — Checkboxes: parking, AC, outdoor, generator, etc.
  5. pricing/    — Choose subscription tier
  6. verify/     — Review + submit for human verification
```

Verification step is important — we manually confirm the venue exists. This maintains quality and justifies the subscription fee. Turnaround: 24–48 hours.

---

## 7. User Experience (The Consumer Side)

What does a regular GoOutside user see?

- **"Places" tab** in bottom nav (or under Search) — browse venues by neighborhood, vibe, category
- **"Open Now"** filter — users looking for somewhere tonight see only currently-open venues
- **Venue cards in the event feed** — "This event is at Sky Bar, Accra — 4.8 Pulse score, open until 2am"
- **Deals surfaced in feed** — "2-for-1 cocktails at The Republic tonight, 7–10pm"
- **Check-in via QR code at venue** — earns Pulse Points, shows on user profile ("Places I've been")
- **Save a venue** — like saving an event; venue owner sees save count as a metric
- **Venue on user profile** — "Regulars at: Sky Bar, Champs Bar" — social flex

---

## 8. Logistics & Ops

### Signing Up Venues

| Phase | Approach |
|-------|----------|
| Launch (0–3 months) | Manual outreach. Target 10–20 anchor venues in Accra (Osu, Airport, East Legon). White-glove setup — we build the profile for them. |
| Growth (3–12 months) | Self-serve onboarding flow + referral incentive (1 month free for every referred venue). Sales rep on commission. |
| Scale (12m+) | Venue associations, hospitality groups, hotel chains as enterprise accounts. |

### Payment Collection

- Subscriptions billed monthly via **Paystack** (already integrated for tickets).
- Auto-renew. Cancel anytime from venue dashboard.
- Failed payments → grace period 7 days → profile downgraded to Basic (still live but no promotion).

### Verification

- Venue submits: name, address, Ghana Business Registration number (optional but trust signal), phone.
- GoOutside team confirms via Google Maps, social media cross-check.
- Verified badge appears on profile. Non-verified venues can exist but show "Unverified" tag.

### Support

- WhatsApp business number for venue owner support (already how most Ghanaian SMEs prefer communication).
- In-app ticket system in Phase 2.

---

## 9. Competitive Moat

Why won't a restaurant just use Instagram or Google?

| GoOutside | Instagram | Google Maps |
|-----------|-----------|-------------|
| Audience is pre-qualified event/going-out crowd | General audience | General audience |
| Connected to events happening at the venue | No event integration | Basic event section, rarely used |
| Pulse Points incentivize visits | No loyalty mechanic | No loyalty mechanic |
| Discovery is personalized by vibe/city/interest | Algorithmic, brand-irrelevant | Keyword search only |
| Deals go directly into engaged users' feeds | Organic reach dying (pay-to-play) | No deal feed |
| Social proof from real community check-ins | Followers ≠ real customers | Reviews are anonymous |
| One platform connects venue + organizer + attendee | Siloed | Siloed |

The key insight: **GoOutside is the only platform where the event, the venue, and the crowd are in the same ecosystem.** That's defensible.

---

## 10. Revenue Projection (Conservative)

| Metric | Month 6 | Month 12 | Month 18 |
|--------|---------|----------|----------|
| Active venues | 20 | 75 | 200 |
| Avg subscription (GHS/month) | 350 | 400 | 450 |
| Subscription revenue (GHS) | 7,000 | 30,000 | 90,000 |
| Boost/deal revenue (GHS) | 2,000 | 10,000 | 30,000 |
| Booking commission (GHS) | — | 5,000 | 25,000 |
| **Total venue revenue (GHS/month)** | **9,000** | **45,000** | **145,000** |
| **USD equivalent** | **~$590** | **~$2,960** | **~$9,500** |

This is **additive** to ticket/event revenue. Venue subscriptions are the most predictable MRR (monthly recurring revenue) in the model — venues don't stop operating after one event.

---

## 11. Build Priority

| Phase | What to Build | Timeline |
|-------|--------------|----------|
| 0 — Prep | Add `venue_id` field to existing events table. Let organizers tag a venue. | Now (1 day) |
| 1 — MVP | Venue profile page, basic CRUD, link to events. No subscription yet. Manual creation by GoOutside team. | 2–3 weeks |
| 2 — Monetize | Subscription tiers, Paystack billing, featured placement. Self-serve onboarding flow. | 4–6 weeks |
| 3 — Engage | Deals module, check-in QR codes, venue deals in home feed. | 6–10 weeks |
| 4 — Convert | Booking/reservation system, commission flow, analytics dashboard. | 3–4 months |

---

## Summary for Gabby

**Yes, venue owners absolutely fit GoOutside.** They're actually a better recurring revenue source than event organizers because their business runs year-round, not event-by-event.

A restaurant owner would:
1. Create a venue profile (name, hours, photos, vibes, menu link)
2. Pay a monthly subscription to stay visible and promoted to the right Accra crowd
3. Post weekly deals that hit users' feeds
4. Get analytics on who's discovering them
5. Eventually accept reservations directly through the app

GoOutside makes money on subscriptions, boosts, deals, and booking commissions. The venue gets qualified traffic from people who are already in the mindset of going out. That's the pitch.
