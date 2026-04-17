# GoOutside — Feature Build TODO

## Phase 1: Layout & Quick Fixes
- [x] Remove footer from `/dashboard/messages` and `/dashboard/activity` pages
- [x] Remove footer from all dashboard pages (only show on landing `/`)

## Phase 2: UI Component Library (shadcn-style)
- [x] Install Radix UI packages + class-variance-authority
- [x] Add `scroll-area.tsx` component
- [x] Add `avatar.tsx` component (with status indicator)
- [x] Add `progress.tsx` component
- [x] Add `dropdown-menu.tsx` shadcn component
- [x] Add `toaster.tsx` — top-right toast notifications with context

## Phase 3: Ticket Flow ✅
- [x] `GetTicketModal` — ticket tiers, pricing, quantity selector, add to cart
- [x] `CartContext` — global cart state (add, remove, update quantity, clear)
- [x] `CartDrawer` — slide-in cart panel with item management
- [x] `/dashboard/checkout` — order summary, contact info, promo codes
- [x] `/dashboard/checkout/payment` — Paystack UI (mobile money, card, bank transfer)
- [x] Wired GetTicketModal into EventSidePane "Get Tickets" button

## Phase 4: Trending Page ✅
- [x] `/dashboard/trending` — Twitter-like trending events/locations/topics
- [x] Trending events with rank, fill bar, hot/rising/new badges
- [x] Trending locations section
- [x] Trending hashtags/topics section
- [x] Added to Sidebar (desktop) and BottomNav (mobile)

## Phase 5: Messages ✅
- [x] Footer removed from messages page
- [ ] Wire up Supabase messages table (conversations & messages from 006 migration)
- [ ] Real user avatars from Clerk/Supabase

## Phase 6: Notifications System ✅
- [x] `NotificationBell` component with dropdown (bell icon in header)
- [x] Browser push notification prompt + Web Notification API
- [x] `Toaster` — top-right toast system with success/error/warning/info
- [x] Wired into Providers (CartProvider + Toaster wrap everything)
- [x] NotificationBell + cart icon added to Header (mobile + desktop)
- [ ] Real notifications from Supabase (currently simulated)

## Phase 7: Profile Pages (Public) ✅
- [x] `/dashboard/user/[id]` — public attendee profile (Instagram-like)
  - Cover, avatar with online status, follow/message buttons
  - Stats row, tab bar (Been There / Friends / Following)
  - Past events grid with category badges
- [x] `/dashboard/organizer/[id]` — public organizer page (Eventbrite-like)
  - Cover + logo with verified badge, follow button
  - Stats: followers, events hosted, tickets sold, avg rating
  - Premier tier badge
  - Tabs: Events / Highlights / Reviews / About
  - Featured event hero, upcoming events list, star ratings
  - Contact + social media links

## Phase 8: Profile Edit Enhancements ✅
- [x] Cover/banner image UI in EditProfileSheet (Twitter-like, hover to change)
- [x] TweetsTab rebuilt with X/Twitter OAuth simulation, tweet selector
  - Users can connect X, see pulled tweets, select which to show
  - Uses toast for feedback

## Phase 9: Extended Event Sidepane ✅
- [x] "Get Tickets" button opens GetTicketModal instead of navigating
- [ ] More info sections (Airbnb-like amenities, FAQs) — next pass

## Phase 10: Image Storage Mapping ✅
- [x] `docs/image-storage-plan.md` — complete Supabase Storage bucket layout
  - Bucket structure, naming conventions, Clerk→Supabase sync flow
  - Size limits, RLS policies, image transformation patterns

## Phase 11: DB Additions ✅
- [x] `docs/006_messages_and_cart.sql`
  - `conversations` table (unique user pairs, RLS)
  - `messages` table (with reply threading, read receipts, RLS)
  - `cart_items` table (expires in 30 min, RLS)
  - `cover_url`, `twitter_username`, `imported_tweet_ids` added to `users`
  - `public_profiles` view for safe public profile rendering
  - Trigger: `update_conversation_last_message` keeps conversation list updated

## Remaining / Next Pass
- [ ] Wire messages to Supabase (replace demo CONVERSATIONS with real DB)
- [ ] Real notification fetch from Supabase `notifications` table
- [ ] Airbnb-like sidepane: amenities, FAQs, accessibility sections
- [ ] Real banner/avatar upload to Supabase Storage (file picker + upload)
- [ ] Friendtivite activity items → dynamic event routing by real DB IDs
- [ ] Profile completion progress bar

## Status Key
- [ ] Not started
- [x] Done
- [~] In progress
