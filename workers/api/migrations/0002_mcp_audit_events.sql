-- MCP policy decisions. Payloads and credentials are intentionally excluded.
CREATE TABLE IF NOT EXISTS mcp_audit_events (
    id TEXT PRIMARY KEY,
    occurred_at TEXT NOT NULL,
    request_id TEXT NOT NULL,
    api_key_id INTEGER,
    customer_id TEXT,
    source TEXT NOT NULL,
    scopes_json TEXT NOT NULL,
    method TEXT NOT NULL,
    capability TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('allowed', 'denied')),
    error_code INTEGER,
    status_code INTEGER NOT NULL,
    input_bytes INTEGER,
    output_bytes INTEGER,
    duration_ms INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_customer_time
    ON mcp_audit_events(customer_id, occurred_at);


CREATE INDEX IF NOT EXISTS idx_mcp_audit_capability_time
    ON mcp_audit_events(capability, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_decision_time
    ON mcp_audit_events(decision, occurred_at);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_expiration
    ON mcp_audit_events(expires_at);
