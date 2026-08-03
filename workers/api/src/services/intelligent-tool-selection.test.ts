import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligentToolSelector } from './intelligent-tool-selection';
import type { ModelProvider } from './model-provider';

describe('IntelligentToolSelector', () => {
  let mockAi: { run: ReturnType<typeof vi.fn> };
  let selector: IntelligentToolSelector;

  const availableTools = [
    { name: 'analyze_lease', description: 'Analyzes a commercial lease agreement' },
    { name: 'analyze_amortization', description: 'Calculates loan amortization schedule' },
    { name: 'ebitda_forecasting', description: 'Forecasts EBITDA for a business' },
  ];

  beforeEach(() => {
    mockAi = {
      run: vi.fn(),
    };
    selector = new IntelligentToolSelector(mockAi as unknown as ModelProvider);
  });

  it('should parse valid JSON response from AI', async () => {
    const mockResponse = {
      response: JSON.stringify({
        primaryTool: 'analyze_lease',
        secondaryTools: [],
        reasoning: 'User is asking about a lease',
        confidence: 0.95,
        suggestedParameters: {},
      }),
    };

    mockAi.run.mockResolvedValue(mockResponse);

    const result = await selector.selectTools('Analyze this lease', availableTools);

    expect(result.primaryTool).toBe('analyze_lease');
    expect(result.confidence).toBe(0.95);
  });

  it('should fallback to keyword matching on AI error', async () => {
    mockAi.run.mockRejectedValue(new Error('AI Error'));

    const result = await selector.selectTools('Calculate amortization for a loan', availableTools);

    expect(result.primaryTool).toBe('analyze_amortization');
    expect(result.confidence).toBe(0.6); // Fallback confidence is 0.6 in implementation
  });

  it('should fallback to keyword matching on invalid JSON', async () => {
    mockAi.run.mockResolvedValue({ response: 'Invalid JSON' });

    const result = await selector.selectTools('Forecast EBITDA', availableTools);

    expect(result.primaryTool).toBe('ebitda_forecasting');
  });

  it('should return no tool if no keywords match in fallback', async () => {
    mockAi.run.mockRejectedValue(new Error('AI Error'));

    const result = await selector.selectTools('What is the weather?', availableTools);

    expect(result.primaryTool).toBeUndefined();
  });
});
