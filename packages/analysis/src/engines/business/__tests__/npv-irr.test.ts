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
});

