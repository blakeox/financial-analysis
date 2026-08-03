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
