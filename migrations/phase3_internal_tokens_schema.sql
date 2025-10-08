-- ============================================
-- GIGCHAIN PHASE 3: INTERNAL TOKEN SYSTEM
-- Database Schema for Off-Chain GigSoul (GSL) Tokens
-- ============================================
-- Version: 1.0.0
-- Date: 2025-10-08
-- 
-- This schema implements a complete internal token system
-- where users earn and spend GigSoul (GSL) tokens for platform activities.
-- Future migration to blockchain ERC20 is supported.
-- ============================================

-- ============================================
-- 1. USER TOKEN BALANCES
-- ============================================

CREATE TABLE IF NOT EXISTS user_token_balances (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) UNIQUE NOT NULL,
    
    -- Balances
    balance NUMERIC(20, 2) DEFAULT 0 CHECK (balance >= 0),
    staked_amount NUMERIC(20, 2) DEFAULT 0 CHECK (staked_amount >= 0),
    
    -- Lifetime statistics
    total_earned NUMERIC(20, 2) DEFAULT 0,
    total_spent NUMERIC(20, 2) DEFAULT 0,
    total_transferred_in NUMERIC(20, 2) DEFAULT 0,
    total_transferred_out NUMERIC(20, 2) DEFAULT 0,
    
    -- Earning breakdown
    earned_from_contracts NUMERIC(20, 2) DEFAULT 0,
    earned_from_xp NUMERIC(20, 2) DEFAULT 0,
    earned_from_referrals NUMERIC(20, 2) DEFAULT 0,
    earned_from_bonuses NUMERIC(20, 2) DEFAULT 0,
    
    -- Metadata
    current_fee_tier VARCHAR(20) DEFAULT 'standard',  -- standard, bronze, silver, gold, platinum
    current_discount_percent NUMERIC(5, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_earned_at TIMESTAMP,
    last_spent_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT valid_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_user_balances_address ON user_token_balances(user_address);
CREATE INDEX idx_user_balances_balance ON user_token_balances(balance DESC);
CREATE INDEX idx_user_balances_created ON user_token_balances(created_at);

COMMENT ON TABLE user_token_balances IS 'Main table tracking user GigSoul (GSL) token balances';
COMMENT ON COLUMN user_token_balances.balance IS 'Available balance (not staked)';
COMMENT ON COLUMN user_token_balances.staked_amount IS 'Currently locked in staking';

-- ============================================
-- 2. TOKEN TRANSACTIONS (AUDIT LOG)
-- ============================================

CREATE TABLE IF NOT EXISTS token_transactions (
    id BIGSERIAL PRIMARY KEY,
    
    -- User info
    user_address VARCHAR(42) NOT NULL,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL,  -- earn, spend, transfer_in, transfer_out, stake, unstake, admin_mint, admin_burn
    amount NUMERIC(20, 2) NOT NULL CHECK (amount >= 0),
    balance_before NUMERIC(20, 2) NOT NULL,
    balance_after NUMERIC(20, 2) NOT NULL,
    
    -- Context
    description TEXT,
    reason VARCHAR(100),  -- contract_completion, xp_conversion, referral, purchase, etc.
    
    -- Related entities
    contract_id VARCHAR(100),
    other_user_address VARCHAR(42),  -- For transfers
    purchase_item VARCHAR(100),  -- What was purchased
    
    -- Metadata (flexible JSON for additional context)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key
    FOREIGN KEY (user_address) REFERENCES user_token_balances(user_address) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user ON token_transactions(user_address, created_at DESC);
CREATE INDEX idx_transactions_type ON token_transactions(transaction_type);
CREATE INDEX idx_transactions_contract ON token_transactions(contract_id);
CREATE INDEX idx_transactions_created ON token_transactions(created_at DESC);
CREATE INDEX idx_transactions_metadata ON token_transactions USING gin(metadata);

COMMENT ON TABLE token_transactions IS 'Complete audit log of all token movements';
COMMENT ON COLUMN token_transactions.metadata IS 'Additional context as JSON (contract_value, xp_amount, etc.)';

-- ============================================
-- 3. TOKEN STAKING POSITIONS
-- ============================================

CREATE TABLE IF NOT EXISTS token_staking (
    id SERIAL PRIMARY KEY,
    
    -- User info
    user_address VARCHAR(42) NOT NULL,
    
    -- Staking details
    amount NUMERIC(20, 2) NOT NULL CHECK (amount > 0),
    lock_period INTEGER NOT NULL CHECK (lock_period IN (30, 90, 180)),  -- Days: 30, 90, 180
    
    -- Dates
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP NOT NULL,
    unlocked_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    early_unstake BOOLEAN DEFAULT false,
    
    -- Benefits (JSON for flexibility)
    benefits JSONB DEFAULT '{}',  -- { "trust_score_boost": 10, "xp_bonus_percent": 20, ... }
    
    -- Metadata
    stake_transaction_id BIGINT,  -- Reference to token_transactions
    unstake_transaction_id BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign keys
    FOREIGN KEY (user_address) REFERENCES user_token_balances(user_address) ON DELETE CASCADE,
    FOREIGN KEY (stake_transaction_id) REFERENCES token_transactions(id),
    FOREIGN KEY (unstake_transaction_id) REFERENCES token_transactions(id)
);

CREATE INDEX idx_staking_user ON token_staking(user_address, is_active);
CREATE INDEX idx_staking_active ON token_staking(is_active, end_date);
CREATE INDEX idx_staking_end_date ON token_staking(end_date) WHERE is_active = true;

COMMENT ON TABLE token_staking IS 'Tracks locked token positions with time-based benefits';
COMMENT ON COLUMN token_staking.benefits IS 'JSON object defining what benefits user gets';

-- ============================================
-- 4. EARNING RULES & RATES
-- ============================================

CREATE TABLE IF NOT EXISTS token_earning_rules (
    id SERIAL PRIMARY KEY,
    
    -- Rule identification
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,  -- contract, xp, referral, bonus, etc.
    
    -- Earning calculation
    base_amount NUMERIC(20, 2),  -- Fixed amount
    percentage_of_value NUMERIC(5, 2),  -- Percentage (for contracts)
    multiplier NUMERIC(5, 2) DEFAULT 1.0,
    
    -- Conditions
    min_value NUMERIC(20, 2),  -- Minimum to qualify
    max_value NUMERIC(20, 2),  -- Maximum cap
    
    -- Rule details
    description TEXT,
    formula TEXT,  -- Human-readable formula
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,  -- Lower = higher priority
    
    -- Metadata
    conditions JSONB DEFAULT '{}',  -- Additional conditions
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP
);

CREATE INDEX idx_earning_rules_category ON token_earning_rules(category, is_active);
CREATE INDEX idx_earning_rules_active ON token_earning_rules(is_active, priority);

COMMENT ON TABLE token_earning_rules IS 'Defines how users earn GSL tokens';

-- Insert default earning rules
INSERT INTO token_earning_rules (rule_name, category, percentage_of_value, description, formula) VALUES
('contract_base', 'contract', 100, 'Base earning for contract completion', '100 GSL per $1 contract value'),
('contract_on_time', 'contract', 20, 'Bonus for on-time delivery', '+20% if delivered on time'),
('contract_high_rating', 'contract', 10, 'Bonus for 5-star rating', '+10% if rating >= 4.5'),
('xp_conversion', 'xp', 5, 'Convert XP to GigSoul tokens', '5 GSL per XP point'),
('referral_signup', 'referral', 500, 'Friend signs up', '500 GSL per referral'),
('referral_first_contract', 'referral', 1000, 'Friend completes first contract', '1000 GSL when referred user completes contract'),
('profile_complete', 'bonus', 1000, 'Complete profile 100%', '1000 GSL one-time'),
('daily_login', 'bonus', 50, 'Daily login bonus', '50 GSL per day'),
('weekly_streak', 'bonus', 500, '7-day login streak', '500 GSL per week');

-- ============================================
-- 5. SPENDING CATALOG
-- ============================================

CREATE TABLE IF NOT EXISTS token_spending_catalog (
    id SERIAL PRIMARY KEY,
    
    -- Item identification
    item_id VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- premium_feature, marketplace, boost, etc.
    
    -- Pricing
    cost NUMERIC(20, 2) NOT NULL CHECK (cost > 0),
    
    -- Details
    description TEXT,
    duration_days INTEGER,  -- For time-limited items
    
    -- Benefits
    benefits JSONB DEFAULT '{}',  -- What user gets
    
    -- Limits
    max_per_user INTEGER,  -- Purchase limit
    daily_limit INTEGER,  -- Daily purchase limit
    
    -- Status
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    image_url VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    available_from TIMESTAMP DEFAULT NOW(),
    available_until TIMESTAMP
);

CREATE INDEX idx_spending_catalog_available ON token_spending_catalog(is_available, category);
CREATE INDEX idx_spending_catalog_featured ON token_spending_catalog(is_featured) WHERE is_available = true;

COMMENT ON TABLE token_spending_catalog IS 'Defines what users can purchase with GigSoul (GSL) tokens';

-- Insert default spending items
INSERT INTO token_spending_catalog (item_id, item_name, category, cost, duration_days, description) VALUES
('featured_profile_7d', 'Featured Profile (7 days)', 'premium_feature', 5000, 7, 'Your profile appears at the top of search results'),
('priority_support_30d', 'Priority Support (30 days)', 'premium_feature', 2000, 30, 'Get faster response from support team'),
('advanced_analytics_30d', 'Advanced Analytics (30 days)', 'premium_feature', 1000, 30, 'Access detailed performance metrics'),
('custom_template', 'Custom Contract Template', 'marketplace', 500, NULL, 'Create your own reusable contract template'),
('dispute_insurance', 'Dispute Insurance', 'premium_feature', 10000, NULL, 'Get insurance for contract disputes'),
('visibility_boost_24h', 'Visibility Boost (24h)', 'boost', 1000, 1, 'Boost your profile visibility for 24 hours'),
('trust_score_boost', 'Trust Score +5', 'boost', 10000, NULL, 'One-time trust score increase'),
('custom_badge', 'Custom Badge', 'marketplace', 2000, NULL, 'Create your own profile badge');

-- ============================================
-- 6. PURCHASE HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS token_purchases (
    id SERIAL PRIMARY KEY,
    
    -- User info
    user_address VARCHAR(42) NOT NULL,
    
    -- Purchase details
    item_id VARCHAR(100) NOT NULL,
    cost NUMERIC(20, 2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed',  -- completed, refunded, failed
    
    -- Validity (for time-limited items)
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Transaction reference
    transaction_id BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    refunded_at TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_address) REFERENCES user_token_balances(user_address) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES token_spending_catalog(item_id),
    FOREIGN KEY (transaction_id) REFERENCES token_transactions(id)
);

CREATE INDEX idx_purchases_user ON token_purchases(user_address, created_at DESC);
CREATE INDEX idx_purchases_item ON token_purchases(item_id);
CREATE INDEX idx_purchases_active ON token_purchases(user_address, is_active) WHERE is_active = true;

COMMENT ON TABLE token_purchases IS 'History of user purchases with GigSoul (GSL) tokens';

-- ============================================
-- 7. FUTURE BLOCKCHAIN CONVERSION
-- ============================================

CREATE TABLE IF NOT EXISTS token_conversion_queue (
    id SERIAL PRIMARY KEY,
    
    -- User info
    user_address VARCHAR(42) NOT NULL,
    
    -- Conversion details
    internal_gigs_amount NUMERIC(20, 2) NOT NULL CHECK (internal_gigs_amount > 0),
    blockchain_address VARCHAR(42) NOT NULL,
    
    -- Conversion rate (in case 1:1 changes)
    conversion_rate NUMERIC(10, 6) DEFAULT 1.0,
    erc20_amount NUMERIC(78, 0),  -- Amount in wei (18 decimals)
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed, cancelled
    
    -- Blockchain details
    target_chain_id INTEGER,
    blockchain_tx_hash VARCHAR(66),
    block_number BIGINT,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_address) REFERENCES user_token_balances(user_address)
);

CREATE INDEX idx_conversion_status ON token_conversion_queue(status, created_at);
CREATE INDEX idx_conversion_user ON token_conversion_queue(user_address);
CREATE INDEX idx_conversion_blockchain ON token_conversion_queue(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;

COMMENT ON TABLE token_conversion_queue IS 'Queue for future migration to blockchain ERC20 GigSoul tokens';
COMMENT ON COLUMN token_conversion_queue.erc20_amount IS 'Amount in wei (internal GSL * 10^18)';

-- ============================================
-- 8. SYSTEM STATISTICS (MATERIALIZED VIEW)
-- ============================================

CREATE MATERIALIZED VIEW token_system_stats AS
SELECT
    -- Supply metrics
    SUM(balance) as total_circulating,
    SUM(staked_amount) as total_staked,
    SUM(balance + staked_amount) as total_supply,
    
    -- Activity metrics
    SUM(total_earned) as total_ever_earned,
    SUM(total_spent) as total_ever_spent,
    
    -- User metrics
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE balance > 0) as active_users,
    COUNT(*) FILTER (WHERE staked_amount > 0) as staking_users,
    
    -- Averages
    AVG(balance) as avg_balance,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY balance) as median_balance,
    
    -- Last updated
    NOW() as last_updated
