-- GigChain.io Gamification & Reputation System Database Schema
-- Supports: Badges, XP, Trust Scores, Contract Matching, Bans

-- ============================================================================
-- USER STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('freelancer', 'client', 'both')),
    
    -- Experience & Level
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER DEFAULT 1000,
    
    -- Contract Stats
    total_contracts INTEGER DEFAULT 0,
    completed_contracts INTEGER DEFAULT 0,
    cancelled_contracts INTEGER DEFAULT 0,
    disputed_contracts INTEGER DEFAULT 0,
    
    -- Financial Stats
    total_earned REAL DEFAULT 0.0,
    total_spent REAL DEFAULT 0.0,
    average_contract_value REAL DEFAULT 0.0,
    
    -- Trust Metrics
    trust_score REAL DEFAULT 50.0 CHECK(trust_score >= 0 AND trust_score <= 100),
    completion_rate REAL DEFAULT 0.0 CHECK(completion_rate >= 0 AND completion_rate <= 100),
    on_time_delivery_rate REAL DEFAULT 0.0 CHECK(on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
    average_rating REAL DEFAULT 0.0 CHECK(average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    
    -- Behavior Metrics
    response_time_hours REAL DEFAULT 0.0,
    dispute_rate REAL DEFAULT 0.0,
    payment_reliability REAL DEFAULT 100.0,
    successful_negotiations INTEGER DEFAULT 0,
    
    -- Visibility & Boost
    visibility_multiplier REAL DEFAULT 1.0,
    is_boosted BOOLEAN DEFAULT 0,
    boost_reason TEXT,
    boost_expires_at DATETIME,
    
    -- Bans & Warnings
    is_banned BOOLEAN DEFAULT 0,
    ban_reason TEXT,
    banned_at DATETIME,
    warnings INTEGER DEFAULT 0,
    
    -- Timestamps
    last_contract_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_stats_wallet ON user_stats(wallet_address);
CREATE INDEX idx_user_stats_level ON user_stats(level);
CREATE INDEX idx_user_stats_trust_score ON user_stats(trust_score);
CREATE INDEX idx_user_stats_is_banned ON user_stats(is_banned);

-- ============================================================================
-- BADGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badge_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('milestone', 'trust', 'quality', 'speed', 'negotiation')),
    xp_reward INTEGER DEFAULT 0,
    rarity TEXT CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirements_json TEXT, -- JSON string of requirements
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_type ON badges(badge_type);
CREATE INDEX idx_badges_category ON badges(category);

-- ============================================================================
-- USER BADGES TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    badge_id INTEGER NOT NULL,
    badge_type TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata_json TEXT, -- JSON with earning context
    
    FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at);

-- ============================================================================
-- CONTRACTS TABLE (Extended)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id TEXT UNIQUE NOT NULL,
    
    -- Parties
    freelancer_id TEXT NOT NULL,
    freelancer_wallet TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_wallet TEXT NOT NULL,
    
    -- Contract Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    contract_value REAL NOT NULL,
    final_value REAL, -- After negotiation
    
    -- Status
    status TEXT NOT NULL CHECK(status IN (
        'pending', 'negotiating', 'accepted', 'active', 
        'completed', 'disputed', 'cancelled', 'paid'
    )),
    
    -- Negotiation Data
    was_negotiated BOOLEAN DEFAULT 0,
    negotiation_rounds INTEGER DEFAULT 0,
    initial_offer REAL,
    counter_offers_json TEXT, -- JSON array of offers
    
    -- Delivery
    deadline DATETIME,
    completed_at DATETIME,
    is_on_time BOOLEAN,
    days_early_or_late INTEGER DEFAULT 0,
    
    -- Quality & Reviews
    freelancer_rating INTEGER CHECK(freelancer_rating >= 1 AND freelancer_rating <= 5),
    freelancer_review TEXT,
    client_rating INTEGER CHECK(client_rating >= 1 AND client_rating <= 5),
    client_review TEXT,
    
    -- Payment
    payment_status TEXT CHECK(payment_status IN ('pending', 'escrowed', 'released', 'refunded', 'failed')),
    payment_failed BOOLEAN DEFAULT 0,
    payment_failure_reason TEXT,
    
    -- Dispute
    is_disputed BOOLEAN DEFAULT 0,
    dispute_reason TEXT,
    dispute_resolution TEXT,
    
    -- AI Insights
    ai_analysis_json TEXT, -- AI analysis of contract
    recommended_action TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (freelancer_id) REFERENCES user_stats(user_id),
    FOREIGN KEY (client_id) REFERENCES user_stats(user_id)
);

