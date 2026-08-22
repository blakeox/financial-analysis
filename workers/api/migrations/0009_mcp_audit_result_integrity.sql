-- Store only deterministic integrity receipts; raw MCP payloads remain excluded.
ALTER TABLE mcp_audit_events ADD COLUMN result_integrity_version TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN input_digest TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN output_digest TEXT;
ALTER TABLE mcp_audit_events ADD COLUMN result_digest TEXT;
