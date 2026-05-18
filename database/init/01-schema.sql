-- v4.0 3NF normalization:
-- Dropped from users: first_name, last_name, phone (never used in app features)
-- Dropped from user_games: is_enabled (always true, never filtered on)

-- Users table
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    timezone        VARCHAR(50)  DEFAULT 'America/Los_Angeles',

    -- Role system: 1=user, 2=premium, 3=admin, 4=owner
    role            INTEGER NOT NULL DEFAULT 1,

    -- Streak tracking
    streak_count    INTEGER NOT NULL DEFAULT 0,
    streak_last_date DATE,

    -- Push notification default offset (minutes before reset)
    notification_offset INTEGER NOT NULL DEFAULT 30,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE games (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    server          VARCHAR(100) NOT NULL,
    timezone        VARCHAR(50)  NOT NULL,
    daily_reset     TIME         NOT NULL,
    icon_name       VARCHAR(100),
    source          VARCHAR(50)  DEFAULT 'game-time-master',
    is_active       BOOLEAN      DEFAULT true,
    add_count       INTEGER      NOT NULL DEFAULT 0,
    last_verified   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, server)
);

-- User's selected games
CREATE TABLE user_games (
    id                     SERIAL PRIMARY KEY,
    user_id                INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id                INTEGER REFERENCES games(id) ON DELETE CASCADE,
    custom_reminder_offset INTEGER DEFAULT 0,  -- minutes before reset (0 = use user default)
    display_order          INTEGER NOT NULL DEFAULT 0,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

-- Daily completion tracking
CREATE TABLE daily_completions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id, completion_date)
);

-- Push notification subscriptions (one row per browser/device per user)
CREATE TABLE push_subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Indexes for performance
CREATE INDEX idx_user_games_user_id       ON user_games(user_id);
CREATE INDEX idx_daily_completions_user   ON daily_completions(user_id, completion_date);
CREATE INDEX idx_games_active             ON games(is_active) WHERE is_active = true;
CREATE INDEX idx_users_role               ON users(role);
CREATE INDEX idx_push_subs_user           ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak_count DESC) WHERE streak_count > 0;
