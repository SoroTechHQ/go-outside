-- Migration 013: QR nonces and ticket check-in tracking
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Required for the secure QR ticket scanner to work.

-- 1. Single-use nonces for HMAC-signed QR tokens
--    Each QR token includes a nonce stored here; it's deleted on first use.
create table if not exists qr_nonces (
  nonce        text        primary key,
  ticket_id    uuid        not null references tickets(id) on delete cascade,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists qr_nonces_ticket_id_idx  on qr_nonces(ticket_id);
create index if not exists qr_nonces_expires_at_idx on qr_nonces(expires_at);

-- 2. Check-in tracking columns on tickets
alter table tickets
  add column if not exists checked_in_at   timestamptz,
  add column if not exists checked_in_by   uuid references users(id);

-- 3. Optional: scheduled cleanup of expired nonces every 5 minutes
--    Uncomment if pg_cron is enabled in your Supabase project.
-- select cron.schedule(
--   'cleanup-qr-nonces',
--   '*/5 * * * *',
--   $$delete from qr_nonces where expires_at < now()$$
-- );
