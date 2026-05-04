# GoOutside

**GoOutside** is a social event discovery platform built for Ghana — helping people find events, follow organizers, earn loyalty rewards, and connect with friends around shared experiences.

## What's Inside

This is a `pnpm` monorepo with the following apps and packages:

| Package | Description |
|---|---|
| `apps/web` | Next.js 15 web app (port 3000) — the main consumer product |
| `apps/admin` | Next.js 15 admin dashboard (port 3001) |
| `packages/api` | Express API — feed scoring, sessions, interactions, tickets |
| `packages/ui` | Shared component library (cards, sidebar, topbar, etc.) |
| `packages/demo-data` | Ghana seed data — 120 users, 30 events, social graph |

## Tech Stack

- **Framework** — Next.js 15 (App Router), React 19, TypeScript
- **Auth** — Clerk v7
- **Database** — Supabase (Postgres + Storage + Realtime)
- **Styling** — Tailwind CSS v4
- **State** — TanStack Query v5
- **Chat** — Stream Chat
- **Payments** — Paystack
- **Email** — Resend
- **AI** — Anthropic Claude API (event discovery chat, "Why This?", Weekend Assistant)
- **Animations** — Framer Motion, Atropos

## Features

- Full auth flow (sign-in, sign-up, onboarding — 5 steps)
- AI-personalized event feed with social signals
- Event detail pages + ticket purchase flow
- Full-text search across events, users, and snippets + AI chat panel
- Stream Chat DMs
- Pulse Points & Rewards system — earn, track, redeem, badges
- Organizer dashboard — analytics, sales, post creation, hashtag performance
- Public profiles — users, organizers
- Follow system, posts, likes
- QR code tickets
- Waitlist + admin CSV view

## Dev Commands

```bash
pnpm install        # install all dependencies
pnpm dev:web        # start web app on port 3000
pnpm dev:admin      # start admin dashboard on port 3001
pnpm dev:api        # start Express API
pnpm build          # build all packages
pnpm typecheck      # typecheck all packages
```

## Database

11 Supabase migration files live in `docs/` — apply them in order (`001` → `011`) to set up the schema. See `CLAUDE.md` for the full migration table.

## Environment Variables

Copy `.env.example` to `apps/web/.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_API_SECRET=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=
```

## Contributors

Built by the Soro Technologies team.
