import type { Env } from '../types';
import {
  commitBudgetReservation,
  getDefaultBudgetLimits,
  getDefaultReservationTtlSeconds,
  releaseBudgetReservation,
  reserveBudget,
  type BudgetLimits,
} from './usage-budget';
import type { CodeModeExecutionRequest, CodeModePolicy } from './code-mode-policy';

export interface CodeModeBudgetIdentity {
  /** Values must come from verified server-side authentication and run context. */
  principalId: string;
  clientId: string;
  workspaceId?: string;
}

export interface CodeModeBudgetState {
  reservationId: string | null;
  runId: string;
  requestBytes: number;
  toolCalls: number;
  concurrency: 1;
  limits: BudgetLimits;
}

function nonNegativeSafeInteger(value: number | undefined): number {
  return Number.isSafeInteger(value) && (value ?? 0) >= 0 ? (value ?? 0) : 0;
}

function getCurrentBudgetPeriod(now: Date): { periodStart: string; periodEnd: string } {
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

/**
 * Reserve one bounded Code Mode execution in the shared ledger.
 *
 * Code Mode is expensive/stateful work, so an unavailable ledger denies the
 * run. The generated program never supplies identity or the idempotency key.
 */
export async function reserveCodeModeBudget(
  env: Env,
  identity: CodeModeBudgetIdentity,
  request: CodeModeExecutionRequest,
  policy: CodeModePolicy,
  runId: string,
  idempotencyKey: string,
  now = new Date()
): Promise<CodeModeBudgetState | null> {
  if (env.BUDGET_ENFORCEMENT_ENABLED !== 'true') return null;

  const limits = getDefaultBudgetLimits(env);
  limits.toolCalls = Math.min(limits.toolCalls, policy.maxToolCalls);
  limits.concurrency = 1;
  const requestBytes = nonNegativeSafeInteger(request.requestBytes);
  const toolCalls = policy.maxToolCalls;
  const period = getCurrentBudgetPeriod(now);
  const reservation = await reserveBudget(env, {
    identity,
    ...period,
    runId,
    capability: 'code-mode.execute',
    idempotencyKey,
    units: {
      requestBytes,
      toolCalls,
      concurrency: 1,
    },
    limits,
    expiresAt: new Date(
      now.getTime() + getDefaultReservationTtlSeconds(env.BUDGET_RESERVATION_TTL_SECONDS) * 1000
    ).toISOString(),
    degradedMode: 'fail-closed',
  });

  if (!reservation.allowed) throw new Error(`CODE_MODE_BUDGET_DENIED:${reservation.reason}`);
  return {
    reservationId: reservation.reservationId,
    runId,
    requestBytes,
    toolCalls: 0,
    concurrency: 1,
    limits,
  };
}

/** Settle or release a Code Mode reservation from a trusted host finally path. */
export async function settleCodeModeBudget(
  env: Pick<Env, 'DB'>,
  state: CodeModeBudgetState | null,
  status: 'completed' | 'aborted' | 'error',
  actualToolCalls?: number
): Promise<void> {
  if (!state?.reservationId) return;
  if (status !== 'completed') {
    await releaseBudgetReservation(env, state.reservationId);
    return;
  }

  const committed = await commitBudgetReservation(env, state.reservationId, {
    requestBytes: state.requestBytes,
    toolCalls: Math.min(nonNegativeSafeInteger(actualToolCalls), state.limits.toolCalls),
    concurrency: state.concurrency,
  });
  if (!committed.committed) {
    console.error('Code Mode budget commit did not settle cleanly', {
      reservationId: state.reservationId,
      state: committed.state,
      reason: committed.reason,
    });
  }
}