CREATE INDEX idx_contracts_freelancer ON contracts(freelancer_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);

-- ============================================================================
-- XP TRANSACTIONS TABLE (Audit Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS xp_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    xp_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN (
        'contract_accepted', 'contract_completed', 'on_time_bonus',
        'early_delivery_bonus', 'perfect_rating', 'negotiation_success',
        'badge_earned', 'level_up', 'penalty_late', 'penalty_dispute',
        'penalty_cancellation', 'manual_adjustment'
    )),
    level_before INTEGER,
    level_after INTEGER,
    related_contract_id TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at);

-- ============================================================================
-- USER WARNINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    warning_type TEXT NOT NULL CHECK(warning_type IN (
        'late_delivery', 'poor_quality', 'non_payment', 
        'policy_violation', 'communication_issue', 'dispute'
    )),
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    reason TEXT NOT NULL,
    issued_by TEXT, -- admin or system
    contract_id TEXT,
    is_active BOOLEAN DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_warnings_user ON user_warnings(user_id);
CREATE INDEX idx_user_warnings_active ON user_warnings(is_active);

-- ============================================================================
-- BAN RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ban_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    ban_type TEXT NOT NULL CHECK(ban_type IN ('temporary', 'permanent')),
    reason TEXT NOT NULL,
    evidence_json TEXT, -- JSON with proof
    banned_by TEXT, -- admin or system
    appeal_status TEXT CHECK(appeal_status IN ('none', 'pending', 'approved', 'denied')),
    appeal_reason TEXT,
    banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    unbanned_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_ban_records_user ON ban_records(user_id);
CREATE INDEX idx_ban_records_wallet ON ban_records(wallet_address);
CREATE INDEX idx_ban_records_active ON ban_records(expires_at);

-- ============================================================================
-- CONTRACT MATCHING PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    
    -- Contract Preferences
    min_contract_value REAL DEFAULT 0,
    max_contract_value REAL,
    preferred_categories_json TEXT, -- JSON array
    excluded_categories_json TEXT,
    
    -- Availability
    is_accepting_contracts BOOLEAN DEFAULT 1,
    max_concurrent_contracts INTEGER DEFAULT 3,
    
    -- Notifications
    notify_matched_contracts BOOLEAN DEFAULT 1,
    notify_new_badges BOOLEAN DEFAULT 1,
    notify_level_up BOOLEAN DEFAULT 1,
    
    -- Privacy
    show_badges BOOLEAN DEFAULT 1,
    show_level BOOLEAN DEFAULT 1,
    show_trust_score BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user_stats(user_id) ON DELETE CASCADE
);

-- ============================================================================
-- NEGOTIATION SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS negotiation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    contract_id TEXT NOT NULL,
    freelancer_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    
    -- Session Status
    status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'abandoned')),
    
    -- Conversation
    conversation_json TEXT, -- JSON array of messages
    
    -- AI Coaching
    ai_insights_json TEXT, -- AI recommendations during negotiation
    learning_path_json TEXT, -- Skills to improve
    
    -- Outcomes
    initial_offer REAL NOT NULL,
    final_offer REAL,
    negotiation_rounds INTEGER DEFAULT 0,
    was_successful BOOLEAN,
    
    -- Timestamps
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id),
    FOREIGN KEY (freelancer_id) REFERENCES user_stats(user_id),
    FOREIGN KEY (client_id) REFERENCES user_stats(user_id)
);

