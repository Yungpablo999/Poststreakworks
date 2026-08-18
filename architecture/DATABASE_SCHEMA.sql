-- ==========================================================
-- PostStreak™ Production Database Schema (PostgreSQL 16)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    handle VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    niche VARCHAR(100) DEFAULT 'General Creator',
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'founding')),
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DAILY STREAKS TABLE
CREATE TABLE IF NOT EXISTS daily_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_count INT DEFAULT 1,
    longest_count INT DEFAULT 1,
    last_post_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_status VARCHAR(20) DEFAULT 'active' CHECK (streak_status IN ('active', 'at_risk', 'frozen')),
    freeze_tokens INT DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CONNECTED ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS connected_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id VARCHAR(40) NOT NULL CHECK (platform_id IN ('tiktok', 'instagram', 'youtube', 'x', 'linkedin', 'threads', 'snapchat')),
    handle VARCHAR(120) NOT NULL,
    followers_count INT DEFAULT 0,
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    auto_sync BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform_id)
);

-- 4. CREATOR PASSPORTS TABLE
CREATE TABLE IF NOT EXISTS creator_passports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passport_score INT DEFAULT 70,
    profile_strength INT DEFAULT 80,
    consistency_rating VARCHAR(30) DEFAULT 'Strong',
    collaboration_level VARCHAR(30) DEFAULT 'Beginner',
    marketplace_ready BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT TRUE,
    activity_history_valid BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. POSTS & METRICS TABLE
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id VARCHAR(40) NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    saves INT DEFAULT 0,
    shares INT DEFAULT 0,
    estimated_revenue NUMERIC(10, 2) DEFAULT 0.00,
    velocity_score NUMERIC(5, 2) DEFAULT 1.00,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. QUESTS TABLE
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(30) DEFAULT 'daily' CHECK (category IN ('daily', 'starter', 'community', 'brand')),
    xp_reward INT DEFAULT 80,
    streak_protected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. USER QUEST PROGRESS TABLE
CREATE TABLE IF NOT EXISTS user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    progress INT DEFAULT 0,
    max_progress INT DEFAULT 1,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, quest_id)
);

-- 8. CREATOR EARNINGS & PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS earnings_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'brand_deal', 'tracked_platform', 'referral'
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestone_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_amount NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    label VARCHAR(100) DEFAULT 'First $50 Goal',
    active BOOLEAN DEFAULT TRUE,
    achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings_records(user_id);
