# GoOutside — CLAUDE.md

## Git Branching Strategy (MANDATORY — follow for every feature)

```
feature/xyz  →  dev  →  preview (staging)  →  main (production)
```

| Branch | Role | Rule |
|--------|------|------|
| `main` | Production — live waitlist URL | NEVER push directly. Only merge from `preview` when releasing. |
| `preview` | Staging — mirrors production for QA | Merge from `dev` when a set of features is ready to verify |
| `dev` | Integration — daily development target | Feature branches merge here first |
| `feature/<name>` | One branch per feature | Always cut from `dev`. Name: `feature/short-kebab-description` |

### Workflow for every new feature
1. Cut a feature branch from `dev`: `git checkout -b feature/<name> dev`
2. Build and commit on the feature branch
3. When done, merge to `dev`: `git checkout dev && git merge feature/<name>`
4. Push `dev` to remote: `git push origin dev`
5. Delete the feature branch after merge: `git push origin --delete feature/<name>`
6. When a batch of features is stable on `dev`, merge `dev` → `preview` for staging QA
7. When `preview` (staging) is approved, merge `preview` → `main` for production

### Rules
- Never commit directly to `main` or `preview`
- Always start new work by pulling latest `dev`: `git pull origin dev`
- Feature branch names: `feature/`, `fix/`, `chore/` prefixes
- `main` is **detached from day-to-day work** — only touched for production releases

## Project Overview
GoOutside is a social event discovery app for Ghana. Users discover/attend events, follow organizers, earn pulse scores, chat, and redeem loyalty rewards. Built as a pnpm monorepo.

## Monorepo Structure
```
go-outside/
├── apps/
│   ├── web/          — Next.js 15 frontend (port 3000)
│   └── admin/        — Next.js 15 admin dashboard (port 3001)
├── packages/
│   ├── api/          — Express API (routes in src/routes/)
│   ├── ui/           — Shared component library
│   └── demo-data/    — Ghana seed data (120 users, 30 events)
├── docs/             — DB migrations + PRDs + competitor data
└── scripts/          — simulate.ts (probabilistic session simulator)
```

## Dev Commands
```bash
pnpm dev:web       # Next.js web app (port 3000)
pnpm dev:admin     # Admin app (port 3001)
pnpm dev:api       # Express API
pnpm build         # Build all packages
pnpm typecheck     # Typecheck all packages
npx tsx scripts/simulate.ts  # Run session simulator
```

## Tech Stack — Web App
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Auth**: Clerk (`@clerk/nextjs` v7) — real Clerk, not demo-mode
- **Database**: Supabase (Postgres) — `supabaseAdmin` (server, bypasses RLS), `supabase-browser.ts` (client)
- **Styling**: Tailwind CSS v4
- **State**: TanStack Query v5
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **UI primitives**: Radix UI + lucide-react + @phosphor-icons/react
- **Chat**: Stream Chat (`stream-chat` + `stream-chat-react`)
- **Payments**: Paystack (UI built, webhook fulfillment incomplete)
- **Email**: Resend
- **Animations**: framer-motion, atropos
- **AI**: Groq API with `llama-3.1-8b-instant` (chat, explain, weekend assistant) — NOT Anthropic

## Key Files
| Path | Purpose |
|------|---------|
| `apps/web/middleware.ts` | Clerk middleware — protects `/dashboard/*`, `/organizer/*`, `/onboarding/*`, `/home/*`; redirects `/` → `/home` if signed in |
| `apps/web/lib/supabase.ts` | Server-only Supabase admin client (service role) — never import in client components |
| `apps/web/lib/supabase-browser.ts` | Browser Supabase client |
| `apps/web/lib/stream.ts` | Stream Chat client setup |
| `apps/web/lib/onboarding-utils.ts` | computeStartingScore, getTierFromScore, GHANA_CITIES, STEP_ROUTES |
| `apps/web/lib/landmark-events.ts` | 35 Ghana landmark events with related expansion logic |
| `apps/web/lib/landing-data.ts` | Static data for marketing landing page |
| `apps/web/lib/db/rewards.ts` | Pulse Points DB helpers: getPulsePointsSummary, getRewards, getLedger, getBadges, redeemRewardForUser |
| `packages/demo-data/src/ghana-seed.json` | 120 Ghana users, 30 events, friendships, snippets, graph edges |

