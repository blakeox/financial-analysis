import { describe, expect, it } from 'vitest';
import { BondPricingInputSchema } from '../schemas/bond-pricing';
import type { BondPricingInput } from '../schemas/bond-pricing';

type InputOverrides = Partial<BondPricingInput>;
const buildInput = (overrides: InputOverrides = {}) => ({
  couponRate: 0.05,
  issueDate: '2020-01-01',
  maturityDate: '2030-01-01',
  yieldToMaturity: 0.04,
  ...overrides,
});

describe('BondPricingInputSchema', () => {
  it('applies defaults for standard bonds', () => {
    const parsed = BondPricingInputSchema.parse(buildInput());
    expect(parsed.bondType).toBe('corporate');
    expect(parsed.faceValue).toBe(1000);
    expect(parsed.couponFrequency).toBe('semi-annual');
    expect(parsed.dayCountConvention).toBe('30-360');
    expect(parsed.taxRate).toBe(0);
    expect(parsed.stateTaxRate).toBe(0);
    expect(parsed.isTaxExempt).toBe(false);
  });

  it('requires zero-coupon bonds to have zero couponRate', () => {
    const invalid = BondPricingInputSchema.safeParse(buildInput({
      bondType: 'zero-coupon',
      couponRate: 0.02,
    }));
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain('Zero-coupon bonds must have couponRate of 0');
    }

    const parsed = BondPricingInputSchema.parse(buildInput({
      bondType: 'zero-coupon',
      couponRate: 0,
    }));
    expect(parsed.couponRate).toBe(0);
  });

  it('requires floating rate bonds to include floatingRateFeatures', () => {
    const invalid = BondPricingInputSchema.safeParse(buildInput({ bondType: 'floating-rate' }));
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain('Floating rate bonds require floatingRateFeatures');
    }

    const parsed = BondPricingInputSchema.parse(buildInput({
      bondType: 'floating-rate',
      floatingRateFeatures: {
        referenceRate: 'SOFR',
        spread: 0.01,
        resetFrequency: 'quarterly',
      },
    }));
    expect(parsed.floatingRateFeatures?.referenceRate).toBe('SOFR');
  });

  it('requires convertible bonds to include convertibleFeatures', () => {
    const invalid = BondPricingInputSchema.safeParse(buildInput({ bondType: 'convertible' }));
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain('Convertible bonds require convertibleFeatures');
    }

    const parsed = BondPricingInputSchema.parse(buildInput({
      bondType: 'convertible',
      convertibleFeatures: {
        conversionRatio: 1.5,
        conversionPrice: 50,
        currentStockPrice: 45,
      },
    }));
    expect(parsed.convertibleFeatures?.conversionRatio).toBe(1.5);
  });

  it('requires inflation-linked bonds to include inflationLinkedFeatures', () => {
    const invalid = BondPricingInputSchema.safeParse(buildInput({ bondType: 'inflation-linked' }));
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain('Inflation-linked bonds require inflationLinkedFeatures');
    }

    const parsed = BondPricingInputSchema.parse(buildInput({
      bondType: 'inflation-linked',
      inflationLinkedFeatures: {
        realYield: 0.01,
        inflationRate: 0.02,
        indexRatio: 1.05,
      },
    }));
    expect(parsed.inflationLinkedFeatures?.indexRatio).toBe(1.05);
  });
});
