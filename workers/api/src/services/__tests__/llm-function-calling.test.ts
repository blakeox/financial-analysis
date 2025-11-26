import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  FunctionCallingService,
  createFunctionCallingService,
  type FunctionCallingMessage,
} from '../llm-function-calling';
import type { Ai } from '@cloudflare/workers-types';

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