## Route Structure (Web App)
```
/                        — Marketing landing page
/home                    — App feed (protected)
/dashboard/
  activity/              — Activity feed (real Supabase data)
  messages/              — Stream Chat DMs (real-time)
  notifications/         — Notifications (DB fetch, not real-time yet)
  profile/               — Own profile + edit sheet
  saved/                 — Saved events
  tickets/               — My tickets + QR codes
  tickets/[id]/          — Individual ticket detail
  trending/              — Trending events/locations/topics
  wallets/               — Wallet overview + Pulse Points mini
  rewards/               — Pulse Points shop, badges, activity ledger
  checkout/              — Cart + checkout flow
  checkout/payment/      — Paystack payment UI
  user/[id]/             — Public user profile
  organizer/[id]/        — ⚠️ Public organizer profile (NOT gated — anyone can visit)
/organizer/              — Organizer dashboard (⚠️ NOT access-controlled)
  analytics/             — Audience analytics
  calendar/              — Event calendar view
  create-post/           — Post composer for organizers
  events/                — Manage events list
  events/new/            — Create new event (form not fully complete)
  hashtags/              — Hashtag performance
/onboarding/profile → /vibe → /history → /interests → /pulse
/events/[slug]           — Event detail page
/events/                 — Events listing
/organizers/             — Browse organizers
/organizers/[id]/        — Public organizer profile
/search/                 — Search (events, users, snippets) + AI chat panel
/categories/             — Browse by category
/categories/[slug]/      — Category event listing
/go/[username]/          — Public user profile by username
/waitlist                — Pre-launch email collection
/ad-waitlist             — Password-gated admin CSV view
/sign-in, /sign-up       — Clerk auth pages
```

## Database Migrations (in order — all 11 must be applied)
| File | What it adds |
|------|-------------|
| `docs/001_initial_schema.sql` | Core: users, events, organizers, tickets |
| `docs/002_algorithm_layer.sql` | Feed algo: graph_edges, pulse_scores, interactions |
| `docs/003_ghana_seed.sql` | Ghana seed data insertion |
| `docs/004_onboarding_migration.sql` | users.vibe JSONB, bio, username; onboarding_past_events |
| `docs/005_db.sql` | Additional tables |
| `docs/006_messages_and_cart.sql` | conversations, messages, cart_items, public_profiles view, cover_url/twitter |
| `docs/007_organizer_mode.sql` | Organizer-specific additions |
| `docs/008_phase_a.sql` | Phase A features |
| `docs/008_search_vectors.sql` | Full-text search tsvector columns |
| `docs/008_search_improvements.sql` | Search index improvements |
| `docs/008_social_graph_constraints.sql` | Unique constraints on graph_edges |
| `docs/009_recommendation_cache.sql` | recommendation_cache table |
| `docs/010_phase_b.sql` | posts, post_likes, user_achievements, pulse_score_history, event_chat_channels, message_requests, follows |
| `docs/011_pulse_points.sql` | rewards, pulse_points_ledger, user_coupons, rewards_badges, user_rewards_badges + RPCs: award_pulse_points, redeem_reward, process_monthly_streaks |
| `docs/waitlist-schema.sql` | waitlist + admin_config tables |

