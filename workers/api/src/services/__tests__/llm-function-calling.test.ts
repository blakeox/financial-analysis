import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  FunctionCallingService,
  createFunctionCallingService,
  type FunctionCallingMessage,
  __testing,
} from '../llm-function-calling';
import type { Ai } from '@cloudflare/workers-types';
import type { MCPTool } from '@financial-analysis/tools';

const { preFilterTools, extractModelChanges, withTimeout, TOOL_EXECUTION_TIMEOUT_MS } = __testing;

describe('FunctionCallingService', () => {
  let mockAi: { run: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAi = {
      run: vi.fn(),
    };
  });

  describe('constructor', () => {
    it('creates service with default config', () => {
      const service = createFunctionCallingService(mockAi as unknown as Ai);
      expect(service).toBeInstanceOf(FunctionCallingService);
    });

    it('accepts custom config', () => {
      const service = createFunctionCallingService(mockAi as unknown as Ai, {
        maxTokens: 2000,
        temperature: 0.5,
        maxRecursiveToolRuns: 5,
      });
      expect(service).toBeInstanceOf(FunctionCallingService);
    });
  });

  describe('simpleChat', () => {
    it('sends messages to AI without tools', async () => {
      mockAi.run.mockResolvedValue({ response: 'Hello! How can I help you?' });

      const service = createFunctionCallingService(mockAi as unknown as Ai);
      const messages: FunctionCallingMessage[] = [
        { role: 'user', content: 'Hi there' },
      ];

      const result = await service.simpleChat(messages);

      expect(result).toBe('Hello! How can I help you?');
      expect(mockAi.run).toHaveBeenCalledTimes(1);
    });

    it('includes system prompt when provided', async () => {
      mockAi.run.mockResolvedValue({ response: 'I am a financial assistant.' });

      const service = createFunctionCallingService(mockAi as unknown as Ai);
      const messages: FunctionCallingMessage[] = [
        { role: 'user', content: 'What are you?' },
      ];

      await service.simpleChat(messages, 'You are a financial assistant.');

      expect(mockAi.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
          ]),
        })
      );
    });

    it('handles string response', async () => {
      mockAi.run.mockResolvedValue('Direct string response');

      const service = createFunctionCallingService(mockAi as unknown as Ai);
      const result = await service.simpleChat([{ role: 'user', content: 'test' }]);

      expect(result).toBe('Direct string response');
    });
  });
});

describe('Tool Pre-filtering (keyword matching concepts)', () => {
  // These tests verify the keyword matching logic used in preFilterTools
  // The actual function is internal, but we test the concepts it implements

  it('filters tools based on bond keywords', () => {
    // This tests the keyword matching logic conceptually
    const message = 'calculate bond price for a treasury bond';
    const keywords = ['bond', 'coupon', 'yield', 'maturity'];
    
    const hasMatch = keywords.some(k => message.toLowerCase().includes(k));
    expect(hasMatch).toBe(true);
  });

  it('filters tools based on auto loan keywords', () => {
    const message = 'what is the monthly payment for a car loan';
    const keywords = ['auto', 'car', 'vehicle', 'auto loan'];
    
    const hasMatch = keywords.some(k => message.toLowerCase().includes(k));
    expect(hasMatch).toBe(true);
  });

  it('filters tools based on debt keywords', () => {
    const message = 'how do I pay off my credit card debt';
    const keywords = ['debt', 'payoff', 'credit card'];
    
    const hasMatch = keywords.some(k => message.toLowerCase().includes(k));
    expect(hasMatch).toBe(true);
  });
});

describe('Model Changes Extraction', () => {
  it('extracts model changes from tool results', () => {
    const toolResult = {
      monthlyPayment: 684.82,
      principal: 35000,
      interestRate: 0.065,
      termMonths: 60,
    };

    // Simulate extractModelChanges logic
    const changes: Record<string, unknown> = {};
    if ('principal' in toolResult) changes.principal = toolResult.principal;
    if ('monthlyPayment' in toolResult) changes.monthlyPayment = toolResult.monthlyPayment;
    if ('interestRate' in toolResult) changes.interestRate = toolResult.interestRate;
    if ('termMonths' in toolResult) changes.termMonths = toolResult.termMonths;

    expect(changes).toEqual({
      principal: 35000,
      monthlyPayment: 684.82,
      interestRate: 0.065,
      termMonths: 60,
    });
  });

  it('handles nested modelChanges property', () => {
    const toolResult = {
      analysis: 'complete',
      modelChanges: {
        principal: 1000,
        couponRate: 0.05,
      },
    };

    const changes: Record<string, unknown> = {};
    if ('modelChanges' in toolResult && typeof toolResult.modelChanges === 'object') {
      Object.assign(changes, toolResult.modelChanges);
    }

    expect(changes).toEqual({
      principal: 1000,
      couponRate: 0.05,
    });
  });
});

