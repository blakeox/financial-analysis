import { describe, expect, it, vi } from 'vitest';
import { reserveCodeModeBudget, settleCodeModeBudget } from '../lib/code-mode-budget';
import { codeModePolicyFromConfig } from '../lib/code-mode-policy';
import type { Env } from '../types';

const env = {
  BUDGET_ENFORCEMENT_ENABLED: 'true',
  BUDGET_RESERVATION_TTL_SECONDS: '300',
} as Env;

const identity = {
  principalId: 'principal-1',
  clientId: 'client-1',
  workspaceId: 'workspace-1',
};

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
              expires_at: '2099-01-01T00:00:00.000Z',
              request_bytes: 64,
              model_tokens: 0,
              cost_micros: 0,
              tool_calls: 25,
              connector_bytes: 0,
              document_bytes: 0,
              queue_units: 0,
              retention_bytes: 0,
              concurrency: 1,
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

describe('Code Mode budget adapter', () => {
  it('fails closed when the shared ledger is unavailable', async () => {
    await expect(
      reserveCodeModeBudget(
        { ...env, DB: undefined } as unknown as Env,
        identity,
        { capabilities: ['analysis.cash-flow'], requestBytes: 64 },
        codeModePolicyFromConfig({ enabled: 'true', allowedCapabilities: 'analysis.cash-flow' }),
        'run-1',
        'run-1:code-mode'
      )
    ).rejects.toThrow('CODE_MODE_BUDGET_DENIED:BUDGET_STORE_UNAVAILABLE');
  });

  it('reserves the policy tool ceiling and never binds raw identity values', async () => {
    const { db, prepareCalls } = createDb();
    const state = await reserveCodeModeBudget(
      { ...env, DB: db } as Env,
      identity,
      { capabilities: ['analysis.cash-flow'], requestBytes: 64 },
      codeModePolicyFromConfig({ enabled: 'true', allowedCapabilities: 'analysis.cash-flow' }),
      'run-1',
      'run-1:code-mode'
    );

    expect(state).toMatchObject({ reservationId: expect.any(String), runId: 'run-1' });
    expect(prepareCalls.some(({ args }) => args.includes('principal-1'))).toBe(false);
    expect(prepareCalls.some(({ args }) => args.includes('workspace-1'))).toBe(false);
  });

  it('releases aborted execution and commits bounded actual calls', async () => {
    const { db } = createDb();
    const state = {
      reservationId: 'reservation-1',
      runId: 'run-1',
      requestBytes: 64,
      toolCalls: 0,
      concurrency: 1 as const,
      limits: {
        requestBytes: 1_048_576,
        modelTokens: 0,
        costMicros: 0,
        toolCalls: 25,
        connectorBytes: 0,
        documentBytes: 0,
        queueUnits: 0,
        retentionBytes: 0,
        concurrency: 1,
      },
    };

    await expect(settleCodeModeBudget({ DB: db }, state, 'aborted', 2)).resolves.toBeUndefined();
    await expect(
      settleCodeModeBudget({ DB: db }, state, 'completed', 999)
    ).resolves.toBeUndefined();
  });
});