CREATE INDEX idx_negotiation_sessions_contract ON negotiation_sessions(contract_id);
CREATE INDEX idx_negotiation_sessions_status ON negotiation_sessions(status);

-- ============================================================================
-- INITIAL BADGES DATA
-- ============================================================================
INSERT INTO badges (badge_type, name, description, icon, category, xp_reward, rarity) VALUES
-- Milestone Badges
('first_contract', 'First Steps', 'Completed your first contract', '🎯', 'milestone', 100, 'common'),
('ten_contracts', 'Rising Star', 'Completed 10 contracts', '⭐', 'milestone', 500, 'rare'),
('fifty_contracts', 'Veteran', 'Completed 50 contracts', '🏆', 'milestone', 2000, 'epic'),
('hundred_contracts', 'Century Club', 'Completed 100 contracts', '👑', 'milestone', 5000, 'legendary'),

-- Trust Badges
('reliable', 'Reliable Professional', 'Maintained 95%+ completion rate', '✅', 'trust', 1000, 'rare'),
('trusted', 'Trusted Partner', '98%+ completion rate with 20+ contracts', '🛡️', 'trust', 2500, 'epic'),
('legendary', 'Legendary', '99%+ completion rate with 100+ contracts', '💎', 'trust', 10000, 'legendary'),

-- Quality Badges
('high_quality', 'Quality Pro', 'Maintained 4.5+ average rating', '⚡', 'quality', 1500, 'rare'),
('perfect_quality', 'Perfectionist', 'Perfect 5.0 rating with 10+ reviews', '✨', 'quality', 5000, 'legendary'),

-- Speed Badges
('fast_delivery', 'Fast Delivery', '5+ early deliveries', '🚀', 'speed', 750, 'rare'),
('lightning_fast', 'Lightning Fast', '20+ early deliveries', '⚡', 'speed', 3000, 'epic'),

-- Negotiation Badges
('negotiator', 'Skilled Negotiator', 'Successfully negotiated 10+ contracts', '🤝', 'negotiation', 750, 'rare'),
('master_negotiator', 'Master Negotiator', 'Successfully negotiated 50+ contracts', '💼', 'negotiation', 3000, 'epic');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Top Users by Trust Score
CREATE VIEW IF NOT EXISTS top_users_by_trust AS
SELECT 
    user_id,
    wallet_address,
    role,
    level,
    trust_score,
    completed_contracts,
    average_rating,
    visibility_multiplier
FROM user_stats
WHERE is_banned = 0
ORDER BY trust_score DESC, level DESC
LIMIT 100;

-- Active Contracts by User
CREATE VIEW IF NOT EXISTS active_contracts_summary AS
SELECT 
    u.user_id,
    u.wallet_address,
    COUNT(c.id) as active_contracts,
    SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN c.status = 'disputed' THEN 1 ELSE 0 END) as disputed,
    AVG(c.contract_value) as avg_contract_value
FROM user_stats u
LEFT JOIN contracts c ON (u.user_id = c.freelancer_id OR u.user_id = c.client_id)
WHERE u.is_banned = 0
GROUP BY u.user_id;

-- Badge Leaderboard
CREATE VIEW IF NOT EXISTS badge_leaderboard AS
SELECT 
    u.user_id,
    u.wallet_address,
    u.level,
    COUNT(ub.id) as badge_count,
    u.trust_score
FROM user_stats u
LEFT JOIN user_badges ub ON u.user_id = ub.user_id
WHERE u.is_banned = 0
GROUP BY u.user_id
ORDER BY badge_count DESC, u.level DESC, u.trust_score DESC
LIMIT 50;
