import type { Env } from '../types';

export type OAuthAuditAction =
  'consent_approved' | 'consent_denied' | 'grant_listed' | 'grant_revoked' | 'grant_revoke_failed';

export interface OAuthAuditEvent {
  requestId: string;
  occurredAt: string;
  userId?: string;
  clientId?: string;
  grantId?: string;
  action: OAuthAuditAction;
  decision: 'allowed' | 'denied';
  statusCode: number;
}

const DEFAULT_RETENTION_DAYS = 90;
const MAX_RETENTION_DAYS = 3650;

export function getOAuthAuditRetentionDays(env: Env): number {
  const configured = Number.parseInt(env.OAUTH_AUDIT_RETENTION_DAYS ?? '', 10);
  if (!Number.isInteger(configured) || configured < 1 || configured > MAX_RETENTION_DAYS) {
    return DEFAULT_RETENTION_DAYS;
  }
  return configured;
}

export function getOAuthAuditExpiration(env: Env, occurredAt: string): string {
  const expiration = new Date(occurredAt);
  expiration.setUTCDate(expiration.getUTCDate() + getOAuthAuditRetentionDays(env));
  return expiration.toISOString();
}

/**
 * Persist OAuth lifecycle evidence without retaining authorization codes,
 * access tokens, refresh tokens, email addresses, or request bodies.
 */
export async function recordOAuthAuditEvent(env: Env, event: OAuthAuditEvent): Promise<void> {
  if (!env.DB) return;

  try {
    await env.DB.prepare(
      `
        INSERT INTO oauth_audit_events (
          id, occurred_at, request_id, user_id, client_id, grant_id,
          action, decision, status_code, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        crypto.randomUUID(),
        event.occurredAt,
        event.requestId,
        event.userId ?? null,
        event.clientId ?? null,
        event.grantId ?? null,
        event.action,
        event.decision,
        event.statusCode,
        getOAuthAuditExpiration(env, event.occurredAt)
      )
      .run();
  } catch (error) {
    console.error('Failed to persist OAuth audit event:', error);
  }
}

export async function purgeExpiredOAuthAuditEvents(
  env: Env,
  now: Date = new Date()
): Promise<number> {
  if (!env.DB) return 0;

  try {
    const result = await env.DB.prepare('DELETE FROM oauth_audit_events WHERE expires_at <= ?')
      .bind(now.toISOString())
      .run();
    return result.meta?.changes ?? 0;
  } catch (error) {
    console.error('Failed to purge expired OAuth audit events:', error);
    return 0;
  }
}
