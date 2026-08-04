-- Durable metadata for R2-backed uploads. MCP formula execution remains
-- stateless; this table belongs to the authenticated document API boundary.
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    object_key TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
    sha256 TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'stored' CHECK (status IN ('stored', 'deleted')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_customer_created
    ON documents(customer_id, created_at);

CREATE INDEX IF NOT EXISTS idx_documents_status
    ON documents(status, created_at);
