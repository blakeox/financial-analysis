import { describe, it, expect } from 'vitest';
import { ContextManager } from './context-manager';

describe('ContextManager', () => {
  it('includes tool outputs in the built prompt and metadata', async () => {
    const manager = new ContextManager();

    const toolOutputs = {
      analyze_amortization: {
        monthlyPayment: 2450.35,
        totalInterest: 82000,
      },
      analyze_cash_flow: 'Projected burn gives 12 months of runway.',
    };

    const result = await manager.build({
      message: 'What should I do next?',
      contextKey: 'general',
      availableTools: [],
      toolOutputs,
    });

    expect(result.prompt).toContain('Recent MCP Tool Outputs');
    expect(result.prompt).toContain('analyze_amortization');
    expect(result.prompt).toContain('analyze_cash_flow');
    expect(result.prompt).toContain('MCP verified result');
    expect(result.metadata?.toolOutputsIncluded).toBe(2);
  });

  it('changes cache key when tool outputs change', async () => {
    const manager = new ContextManager();

    const baseRequest = {
      message: 'Summarize my status',
      contextKey: 'general',
      availableTools: [],
    };

    const first = await manager.build({
      ...baseRequest,
      toolOutputs: { analyze_debt_payoff: { plan: 'snowball' } },
    });

    const second = await manager.build({
      ...baseRequest,
      toolOutputs: { analyze_debt_payoff: { plan: 'avalanche' } },
    });

    expect(first.cacheKey).not.toBe(second.cacheKey);
  });

  it('includes MCP tool lists and guidance for calculator contexts', async () => {
    const manager = new ContextManager();

    const result = await manager.build({
      message: 'Can you review my lease?',
      contextKey: 'lease',
      availableTools: [
        { name: 'analyze_lease', description: 'Full commercial lease analysis' },
        { name: 'analyze_cash_flow', description: 'Cash projections' },
      ],
    });

    expect(result.systemPrompt).toContain('Available MCP Tools');
    expect(result.systemPrompt).toContain('MCP Usage Requirements');
    expect(result.systemPrompt).toContain('analyze_lease');
  });
});
