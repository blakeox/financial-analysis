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
