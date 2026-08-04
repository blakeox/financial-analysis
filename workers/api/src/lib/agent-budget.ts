import type { Env } from '../types';
import {
  commitBudgetReservation,
  getDefaultBudgetLimits,
  getDefaultReservationTtlSeconds,
  releaseBudgetReservation,
  reserveBudget,
  type BudgetLimits,
} from './usage-budget';

export interface AgentBudgetProps {
  userId?: unknown;
  customerId?: unknown;
  provider?: unknown;
}

export interface AgentBudgetIdentity {
  principalId: string;
  clientId: string;
  workspaceId: string;
}

export interface AgentBudgetState {
  reservationId: string | null;
  runId: string;
  requestBytes: number;
  modelTokens: number;
  toolCalls: number;
  limits: BudgetLimits;
}

function positiveSafeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function estimateBodyBytes(body: Record<string, unknown> | undefined): number {
  if (!body) return 0;
  try {
    return new TextEncoder().encode(JSON.stringify(body)).byteLength;
  } catch {
    return 0;
  }
}

export function getAgentBudgetIdentity(
  props: AgentBudgetProps | undefined,
  agentClass = 'FinancialAnalysisAgent'
): AgentBudgetIdentity | null {
  if (
    typeof props?.customerId !== 'string' ||
    typeof props.provider !== 'string' ||
    props.customerId.length === 0 ||
    props.provider.length === 0
  ) {
    return null;
  }
  return {
    principalId: props.customerId,
    clientId: `agent:${props.provider}`,
    workspaceId: agentClass,
  };
}

function getCurrentBudgetPeriod(now: Date): { periodStart: string; periodEnd: string } {
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

export async function reserveAgentBudget(
  env: Env,
  identity: AgentBudgetIdentity | null,
  body: Record<string, unknown> | undefined,
  now = new Date()
): Promise<AgentBudgetState | null> {
  if (env.BUDGET_ENFORCEMENT_ENABLED !== 'true') return null;
  if (!identity) throw new Error('AGENT_BUDGET_IDENTITY_REQUIRED');

  const runId = crypto.randomUUID();
  const limits = getDefaultBudgetLimits(env);
  // One Agent turn is one concurrent unit. The shared defaults intentionally
  // leave concurrency at zero for stateless callers, so the Agent adapter
  // opts into exactly one bounded stateful turn here.
  limits.concurrency = 1;
  const requestBytes = estimateBodyBytes(body);
  const period = getCurrentBudgetPeriod(now);
  const reservation = await reserveBudget(env, {
    identity,
    ...period,
    runId,
    capability: 'agent.turn',
    idempotencyKey: runId,
    units: {
      requestBytes,
      modelTokens: limits.modelTokens,
      toolCalls: limits.toolCalls,
      concurrency: 1,
    },
    limits,
    expiresAt: new Date(
      now.getTime() + getDefaultReservationTtlSeconds(env.BUDGET_RESERVATION_TTL_SECONDS) * 1000
    ).toISOString(),
    degradedMode: 'fail-closed',
  });

  if (!reservation.allowed) throw new Error(`AGENT_BUDGET_DENIED:${reservation.reason}`);
  return {
    reservationId: reservation.reservationId,
    runId,
    requestBytes,
    modelTokens: 0,
    toolCalls: 0,
    limits,
  };
}

export function recordAgentBudgetStep(
  state: AgentBudgetState,
  usage: { totalTokens?: unknown } | undefined,
  toolCallCount: unknown
): void {
  state.modelTokens += positiveSafeInteger(usage?.totalTokens);
  state.toolCalls += positiveSafeInteger(toolCallCount);
}

export async function settleAgentBudget(
  env: Pick<Env, 'DB'>,
  state: AgentBudgetState | null,
  status: 'completed' | 'aborted' | 'error'
): Promise<void> {
  if (!state?.reservationId) return;
  if (status === 'error') {
    await releaseBudgetReservation(env, state.reservationId);
    return;
  }

  const actual = {
    requestBytes: state.requestBytes,
    modelTokens: Math.min(state.modelTokens, state.limits.modelTokens),
    toolCalls: Math.min(state.toolCalls, state.limits.toolCalls),
    concurrency: 1,
  };
  const committed = await commitBudgetReservation(env, state.reservationId, actual);
  if (!committed.committed) {
    console.error('Agent budget commit did not settle cleanly', {
      reservationId: state.reservationId,
      state: committed.state,
      reason: committed.reason,
    });
  }
}
