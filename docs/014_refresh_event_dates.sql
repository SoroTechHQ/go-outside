-- Migration 014: Shift all published past events forward so the feed is non-empty.
--
-- Seed events (from ghana-seed.json) were dated April–May 2026 and are now in the past.
-- This shifts every published event whose start_datetime has already passed forward by
-- enough days that it lands ~2 weeks from now, preserving the original time-of-day and
-- event duration.
--
-- Safe to run multiple times — the WHERE clause only touches events that are still in the past.

UPDATE events
SET
  end_datetime = CASE
    WHEN end_datetime IS NOT NULL
    THEN end_datetime + (
      CEIL(EXTRACT(EPOCH FROM (NOW() - start_datetime)) / 86400)::int + 14
    ) * INTERVAL '1 day'
    ELSE NULL
  END,
  start_datetime = start_datetime + (
    CEIL(EXTRACT(EPOCH FROM (NOW() - start_datetime)) / 86400)::int + 14
  ) * INTERVAL '1 day'
WHERE
  status = 'published'
  AND start_datetime < NOW();

-- Verify the result — should show 0 rows with past start_datetime after running
-- SELECT COUNT(*) FROM events WHERE status = 'published' AND start_datetime < NOW();
