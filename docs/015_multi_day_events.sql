-- Migration 015: Multi-day events support
-- Adds schedule_type + event_days columns to support:
--   'single'     — one date, start_datetime + end_datetime (existing behavior)
--   'continuous' — non-stop run across days (start_datetime .. end_datetime span)
--   'multi_day'  — Coachella-style per-day schedule stored in event_days JSONB
--
-- event_days JSONB format (multi_day only):
-- [
--   { "date": "2026-07-18", "label": "Day 1", "start_time": "18:00", "end_time": "23:00", "note": "Opening Night" },
--   { "date": "2026-07-19", "label": "Day 2", "start_time": "12:00", "end_time": "23:59", "note": "Main Stage" },
--   { "date": "2026-07-20", "label": "Day 3", "start_time": "12:00", "end_time": "22:00", "note": "Closing Ceremony" }
-- ]
-- For multi_day: start_datetime = first day's date+time, end_datetime = last day's date+time

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS schedule_type TEXT NOT NULL DEFAULT 'single'
    CHECK (schedule_type IN ('single', 'continuous', 'multi_day'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_days JSONB DEFAULT NULL;

-- Index for querying by schedule type
CREATE INDEX IF NOT EXISTS idx_events_schedule_type ON events(schedule_type);

-- Comment for clarity
COMMENT ON COLUMN events.schedule_type IS 'single | continuous | multi_day';
COMMENT ON COLUMN events.event_days IS 'JSON array of {date, label, start_time, end_time, note} for multi_day events';
