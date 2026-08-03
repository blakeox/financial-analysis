import type { Env } from '../types';

export interface MCPAuditEvent {
  requestId: string;
  runId: string;
  occurredAt: string;
  apiKeyId?: number;
  customerId?: string;
  source: string;
  scopes: readonly string[];
  method: string;
  capability?: string;
  policyVersion?: string;
  principalId?: string;
  resourceScope?: string;
  budgetDecision?: string;
  auditCorrelationId?: string;
  decision: 'allowed' | 'denied';
  errorCode?: number;
  statusCode: number;
  inputBytes?: number;
  outputBytes?: number;
  durationMs: number;
}

const DEFAULT_RETENTION_DAYS = 90;
const MAX_RETENTION_DAYS = 3650;

export function getMCPAuditRetentionDays(env: Env): number {
  const configured = Number.parseInt(env.MCP_AUDIT_RETENTION_DAYS ?? '', 10);
  if (!Number.isInteger(configured) || configured < 1 || configured > MAX_RETENTION_DAYS) {
    return DEFAULT_RETENTION_DAYS;
  }
  return configured;
}

export function getMCPAuditExpiration(env: Env, occurredAt: string): string {
  const expiration = new Date(occurredAt);
  expiration.setUTCDate(expiration.getUTCDate() + getMCPAuditRetentionDays(env));
  return expiration.toISOString();
}

/**
 * Persist an MCP authorization decision without retaining sensitive payloads.
 * Audit failures are observable but never change the MCP response outcome.
 */
export async function recordMCPAuditEvent(env: Env, event: MCPAuditEvent): Promise<void> {
  if (!env.DB) {
    return;
  }

  try {
    await env.DB.prepare(
      `
        INSERT INTO mcp_audit_events (
          id, occurred_at, request_id, run_id, api_key_id, customer_id, source,
          scopes_json, method, capability, policy_version, principal_id,
          resource_scope, budget_decision, audit_correlation_id, decision,
          error_code, status_code, input_bytes, output_bytes, duration_ms, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        crypto.randomUUID(),
        event.occurredAt,
        event.requestId,
        event.runId,
        event.apiKeyId ?? null,
        event.customerId ?? null,
        event.source,
        JSON.stringify(event.scopes),
        event.method,
        event.capability ?? null,
        event.policyVersion ?? null,
        event.principalId ?? null,
        event.resourceScope ?? null,
        event.budgetDecision ?? null,
        event.auditCorrelationId ?? null,
        event.decision,
        event.errorCode ?? null,
        event.statusCode,
        event.inputBytes ?? null,
        event.outputBytes ?? null,
        event.durationMs,
        getMCPAuditExpiration(env, event.occurredAt)
      )
      .run();
  } catch (error) {
    console.error('Failed to persist MCP audit event:', error);
  }
}

export async function purgeExpiredMCPAuditEvents(
  env: Env,
  now: Date = new Date()
): Promise<number> {
  if (!env.DB) {
    return 0;
  }

  try {
    const result = await env.DB.prepare('DELETE FROM mcp_audit_events WHERE expires_at <= ?')
      .bind(now.toISOString())
      .run();
    return result.meta?.changes ?? 0;
  } catch (error) {
    console.error('Failed to purge expired MCP audit events:', error);
    return 0;
  }
}
