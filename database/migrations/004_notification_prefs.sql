-- Migration: 004_notification_prefs
--
-- Adds notification_offset to users so each account can set a default
-- minutes-before-reset reminder time. Per-game overrides continue to use
-- user_games.custom_reminder_offset (non-zero value takes priority).

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_offset INTEGER NOT NULL DEFAULT 30;
