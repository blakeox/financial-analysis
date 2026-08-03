import { describe, expect, it, vi } from 'vitest';
import {
  BUDGET_DIMENSIONS,
  commitBudgetReservation,
  getDefaultBudgetLimits,
  getDefaultReservationTtlSeconds,
  releaseBudgetReservation,
  reserveBudget,
  type BudgetLimits,
  type BudgetReservationRequest,
} from '../lib/usage-budget';

function limits(overrides: Partial<BudgetLimits> = {}): BudgetLimits {
  return Object.fromEntries(
    BUDGET_DIMENSIONS.map((dimension) => [dimension, overrides[dimension] ?? 0])
  ) as BudgetLimits;
}

function request(overrides: Partial<BudgetReservationRequest> = {}): BudgetReservationRequest {
  return {
    identity: { principalId: 'principal-1', clientId: 'client-1', workspaceId: 'workspace-1' },
    periodStart: '2026-08-01T00:00:00.000Z',
    periodEnd: '2026-09-01T00:00:00.000Z',
    runId: 'run-1',
    capability: 'analysis.read',
    idempotencyKey: 'run-1:analysis.read',
    units: { modelTokens: 10, toolCalls: 1 },
    limits: limits({ modelTokens: 100, toolCalls: 10 }),
    expiresAt: '2026-08-04T00:05:00.000Z',
    ...overrides,
  };
}

function createDb() {
  const prepareCalls: Array<{ sql: string; args: unknown[] }> = [];
  const db = {
    prepare: vi.fn((sql: string) => {
      const statement = {
        args: [] as unknown[],
        bind(...args: unknown[]) {
          this.args = args;
          prepareCalls.push({ sql, args });
          return this;
        },
        async first() {
          if (sql.includes('SELECT reservation_id, state, expires_at')) return null;
          if (sql.includes('SELECT reservation_id, budget_key, state, expires_at')) {
            return {
              reservation_id: 'reservation-1',
              budget_key: 'budget-key-1',
              state: 'reserved',
              expires_at: '2026-08-04T00:05:00.000Z',
              request_bytes: 0,
              model_tokens: 10,
              cost_micros: 0,
              tool_calls: 1,
              connector_bytes: 0,
              document_bytes: 0,
              queue_units: 0,
              retention_bytes: 0,
              concurrency: 0,
            };
          }
          return null;
        },
        async run() {
          return { meta: { changes: 1 } };
        },
      };
      return statement;
    }),
    batch: vi.fn(async () => [{ meta: { changes: 1 } }, { meta: { changes: 1 } }]),
  } as unknown as D1Database;
  return { db, prepareCalls };
}

describe('usage budget ledger', () => {
  it('fails closed for expensive work when the ledger is unavailable', async () => {
    const result = await reserveBudget({}, request());
    expect(result).toEqual({ allowed: false, reason: 'BUDGET_STORE_UNAVAILABLE', state: 'denied' });
  });

  it('allows deterministic formulas to degrade without permitting model work', async () => {
    const result = await reserveBudget({}, request({ degradedMode: 'deterministic' }));
    expect(result).toMatchObject({
      allowed: true,
      reservationId: null,
      state: 'degraded',
    });
  });

  it('creates an idempotent reservation using pseudonymous identity bindings', async () => {
    const { db, prepareCalls } = createDb();
    const result = await reserveBudget({ DB: db }, request());
    expect(result).toMatchObject({ allowed: true, state: 'reserved' });
    expect(prepareCalls.some(({ args }) => args.includes('principal-1'))).toBe(false);
    expect(prepareCalls.some(({ args }) => args.includes('workspace-1'))).toBe(false);
  });

  it('rejects commits larger than the original reservation', async () => {
    const { db } = createDb();
    const result = await commitBudgetReservation({ DB: db }, 'reservation-1', { modelTokens: 11 });
    expect(result).toEqual({
      committed: false,
      state: 'invalid',
      reason: 'COMMIT_EXCEEDS_RESERVATION',
    });
  });

  it('commits and releases are independently idempotent operations', async () => {
    const { db } = createDb();
    const committed = await commitBudgetReservation({ DB: db }, 'reservation-1', {
      modelTokens: 8,
      toolCalls: 1,
    });
    expect(committed).toEqual({ committed: true, state: 'committed' });

    const released = await releaseBudgetReservation({ DB: db }, 'reservation-1');
    expect(released.state).toBe('released');
  });

  it('uses bounded defaults for operator-configured policy', () => {
    expect(getDefaultBudgetLimits({})).toMatchObject({
      requestBytes: 1_048_576,
      modelTokens: 100_000,
      costMicros: 5_000_000,
      toolCalls: 100,
    });
    expect(getDefaultBudgetLimits({ BUDGET_MAX_MODEL_TOKENS: 'not-a-number' })).toMatchObject({
      modelTokens: 100_000,
    });
    expect(getDefaultReservationTtlSeconds('10')).toBe(300);
    expect(getDefaultReservationTtlSeconds('600')).toBe(600);
  });
});
