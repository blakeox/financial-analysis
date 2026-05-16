import { describe, expect, it } from 'vitest';

import type { NPVIRRInput } from '../../../schemas/npv-irr.js';
import { NPVIRRCalculator } from '../npv-irr.js';

describe('NPVIRRCalculator', () => {
  it('calculates NPV, IRR, and payback period', () => {
    const input: NPVIRRInput = {
      cashFlows: [-1000, 400, 400, 400],
      discountRate: 0.1,
      sensitivityDiscountRates: [0.08, 0.1, 0.12],
    };

    const result = NPVIRRCalculator.analyze(input);
    expect(result.npv).toBeCloseTo(-5.26, 1);
    expect(result.irr).not.toBeNull();
    expect(result.irr ?? 0).toBeGreaterThan(0);
    expect(result.irr ?? 0).toBeLessThan(0.2);
    expect(result.paybackPeriod).toBeCloseTo(2.5, 10);
    expect(result.sensitivity?.length).toBe(3);
  });

  it('returns NaN NPV when discount rate is -100%', () => {
    const input: NPVIRRInput = {
      cashFlows: [-1000, 500, 600],
      discountRate: -1,
    };

    const result = NPVIRRCalculator.analyze(input);
    expect(Number.isNaN(result.npv)).toBe(true);
    expect(result.sensitivity).toBeUndefined();
  });

  it('returns null IRR and payback when cash flows never recover', () => {
    const input: NPVIRRInput = {
      cashFlows: [-1000, -200, -100, -50],
      discountRate: 0.05,
    };

    const result = NPVIRRCalculator.analyze(input);
    expect(result.irr).toBeNull();
    expect(result.paybackPeriod).toBeNull();
  });

  it('returns null IRR for all-positive cash flows', () => {
    const input: NPVIRRInput = {
      cashFlows: [100, 200, 300],
      discountRate: 0.05,
    };

    const result = NPVIRRCalculator.analyze(input);
    expect(result.irr).toBeNull();
  });
});