## API Routes — Next.js App (apps/web/app/api/)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/activity` | GET | Activity feed |
| `/api/activity/read-all` | POST | Mark all activity read |
| `/api/ai/chat` | POST | Claude AI conversational event discovery |
| `/api/ai/explain` | POST | "Why This?" event explanation |
| `/api/ai/weekend` | POST | Weekend Assistant suggestions |
| `/api/bootstrap` | GET | App bootstrap data |
| `/api/chat/token` | GET | Stream Chat user token |
| `/api/chat/seed` | POST | Seed Stream channel |
| `/api/events/feed` | GET | Event feed |
| `/api/events/save` | POST | Save/unsave event |
| `/api/events/saved` | GET | Get saved events |
| `/api/feed/query` | GET | Feed query |
| `/api/feed/social-signals` | GET | Social signals for feed |
| `/api/follow` | POST/DELETE | Follow/unfollow user |
| `/api/follow/status` | GET | Follow status check |
| `/api/interactions` | POST | Fire-and-forget behavioral signals |
| `/api/notifications` | GET | Notifications list |
| `/api/notifications/read-all` | POST | Mark all read |
| `/api/onboarding/complete` | POST | Finalize onboarding, compute pulse score |
| `/api/onboarding/history` | POST | Save landmark event history |
| `/api/onboarding/interests` | POST | Save interest categories |
| `/api/onboarding/progress` | GET | Current onboarding step |
| `/api/organizer/dashboard/overview` | GET | Organizer stats |
| `/api/organizer/dashboard/audience` | GET | Audience analytics |
| `/api/organizer/dashboard/sales-chart` | GET | Sales chart data |
| `/api/organizer/hashtags/performance` | GET | Hashtag analytics |
| `/api/organizers/follow` | POST | Follow organizer |
| `/api/posts` | GET/POST | Posts feed / create post |
| `/api/posts/[id]` | GET/DELETE | Single post |
| `/api/posts/[id]/like` | POST | Like/unlike post |
| `/api/rewards/redeem` | POST | Redeem reward for Pulse Points |
| `/api/search` | GET | Search events, users, snippets |
| `/api/tickets/purchase` | POST | Purchase ticket |
| `/api/trending` | GET | Trending data |
| `/api/upload/avatar` | POST | Upload user avatar to Supabase Storage |
| `/api/upload/banner` | POST | Upload profile banner |
| `/api/upload/cover` | POST | Upload event cover |
| `/api/upload/logo` | POST | Upload organizer logo |
| `/api/upload/post-media` | POST | Upload post image |
| `/api/users/me` | GET/PATCH | Own user record |
| `/api/users/me/pulse` | GET | Own pulse score |
| `/api/users/me/pulse/history` | GET | Pulse score history |
| `/api/users/me/location/gps` | POST | Update GPS location |
| `/api/users/[id]` | GET | User profile |
| `/api/users/[id]/follow` | POST | Follow user |
| `/api/users/[id]/stats` | GET | User stats |
| `/api/users/[id]/events` | GET | User's events |
| `/api/users/people` | GET | People you may know |
| `/api/users/profile` | PATCH | Update profile |
| `/api/waitlist` | POST | Join waitlist |
| `/api/webhooks/clerk` | POST | Clerk user sync to Supabase |
| `/api/webhooks/paystack` | POST | ⚠️ Paystack payment webhook — fulfillment INCOMPLETE |
| `/api/admin/auth` | POST | Admin password check |
| `/api/admin/signups` | GET | Waitlist signups |
| `/api/admin/send-email` | POST | Send email to waitlist |

## API Routes — Express (packages/api/src/routes/)
- `feed.ts` — Phase 1 scoring, 5 named sections + cursor pagination
- `interactions.ts` — fire-and-forget (<50ms), Zod-validated graph_edge_types
- `sessions.ts` — 30min TTL session tracking
- `friends.ts` — friendship CRUD with auth middleware
- `preview.ts` — enriched event peek panel (scarcity + social proof); registered BEFORE events router in app.ts so `/:slug/preview` matches before `/:id`
- `chat.ts` — Stream Chat token generation
- `events.ts`, `activity.ts`, `admin.ts`, `auth.ts`, `discovery.ts`, `media.ts`, `organizer.ts`, `payments.ts`, `tickets.ts`

