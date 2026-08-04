import { describe, expect, it } from 'vitest';
import {
  getAgentBudgetIdentity,
  recordAgentBudgetStep,
  settleAgentBudget,
} from '../lib/agent-budget';

describe('Agent budget adapter', () => {
  it('derives budget identity only from server-provided owner props', () => {
    expect(getAgentBudgetIdentity({ customerId: 'customer-1', provider: 'oidc' })).toEqual({
      principalId: 'customer-1',
      clientId: 'agent:oidc',
      workspaceId: 'FinancialAnalysisAgent',
    });
    expect(getAgentBudgetIdentity({ customerId: 'customer-1' })).toBeNull();
    expect(getAgentBudgetIdentity({ customerId: 123, provider: 'oidc' })).toBeNull();
  });

  it('aggregates bounded model usage and tool calls across steps', () => {
    const state = {
      reservationId: 'reservation-1',
      runId: 'run-1',
      requestBytes: 10,
      modelTokens: 0,
      toolCalls: 0,
      limits: {
        requestBytes: 100,
        modelTokens: 1000,
        costMicros: 100,
        toolCalls: 10,
        connectorBytes: 0,
        documentBytes: 0,
        queueUnits: 0,
        retentionBytes: 0,
        concurrency: 1,
      },
    };
    recordAgentBudgetStep(state, { totalTokens: 120 }, 2);
    recordAgentBudgetStep(state, { totalTokens: 80 }, 1);
    recordAgentBudgetStep(state, { totalTokens: -5 }, 0);
    expect(state.modelTokens).toBe(200);
    expect(state.toolCalls).toBe(3);
  });

  it('fails closed without throwing when a failed turn has no D1 store', async () => {
    const state = {
      reservationId: 'reservation-1',
      runId: 'run-1',
      requestBytes: 10,
      modelTokens: 100,
      toolCalls: 1,
      limits: {} as never,
    };
    await expect(
      settleAgentBudget({} as Pick<import('../types').Env, 'DB'>, state, 'error')
    ).resolves.toBeUndefined();
  });
});