FROM user_token_balances;

CREATE UNIQUE INDEX idx_token_stats_refresh ON token_system_stats (last_updated);

COMMENT ON MATERIALIZED VIEW token_system_stats IS 'Cached system-wide token statistics (refresh hourly)';

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_token_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY token_system_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_balances_updated_at
    BEFORE UPDATE ON user_token_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_updated_at
    BEFORE UPDATE ON token_staking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate fee tier based on balance
CREATE OR REPLACE FUNCTION calculate_fee_tier(balance_amount NUMERIC)
RETURNS TABLE(tier VARCHAR(20), discount NUMERIC(5,2), fee NUMERIC(5,2)) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN balance_amount >= 500000 THEN 'platinum'
            WHEN balance_amount >= 100000 THEN 'gold'
            WHEN balance_amount >= 50000 THEN 'silver'
            WHEN balance_amount >= 10000 THEN 'bronze'
            ELSE 'standard'
        END as tier,
        CASE
            WHEN balance_amount >= 500000 THEN 80.0
            WHEN balance_amount >= 100000 THEN 60.0
            WHEN balance_amount >= 50000 THEN 40.0
            WHEN balance_amount >= 10000 THEN 20.0
            ELSE 0.0
        END as discount,
        CASE
            WHEN balance_amount >= 500000 THEN 0.5
            WHEN balance_amount >= 100000 THEN 1.0
            WHEN balance_amount >= 50000 THEN 1.5
            WHEN balance_amount >= 10000 THEN 2.0
            ELSE 2.5
        END as fee;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. INITIAL DATA & CONFIGURATION
-- ============================================

-- Create system/admin user for minting
INSERT INTO user_token_balances (user_address, balance) VALUES ('0x0000000000000000000000000000000000000001', 0)
ON CONFLICT (user_address) DO NOTHING;

-- ============================================
-- 11. PERMISSIONS (OPTIONAL - ADJUST AS NEEDED)
-- ============================================

-- Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO gigchain_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gigchain_app;

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Verify installation
SELECT 'GigChain Phase 3: GigSoul (GSL) Internal Token System Schema installed successfully!' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'token%' OR table_name LIKE 'user_token%'
ORDER BY table_name;
