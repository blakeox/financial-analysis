-- Pending direct-to-R2 uploads. A session is not a document until finalize
-- verifies the R2 object size, content type, and SHA-256.
CREATE TABLE IF NOT EXISTS document_upload_sessions (
    upload_id TEXT PRIMARY KEY,
    object_key TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    sha256 TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'aborted')),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_document_upload_sessions_customer_status
    ON document_upload_sessions(customer_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_document_upload_sessions_expiry
    ON document_upload_sessions(status, expires_at);
