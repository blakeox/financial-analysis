-- Persist the policy receipt fields needed to reconstruct an authorization
-- decision without retaining prompts, documents, credentials, or arguments.
ALTER TABLE mcp_audit_events ADD COLUMN policy_version TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN principal_id TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN resource_scope TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN budget_decision TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN audit_correlation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_mcp_audit_correlation_time
    ON mcp_audit_events(audit_correlation_id, occurred_at);