## Onboarding Flow
5 steps: `/onboarding/profile` → `/vibe` → `/history` → `/interests` → `/pulse`
- Middleware redirects authenticated users without `onboardingComplete: true` in Clerk `unsafeMetadata`
- Step tracked via `onboardingStep` number in Clerk unsafeMetadata
- API routes: `apps/web/app/api/onboarding/{history,complete,interests,progress}/route.ts`

## Pulse Points & Rewards System (Migration 011)
- **Tables:** `rewards`, `pulse_points_ledger`, `user_coupons`, `rewards_badges`, `user_rewards_badges`
- **User columns:** `pulse_points_balance` (spendable), `pulse_points_lifetime` (all-time total)
- **RPCs:** `award_pulse_points(user_id, delta, type, description, event_id)` — atomic ledger insert + balance update
- **RPC:** `redeem_reward(user_id, reward_id)` — atomic deduction + coupon generation (PULSE-XXXX-YYYY format, 90-day expiry)
- **RPC:** `process_monthly_streaks()` — awards 75 PP to users who attended an event last month; ⚠️ pg_cron not scheduled yet
- **PP Transaction types:** ticket_purchase, check_in, snippet_posted, event_saved, referral_bonus, monthly_streak_bonus, milestone_first_event (5th/10th/25th), category_diversity_bonus, badge_unlock_bonus, reward_redemption, admin_adjustment
- **Rewards UI:** `/dashboard/rewards` — RewardsClient.tsx with 3 tabs: Shop, Activity History, Badges
- **Redemption flow:** POST `/api/rewards/redeem` → `redeemRewardForUser` → Supabase RPC `redeem_reward`

## Posts System (Migration 010)
- **Tables:** `posts` (id, user_id, body≤500, image_url, event_id, like_count), `post_likes`
- **API:** `/api/posts` (GET feed, POST create), `/api/posts/[id]` (GET, DELETE), `/api/posts/[id]/like` (POST toggle)
- **Components:** `PostCard`, `PostComposer`, `PostFeed` in `apps/web/components/posts/`
- **Visibility:** Currently only on profile tabs (Tweets tab) — not surfaced in main feed

## Social Graph
- `graph_edges` — behavioral interactions (like, save, share, checkin, follow, friend)
- `follows` table — unidirectional user follows (migration 010)
- `graph_edges` with edge_type='friend' — bidirectional friendships
- `message_requests` — non-mutual DM requests (pending/accepted/declined); ⚠️ not surfaced in messages UI yet

## Auth Architecture
- **Clerk** handles all auth (sign-in, sign-up, session)
- Onboarding completion flag: `unsafeMetadata.onboardingComplete === true`
- `supabaseAdmin` (service role key) — server-side only, bypasses RLS
- Never expose service role key to the browser
- `/api/webhooks/clerk` syncs Clerk user creates/updates to Supabase `users` table

