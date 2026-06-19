# Before Launch — GoOutside Production Checklist

> Run `node scripts/check-launch-readiness.mjs` at any time to get a live pass/fail against this list.

---

## REMOVE — Delete before pushing to production

These files and routes exist only for testing. They must be deleted before the app is public.

| Item | Path | Why |
|------|------|-----|
| Seed UI page | `apps/web/app/seed/` | Exposes a database write/wipe tool to anyone who finds the URL |
| Seed API route | `apps/web/app/api/seed/` | Same — public endpoint that can nuke or populate the DB |
| Seed data module | `apps/web/lib/seed/` | Only referenced by the seed feature above |
| CLI seed script | `scripts/seed-ghana-real.mjs` | Dev tool, not needed at runtime |
| Old seed script | `documents/scripts/seed-ghana.mjs` | Same |

**Quick removal:**
```bash
rm -rf apps/web/app/seed
rm -rf apps/web/app/api/seed
rm -rf apps/web/lib/seed
```

---

## SECURE — Change before going live

These exist but use weak defaults that are fine for development and dangerous in production.

### 1. Waitlist admin page (`/ad-waitlist`)
- **Problem:** Uses a static password stored in Supabase `admin_config` table. The default was set during development.
- **Fix:** Either (a) change the password to something strong in `admin_config`, or (b) replace the password gate with Clerk's admin role check so only your actual account can access it.
- **File:** `apps/web/app/ad-waitlist/page.tsx`

### 2. Seed page password (`SEED_PASSWORD` env var)
- **Problem:** Defaults to the same password used across dev tooling if the env var is not set.
- **Fix:** This route should be deleted entirely (see REMOVE above). If for any reason you keep it, set a strong unique `SEED_PASSWORD` in Vercel environment variables — and set it to Production environment only.
- **Vercel dashboard:** Settings → Environment Variables → remove `SEED_PASSWORD` entirely after deleting the route.

### 3. Organizer dashboard access (`/organizer/*`)
- **Problem:** Any signed-in user who knows the URL can access the organizer dashboard. There is no role check.
- **Fix:** Add a middleware matcher for `/organizer(.*)` and verify `user.role === 'organizer'` before allowing access.
- **File:** `apps/web/middleware.ts`

### 4. Alpha / internal pages
- **Problem:** Internal preview pages may use the same static password pattern.
- **Fix:** Audit all routes in `apps/web/app/` that render a password input and replace with Clerk-based auth or remove entirely.

---

## COMPLETE — Wired but not finished

These features are partially built. The app will work without them, but users will hit dead ends.

| Feature | What's missing | Where to finish |
|---------|---------------|-----------------|
| Paystack webhook | Payment succeeds but tickets are never created | `apps/web/app/api/webhooks/paystack/route.ts` |
| Supabase Storage buckets | Upload routes exist but buckets need to be created in Supabase dashboard with public policies | Supabase dashboard → Storage |
| pg_cron monthly streaks | `process_monthly_streaks()` function exists but is never scheduled | Supabase dashboard → Database → pg_cron |
| Transactional emails | Ticket confirmation, event reminders, follow notifications not wired to Resend | `apps/web/lib/email/` |
| Real-time notifications | Currently polls on load; needs Supabase Realtime subscription | `apps/web/app/dashboard/notifications/` |
| Event check-in | QR scanner UI not built | New page required |
| Message requests | `message_requests` table exists; not surfaced in messages UI | `apps/web/app/dashboard/messages/` |

---

## AUDIT — Check before each production deploy

- [ ] All Vercel environment variables are set to their production values (not dev/test URLs or keys)
- [ ] Supabase RLS policies are enabled and tested — `supabaseAdmin` (service role) is server-only and never sent to the browser
- [ ] Clerk webhook secret is configured for the production domain in Clerk dashboard
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and related Clerk URLs point to the production domain
- [ ] No seed data in the production database — run `pnpm seed:status` to confirm all counts are 0
- [ ] Paystack is in live mode (not test mode) with the correct live keys in Vercel
- [ ] Resend domain is verified for the production sending address

---

## CLEAN UP — Nice to have, not blocking

- Remove `documents/scripts/seed-ghana.mjs` — superseded by `scripts/seed-ghana-real.mjs`
- Remove `scripts/simulate.ts` or move it to a dev-only package — not needed at runtime
- Confirm `TODO.md` and `how-to.txt` at the repo root are not exposing internal notes
- Archive or remove `boilerplates/` if it's not referenced anywhere

---

## Verify readiness

```bash
# Check which blocking items are still present
node scripts/check-launch-readiness.mjs
```

A clean run prints: `All blocking items resolved. Safe to launch.`
