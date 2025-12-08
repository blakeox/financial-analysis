import { describe, expect, it } from 'vitest';
import { OptionsPricingInputSchema } from '../schemas/options-pricing';
import type { OptionsPricingInput } from '../schemas/options-pricing';

type InputOverrides = Partial<OptionsPricingInput>;
const buildInput = (overrides: InputOverrides = {}) => ({
  optionType: 'call',
  strikePrice: 100,
  currentPrice: 110,
  expirationDate: '2025-12-31',
  riskFreeRate: 0.02,
  volatility: 0.3,
  ...overrides,
});

describe('OptionsPricingInputSchema', () => {
  it('applies defaults for optional fields', () => {
    const parsed = OptionsPricingInputSchema.parse(buildInput());
    expect(parsed.optionStyle).toBe('american');
    expect(parsed.contractSize).toBe(100);
    expect(parsed.dividends).toEqual([]);
    expect(parsed.greeksPrecision).toBe('medium');
    expect(parsed.calculateImpliedVolatility).toBe(false);
  });

  it('requires Bermudan exercise dates', () => {
    const result = OptionsPricingInputSchema.safeParse(buildInput({ optionStyle: 'bermudan' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Bermudan options require bermudanExerciseDates');
    }

    const parsed = OptionsPricingInputSchema.parse(buildInput({
      optionStyle: 'bermudan',
      bermudanExerciseDates: ['2025-06-30'],
    }));
    expect(parsed.bermudanExerciseDates).toEqual(['2025-06-30']);
  });

  it('requires marketPrice for implied volatility', () => {
    const result = OptionsPricingInputSchema.safeParse(buildInput({ calculateImpliedVolatility: true }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Implied volatility calculation requires marketPrice');
    }

    const parsed = OptionsPricingInputSchema.parse(buildInput({
      calculateImpliedVolatility: true,
      marketPrice: 4.2,
    }));
    expect(parsed.marketPrice).toBe(4.2);
  });

  it('validates price range ordering', () => {
    const invalid = OptionsPricingInputSchema.safeParse(buildInput({
      priceRange: { min: 120, max: 110, step: 5 },
    }));
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain('Price range min must be less than max');
    }

    const parsed = OptionsPricingInputSchema.parse(buildInput({
      priceRange: { min: 90, max: 130, step: 10 },
    }));
    expect(parsed.priceRange).toEqual({ min: 90, max: 130, step: 10 });
  });
});
