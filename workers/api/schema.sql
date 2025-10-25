-- D1 Database Schema for Financial Analysis
-- Run this with: npx wrangler d1 execute financial-analysis-db --file=./schema.sql

-- Analysis results cache table
CREATE TABLE IF NOT EXISTS analysis_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    analysis_type TEXT NOT NULL,
    input_data TEXT NOT NULL, -- JSON string
    result_data TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    hit_count INTEGER DEFAULT 0
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT,
    data TEXT NOT NULL, -- JSON string with session data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Financial calculations audit log
CREATE TABLE IF NOT EXISTS calculation_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    session_id TEXT,
    analysis_type TEXT NOT NULL,
    input_parameters TEXT NOT NULL, -- JSON string
    result_summary TEXT, -- JSON string with key metrics
    calculation_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
);

-- API usage metrics
CREATE TABLE IF NOT EXISTS api_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    user_agent TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys for developer access
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
    key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "fk_live_")
    customer_id TEXT NOT NULL, -- Stripe customer ID or internal user ID
    customer_email TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    active INTEGER NOT NULL DEFAULT 1, -- 0 = revoked, 1 = active
    monthly_quota INTEGER NOT NULL DEFAULT 1000, -- Requests per month
    rate_limit_per_sec INTEGER NOT NULL DEFAULT 1, -- Requests per second
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME,
    last_used_at DATETIME,
    metadata TEXT -- JSON string with additional data
);

-- API Key usage tracking (detailed per-request)
CREATE TABLE IF NOT EXISTS api_key_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    tokens_used INTEGER DEFAULT 0, -- For AI endpoints
    cost_cents INTEGER DEFAULT 0, -- Calculated cost in cents
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

-- Monthly usage aggregates (for fast dashboard queries)
CREATE TABLE IF NOT EXISTS api_key_usage_monthly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER NOT NULL,
    year_month TEXT NOT NULL, -- Format: YYYY-MM
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    total_response_time_ms INTEGER NOT NULL DEFAULT 0,
    total_tokens_used INTEGER NOT NULL DEFAULT 0,
    total_cost_cents INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    UNIQUE(api_key_id, year_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_customer ON api_keys(customer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_date ON api_key_usage(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_monthly_key ON api_key_usage_monthly(api_key_id, year_month);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_cache_key ON analysis_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_calculation_audit_session ON calculation_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created ON api_metrics(created_at);