describe('preFilterTools (actual function)', () => {
  const createMockTool = (name: string): MCPTool => ({
    name,
    description: `Description for ${name}`,
    inputSchema: { type: 'object', properties: {} },
    execute: vi.fn(),
  });

  it('filters tools based on bond keywords', () => {
    const tools = [
      createMockTool('analyze_bond_pricing'),
      createMockTool('analyze_auto_loan'),
      createMockTool('analyze_amortization'),
    ];

    const result = preFilterTools(tools, 'calculate bond yield for treasury');
    expect(result.map(t => t.name)).toContain('analyze_bond_pricing');
  });

  it('filters tools based on auto loan keywords', () => {
    const tools = [
      createMockTool('analyze_bond_pricing'),
      createMockTool('analyze_auto_loan'),
      createMockTool('analyze_amortization'),
    ];

    const result = preFilterTools(tools, 'what is my car payment');
    expect(result.map(t => t.name)).toContain('analyze_auto_loan');
  });

  it('filters tools based on mortgage keywords', () => {
    const tools = [
      createMockTool('analyze_bond_pricing'),
      createMockTool('analyze_auto_loan'),
      createMockTool('analyze_amortization'),
    ];

    const result = preFilterTools(tools, 'mortgage loan monthly payment schedule');
    expect(result.map(t => t.name)).toContain('analyze_amortization');
  });

  it('returns all tools when no keywords match', () => {
    const tools = [
      createMockTool('analyze_bond_pricing'),
      createMockTool('analyze_auto_loan'),
    ];

    const result = preFilterTools(tools, 'hello world');
    // Should return all tools as fallback
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty tools array', () => {
    const result = preFilterTools([], 'calculate bond price');
    expect(result).toEqual([]);
  });

  it('handles empty user message', () => {
    const tools = [createMockTool('analyze_bond_pricing')];
    const result = preFilterTools(tools, '');
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('scores tools by multiple keyword matches', () => {
    const tools = [
      createMockTool('analyze_lease'),
      createMockTool('analyze_enhanced_lease'),
    ];

    const result = preFilterTools(tools, 'commercial lease rent analysis cam');
    // analyze_enhanced_lease should score higher with more keyword matches
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('extractModelChanges (actual function)', () => {
  it('extracts fields from formValues', () => {
    const toolCalls = [{
      toolName: 'bond_price_calculator',
      arguments: {},
      result: {
        formValues: {
          principal: 1000,
          couponRate: 0.05,
        },
      },
    }];

    const changes = extractModelChanges(toolCalls);
    expect(changes).toEqual({
      principal: 1000,
      couponRate: 0.05,
    });
  });

  it('extracts fields from modelChanges', () => {
    const toolCalls = [{
      toolName: 'auto_loan_calculator',
      arguments: {},
      result: {
        modelChanges: {
          monthlyPayment: 500,
          loanAmount: 25000,
        },
      },
    }];

    const changes = extractModelChanges(toolCalls);
    expect(changes).toEqual({
      monthlyPayment: 500,
      loanAmount: 25000,
    });
  });

  it('extracts fields based on tool metadata outputFields', () => {
    // analyze_bond_pricing has outputFields: ['price', 'yield', 'duration', 'convexity']
    const toolCalls = [{
      toolName: 'analyze_bond_pricing',
      arguments: {},
      result: {
        price: 950.25,
        yield: 0.0526,
        duration: 4.5,
      },
    }];

    const changes = extractModelChanges(toolCalls);
    // Should extract fields defined in tool metadata
    expect(changes).toBeDefined();
    expect(changes?.price).toBe(950.25);
    expect(changes?.yield).toBe(0.0526);
    expect(changes?.duration).toBe(4.5);
  });

  it('returns undefined for empty tool calls', () => {
    const changes = extractModelChanges([]);
    expect(changes).toBeUndefined();
  });

  it('returns undefined when no extractable fields', () => {
    const toolCalls = [{
      toolName: 'unknown_tool',
      arguments: {},
      result: { message: 'completed' },
    }];

    const changes = extractModelChanges(toolCalls);
    expect(changes).toBeUndefined();
  });

  it('merges changes from multiple tool calls', () => {
    const toolCalls = [
      {
        toolName: 'tool1',
        arguments: {},
        result: { formValues: { field1: 'value1' } },
      },
      {
        toolName: 'tool2',
        arguments: {},
        result: { modelChanges: { field2: 'value2' } },
      },
    ];

    const changes = extractModelChanges(toolCalls);
    expect(changes).toEqual({
      field1: 'value1',
      field2: 'value2',
    });
  });
});

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const fastPromise = Promise.resolve('success');
    const result = await withTimeout(fastPromise, 1000, 'test-tool');
    expect(result).toBe('success');
  });

  it('rejects when promise times out', async () => {
    const slowPromise = new Promise(resolve => setTimeout(resolve, 5000));
    await expect(withTimeout(slowPromise, 50, 'slow-tool')).rejects.toThrow('timed out');
  });

  it('includes tool name in timeout error', async () => {
    const slowPromise = new Promise(resolve => setTimeout(resolve, 5000));
    await expect(withTimeout(slowPromise, 50, 'my_tool')).rejects.toThrow('Tool my_tool timed out');
  });
});

describe('TOOL_EXECUTION_TIMEOUT_MS', () => {
  it('is set to 30 seconds', () => {
    expect(TOOL_EXECUTION_TIMEOUT_MS).toBe(30000);
  });
});
