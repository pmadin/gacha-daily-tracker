-- Users table (Updated)
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       username VARCHAR(50) UNIQUE NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',

    -- Optional profile fields
                       first_name VARCHAR(100),  -- Optional
                       last_name VARCHAR(100),   -- Optional
                       phone VARCHAR(20),        -- Optional (for future SMS features)

    -- Role system (1=user, 2=premium, 3=admin, 4=owner)
                       role INTEGER DEFAULT 1 NOT NULL,

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table (from Game-Time-Master data)
CREATE TABLE games (
                       id SERIAL PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       server VARCHAR(100) NOT NULL,
                       timezone VARCHAR(50) NOT NULL,
                       daily_reset TIME NOT NULL,
                       icon_name VARCHAR(100),
                       source VARCHAR(50) DEFAULT 'game-time-master',
                       is_active BOOLEAN DEFAULT true,
                       last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       UNIQUE(name, server)
);

-- User's selected games
CREATE TABLE user_games (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                            game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
                            custom_reminder_offset INTEGER DEFAULT 0, -- minutes before reset
                            is_enabled BOOLEAN DEFAULT true,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE(user_id, game_id)
);

-- Daily completion tracking
CREATE TABLE daily_completions (
                                   id SERIAL PRIMARY KEY,
                                   user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                   game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
                                   completion_date DATE NOT NULL,
                                   completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   UNIQUE(user_id, game_id, completion_date)
);

-- Reminder preferences
CREATE TABLE reminder_settings (
                                   id SERIAL PRIMARY KEY,
                                   user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                   reminder_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'custom'
                                   is_enabled BOOLEAN DEFAULT true,
                                   reminder_time TIME,
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_daily_completions_user_date ON daily_completions(user_id, completion_date);
CREATE INDEX idx_games_active ON games(is_active) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role);
