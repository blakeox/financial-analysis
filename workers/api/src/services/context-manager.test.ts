import { describe, it, expect, vi } from 'vitest';
import { ContextManager } from './context-manager';
import { DocumentCache, type DocumentCacheConfig } from './document-cache';

vi.mock('./document-cache');

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

  it('includes AutoRAG content when available', async () => {
    const mockSearch = vi.fn().mockResolvedValue([
      {
        url: 'https://example.com/doc1',
        content: 'This is relevant content from the website.',
        metadata: { title: 'Relevant Doc' }
      }
    ]);
    
    // Setup the mock implementation
    vi.mocked(DocumentCache).mockImplementation(function() {
      return {
        search: mockSearch
      } as unknown as DocumentCache;
    });

    const manager = new ContextManager({} as unknown as DocumentCacheConfig); // Pass dummy config to trigger instantiation

    const result = await manager.build({
      message: 'Tell me about the website content',
      contextKey: 'general',
      availableTools: [],
      enableAutoRAG: true
    });

    expect(mockSearch).toHaveBeenCalledWith('Tell me about the website content', 3);
    expect(result.prompt).toContain('Relevant information from our website');
    expect(result.prompt).toContain('This is relevant content from the website');
    expect(result.prompt).toContain('Relevant Doc');
  });

  it('includes currentModel in Additional Context', async () => {
    const manager = new ContextManager();
    const currentModel = {
      loanAmount: 500000,
      interestRate: 0.05,
      termMonths: 360
    };

    const result = await manager.build({
      message: 'Change interest to 6%',
      contextKey: 'general',
      availableTools: [],
      contextData: { currentModel }
    });

    expect(result.prompt).toContain('Additional Context');
    expect(result.prompt).toContain('currentModel');
    expect(result.prompt).toContain('500000');
    expect(result.prompt).toContain('0.05');
  });

  it('includes conversation history in general context', async () => {
    const manager = new ContextManager({} as unknown as DocumentCacheConfig);
    const history = 'User: Hi\nAI: Hello';
    
    const result = await manager.build({
      message: 'How are you?',
      contextKey: 'general',
      availableTools: [],
      memoryContext: { conversationHistory: history }
    });

    expect(result.prompt).toContain('Previous Conversation:');
    expect(result.prompt).toContain(history);
  });

  it('includes Proactive Insights instructions', async () => {
    const manager = new ContextManager();
    const result = await manager.build({
      message: 'Analyze my budget',
      contextKey: 'general',
      availableTools: []
    });

    // Check full prompt as system prompt splitting might vary
    const fullContent = (result.systemPrompt || '') + result.prompt;
    expect(fullContent).toContain('Proactive Insight');
    expect(fullContent).toContain('risks, opportunities, or patterns');
  });

  it('includes Anti-Patterns instructions', async () => {
    const manager = new ContextManager();

    const result = await manager.build({
      message: 'Hello',
      contextKey: 'general',
      availableTools: [],
    });

    // The system prompt includes guidance about what NOT to do
    // Check for natural language anti-pattern guidance
    const fullContent = (result.systemPrompt || '') + result.prompt;
    expect(fullContent).toMatch(/NEVER|Anti-Patterns|NOT to do|FORBIDDEN/i);
  });

  it('includes dynamic negative constraints when provided', async () => {
    const manager = new ContextManager();
    const negative_constraints = [
      "Do not say 'I can help update the model'",
      "Do not say 'Try: set interest to'"
    ];

    const result = await manager.build({
      message: 'Hello',
      contextKey: 'general',
      availableTools: [],
      negative_constraints
    });

    expect(result.systemPrompt).toContain('CRITICAL: NEGATIVE CONSTRAINTS (FORBIDDEN RESPONSES)');
    expect(result.systemPrompt).toContain("Do not say 'I can help update the model'");
    expect(result.systemPrompt).toContain("Do not say 'Try: set interest to'");
  });
});