## Environment Variables (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/home
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding/profile
RESEND_API_KEY=
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_API_SECRET=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
GROQ_API_KEY=                # for /api/ai/* routes (llama-3.1-8b-instant via Groq)
GROQ_API_KEY_PROD_1=         # production Groq key (takes precedence over GROQ_API_KEY)
NEXT_PUBLIC_GOOGLE_PLACES_KEY=      # for LocationAutocomplete in onboarding (client-side)
GOOGLE_PLACES_SERVER_KEY=           # server-side Places API key
```

## UI Component Locations
- Shared components: `packages/ui/` — badge, button, card, data-table, event-card, fields, grain, icon, metric-chart, mobile-nav, section-header, sidebar, stat-card, theme-toggle, topbar
- Web-specific: `apps/web/components/`
  - `ai/` — WeekendAssistant, WhyThisButton
  - `feed/` — ScarcityPill, FeedSectionHeader, SkeletonCard, FriendAvatarStrip, QuickActionButtons, InfiniteGrid
  - `home/` — CategoryRail, DiscoveryFeed, EventPeekPanel, EventSidePane, HeroCarousel, HomeClient, HomeEventCard
  - `search/` — AIChatPanel, AnimatedSearchPlaceholder, HomeSearchHero, MobileUnifiedSearch, SearchBar, SearchPillExpanded
  - `layout/` — AppChrome, AppBackground, BottomNav, Sidebar, Header, Footer, NavSwitch, ConditionalChrome
  - `posts/` — PostCard, PostComposer, PostFeed
  - `tickets/` — CartDrawer, GetTicketModal
  - `wallet/` — AtroposTicket, StackedPastTickets
  - `pulse/` — PulseScorePill
  - `social/` — FollowButton
  - `notifications/` — NotificationBell
  - `messages/` — MessagesFAB
  - `ui/` — avatar, ImageUploadButton, LocationAutocomplete, progress, scroll-area, toast/toaster
- `apps/web/hooks/useInfiniteFeed.ts` — feed pagination hook

## What's Built (Real Data, Fully Wired)
- Full auth (Clerk sign-in/up/out), onboarding (5 steps with cross-browser DOB picker + city autocomplete fallback), middleware protection
- Home feed with AI-personalized sections, category rail, hero carousel
- Event detail pages with ticket purchase flow (up to Paystack UI)
- Search: full-text across events/users/snippets + AI chat panel
- Dashboard: activity, messages (Stream Chat), notifications, profile/edit, saved, tickets with QR codes, trending, wallets, rewards (full PP shop + badges)
- Organizer dashboard: overview, analytics, sales, calendar, events, post creation, hashtags
- Public profiles: user/[id], organizer/[id], go/[username]
- Follow/unfollow users and organizers
- Posts system: create, like, feed on profiles
- AI features: chat, explain, weekend assistant
- Pulse Points + Rewards system: earn, track, redeem, badges
- Waitlist + admin CSV view

## What's NOT Wired / Incomplete
- **Paystack webhook** — payment succeeds but tickets not created; `/api/webhooks/paystack` needs fulfillment (create ticket, award PP, send email)
- **Supabase Storage buckets** — upload routes exist but buckets (`avatars`, `banners`, `covers`, `logos`, `post-media`) need to be created in Supabase dashboard with proper policies
- **Real-time notifications** — currently polls DB on load; needs Supabase Realtime subscription
- **Event check-in** — `check_in` graph edge exists, no UI flow, no QR scanner
- **Event group chat** — `event_chat_channels` table exists; no UI on event detail page
- **Message requests** — `message_requests` table exists; not surfaced in messages UI
- **pg_cron monthly streaks** — `process_monthly_streaks()` function exists; cron job not scheduled in Supabase
- **Organizer access control** — `/organizer/*` is not gated; anyone authenticated can access it
- **Referral system** — PP transaction type defined; no `/invite/[code]` page or referral link generation
- **Event amenities/FAQs/accessibility** — event detail page missing these Airbnb-style sections
- **Profile completion progress bar** — in spec, not implemented
- **Going With groups** — PP bonus type defined; no UI
- **Leaderboard** — no public Pulse leaderboard by city
- **Transactional emails** — ticket confirmation, event reminders, follow notifications not set up in Resend
- **Posts not in main feed** — PostFeed only on profile tabs, not surfaced in home feed / explore

## Conventions
- Server components use `supabaseAdmin`; client components use `supabase-browser.ts`
- No mock/demo data in new features — connect to real Supabase/Clerk
- `packages/api` routes registered order matters: `preview.ts` before `events.ts`
- Admin password default: `gooutside2026` (stored in `admin_config` Supabase table)
- Chat token endpoint: `apps/web/app/api/chat/token/route.ts` + Stream client in `apps/web/lib/stream.ts`
- Pulse Points awarded via Supabase RPC `award_pulse_points` — never update `pulse_points_balance` directly
- Reward redemption via RPC `redeem_reward` — never deduct PP manually
- Upload routes write to Supabase Storage; use `supabaseAdmin` for service-role uploads
