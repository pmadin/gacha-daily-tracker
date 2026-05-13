-- Migration: 003_v3_notifications
--
-- Drops the unused reminder_settings table and replaces it with push_subscriptions.
--
-- Why reminder_settings is being dropped:
--   The table stored a fixed clock time (e.g. "8:00 PM") per user rather than a
--   per-game offset before each reset. This doesn't fit the actual use case of
--   "remind me 30 minutes before Genshin resets at 4 AM". The correct design is
--   user_games.custom_reminder_offset (already exists) paired with a push_subscriptions
--   table that tracks browser push endpoints per device. reminder_settings was never
--   populated in production and is safe to drop.

DROP TABLE IF EXISTS reminder_settings;

CREATE TABLE push_subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);
