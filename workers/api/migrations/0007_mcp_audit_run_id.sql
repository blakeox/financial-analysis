-- Preserve the stable analysis correlation key separately from the request ID.
-- Nullable keeps this additive migration compatible with existing audit rows.
ALTER TABLE mcp_audit_events ADD COLUMN run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_mcp_audit_run_time
    ON mcp_audit_events(run_id, occurred_at);
