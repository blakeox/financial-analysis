import { describe, expect, it } from 'vitest';
import { RealOptionsInputSchema } from '../schemas';
import { RealOptionsAnalyzer } from '../engines/real-options';

type RealOptionsInputOverrides = Partial<import('../schemas').RealOptionsInput>;
const buildInput = (overrides: RealOptionsInputOverrides = {}) => ({
  initialInvestment: 1000000,
  expectedCashFlows: [300000, 400000, 500000, 400000, 300000],
  volatility: 0.25,
  riskFreeRate: 0.03,
  timeToMaturity: 5,
  optionType: 'expand' as const,
  exercisePrice: 500000,
  expansionCost: 500000,
  salvageValue: 200000,
  ...overrides,
});

describe('RealOptionsInputSchema', () => {
  it('validates required fields', () => {
    const parsed = RealOptionsInputSchema.parse(buildInput());
    expect(parsed.initialInvestment).toBe(1000000);
    expect(parsed.expectedCashFlows).toEqual([300000, 400000, 500000, 400000, 300000]);
    expect(parsed.volatility).toBe(0.25);
    expect(parsed.riskFreeRate).toBe(0.03);
    expect(parsed.timeToMaturity).toBe(5);
    expect(parsed.optionType).toBe('expand');
  });

  it('requires positive initial investment', () => {
    const result = RealOptionsInputSchema.safeParse(buildInput({ initialInvestment: -1000 }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Initial investment must be positive');
    }
  });

  it('requires at least one cash flow', () => {
    const result = RealOptionsInputSchema.safeParse(buildInput({ expectedCashFlows: [] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one cash flow required');
    }
  });

  it('validates volatility range', () => {
    const result = RealOptionsInputSchema.safeParse(buildInput({ volatility: 1.5 }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Volatility must be between 0 and 1');
    }
  });

  it('validates risk-free rate range', () => {
    const result = RealOptionsInputSchema.safeParse(buildInput({ riskFreeRate: -0.01 }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Risk-free rate must be between 0 and 1');
    }
  });

  it('validates option types', () => {
    const validTypes = ['expand', 'abandon', 'delay'];
    for (const type of validTypes) {
      const parsed = RealOptionsInputSchema.parse(buildInput({ optionType: type as any }));
      expect(parsed.optionType).toBe(type);
    }

    const result = RealOptionsInputSchema.safeParse(buildInput({ optionType: 'invalid' as any }));
    expect(result.success).toBe(false);
  });
});

describe('RealOptionsAnalyzer', () => {
  it('calculates basic project metrics', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.npv).toBeDefined();
    expect(typeof result.npv).toBe('number');
    expect(result.irr).toBeDefined();
    expect(typeof result.irr).toBe('number');
    expect(result.paybackPeriod).toBeDefined();
    expect(typeof result.paybackPeriod).toBe('number');
  });

  it('calculates option value', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.optionValue).toBeDefined();
    expect(typeof result.optionValue).toBe('number');
    expect(result.optionValue).toBeGreaterThanOrEqual(0);
  });

  it('calculates total value', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.totalValue).toBeDefined();
    expect(typeof result.totalValue).toBe('number');
    expect(result.totalValue).toBe(result.npv + result.optionValue);
  });

  it('calculates option Greeks', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.delta).toBeDefined();
    expect(typeof result.delta).toBe('number');
    expect(result.gamma).toBeDefined();
    expect(typeof result.gamma).toBe('number');
    expect(result.theta).toBeDefined();
    expect(typeof result.theta).toBe('number');
    expect(result.rho).toBeDefined();
    expect(typeof result.rho).toBe('number');
  });

  it('generates recommendation', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.recommendation).toBeDefined();
    expect(typeof result.recommendation).toBe('string');
    expect(result.recommendation.length).toBeGreaterThan(0);
  });

  it('generates insights', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.insights).toBeDefined();
    expect(Array.isArray(result.insights)).toBe(true);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it('generates risks', () => {
    const input = buildInput();
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.risks).toBeDefined();
    expect(Array.isArray(result.risks)).toBe(true);
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it('handles expand option type', () => {
    const input = buildInput({ optionType: 'expand' });
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.optionValue).toBeGreaterThanOrEqual(0);
    expect(result.recommendation).toContain('expand');
  });

  it('handles abandon option type', () => {
    const input = buildInput({ optionType: 'abandon' });
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.optionValue).toBeGreaterThanOrEqual(0);
    expect(result.recommendation).toContain('abandon');
  });

  it('handles delay option type', () => {
    const input = buildInput({ optionType: 'delay' });
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.optionValue).toBeGreaterThanOrEqual(0);
    expect(result.recommendation).toContain('delay');
  });

  it('handles high volatility', () => {
    const input = buildInput({ volatility: 0.4 });
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.insights.some(insight =>
      insight.includes('High volatility') && insight.includes('40.0%')
    )).toBe(true);
  });

  it('handles low volatility', () => {
    const input = buildInput({ volatility: 0.05 });
    const result = RealOptionsAnalyzer.analyze(input);

    expect(result.risks.some(risk =>
      risk.includes('Low volatility')
    )).toBe(true);
  });
});