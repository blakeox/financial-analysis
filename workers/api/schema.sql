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

-- MCP policy decisions. Payloads and credentials are intentionally excluded.
CREATE TABLE IF NOT EXISTS mcp_audit_events (
    id TEXT PRIMARY KEY,
    occurred_at TEXT NOT NULL,
    request_id TEXT NOT NULL,
    run_id TEXT,
    api_key_id INTEGER,
    customer_id TEXT,
    source TEXT NOT NULL,
    scopes_json TEXT NOT NULL,
    method TEXT NOT NULL,
    capability TEXT,
    policy_version TEXT,
    principal_id TEXT,
    resource_scope TEXT,
    budget_decision TEXT,
    audit_correlation_id TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('allowed', 'denied')),
    error_code INTEGER,
    status_code INTEGER NOT NULL,
    input_bytes INTEGER,
    output_bytes INTEGER,
    duration_ms INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    result_integrity_version TEXT,
    input_digest TEXT,
    output_digest TEXT,
    result_digest TEXT,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_customer_time
    ON mcp_audit_events(customer_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_run_time
    ON mcp_audit_events(run_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_capability_time
    ON mcp_audit_events(capability, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_decision_time
    ON mcp_audit_events(decision, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_correlation_time
    ON mcp_audit_events(audit_correlation_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_expiration
    ON mcp_audit_events(expires_at);

-- OAuth consent and grant lifecycle evidence. Credentials and request payloads are excluded.
CREATE TABLE IF NOT EXISTS oauth_audit_events (
    id TEXT PRIMARY KEY,
    occurred_at TEXT NOT NULL,
    request_id TEXT NOT NULL,
    user_id TEXT,
    client_id TEXT,
    grant_id TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'consent_approved',
        'consent_denied',
        'grant_listed',
        'grant_revoked',
        'grant_revoke_failed'
    )),
    decision TEXT NOT NULL CHECK (decision IN ('allowed', 'denied')),
    status_code INTEGER NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_audit_user_time
    ON oauth_audit_events(user_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_oauth_audit_grant_time
    ON oauth_audit_events(grant_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_oauth_audit_expiration
    ON oauth_audit_events(expires_at);

-- Shared reservation ledger for AI/MCP/Code Mode and connector budgets.
-- Store only stable hashes for principal/client/workspace identities.
CREATE TABLE IF NOT EXISTS usage_budget_windows (
    budget_key TEXT PRIMARY KEY,
    principal_hash TEXT NOT NULL,
    client_hash TEXT NOT NULL,
    workspace_hash TEXT,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    limits_request_bytes INTEGER NOT NULL DEFAULT 0,
    limits_model_tokens INTEGER NOT NULL DEFAULT 0,
    limits_cost_micros INTEGER NOT NULL DEFAULT 0,
    limits_tool_calls INTEGER NOT NULL DEFAULT 0,
    limits_connector_bytes INTEGER NOT NULL DEFAULT 0,
    limits_document_bytes INTEGER NOT NULL DEFAULT 0,
    limits_queue_units INTEGER NOT NULL DEFAULT 0,
    limits_retention_bytes INTEGER NOT NULL DEFAULT 0,
    limits_concurrency INTEGER NOT NULL DEFAULT 0,
    reserved_request_bytes INTEGER NOT NULL DEFAULT 0,
    reserved_model_tokens INTEGER NOT NULL DEFAULT 0,
    reserved_cost_micros INTEGER NOT NULL DEFAULT 0,
    reserved_tool_calls INTEGER NOT NULL DEFAULT 0,
    reserved_connector_bytes INTEGER NOT NULL DEFAULT 0,
    reserved_document_bytes INTEGER NOT NULL DEFAULT 0,
    reserved_queue_units INTEGER NOT NULL DEFAULT 0,
    reserved_retention_bytes INTEGER NOT NULL DEFAULT 0,
    reserved_concurrency INTEGER NOT NULL DEFAULT 0,
    used_request_bytes INTEGER NOT NULL DEFAULT 0,
    used_model_tokens INTEGER NOT NULL DEFAULT 0,
    used_cost_micros INTEGER NOT NULL DEFAULT 0,
    used_tool_calls INTEGER NOT NULL DEFAULT 0,
    used_connector_bytes INTEGER NOT NULL DEFAULT 0,
    used_document_bytes INTEGER NOT NULL DEFAULT 0,
    used_queue_units INTEGER NOT NULL DEFAULT 0,
    used_retention_bytes INTEGER NOT NULL DEFAULT 0,
    used_concurrency INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_budget_reservations (
    reservation_id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    budget_key TEXT NOT NULL,
    run_id TEXT NOT NULL,
    capability TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('reserved', 'committed', 'released', 'expired')),
    request_bytes INTEGER NOT NULL DEFAULT 0,
    model_tokens INTEGER NOT NULL DEFAULT 0,
    cost_micros INTEGER NOT NULL DEFAULT 0,
    tool_calls INTEGER NOT NULL DEFAULT 0,
    connector_bytes INTEGER NOT NULL DEFAULT 0,
    document_bytes INTEGER NOT NULL DEFAULT 0,
    queue_units INTEGER NOT NULL DEFAULT 0,
    retention_bytes INTEGER NOT NULL DEFAULT 0,
    concurrency INTEGER NOT NULL DEFAULT 0,
    actual_request_bytes INTEGER,
    actual_model_tokens INTEGER,
    actual_cost_micros INTEGER,
    actual_tool_calls INTEGER,
    actual_connector_bytes INTEGER,
    actual_document_bytes INTEGER,
    actual_queue_units INTEGER,
    actual_retention_bytes INTEGER,
    actual_concurrency INTEGER,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (budget_key) REFERENCES usage_budget_windows(budget_key)
);

CREATE INDEX IF NOT EXISTS idx_usage_budget_window_period
    ON usage_budget_windows(period_end);
CREATE INDEX IF NOT EXISTS idx_usage_budget_reservations_budget_state
    ON usage_budget_reservations(budget_key, state);
CREATE INDEX IF NOT EXISTS idx_usage_budget_reservations_expiration
    ON usage_budget_reservations(expires_at, state);
CREATE INDEX IF NOT EXISTS idx_usage_budget_reservations_run
    ON usage_budget_reservations(run_id, created_at);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_cache_key ON analysis_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_calculation_audit_session ON calculation_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created ON api_metrics(created_at);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON string for extra info
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON string for token usage, tool calls, etc.
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL, -- JSON string
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Long-term Memory table (for "Persistent Memory")
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT, -- 'fact', 'preference', 'project_detail'
    confidence REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
