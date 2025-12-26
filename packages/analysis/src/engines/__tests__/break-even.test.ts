import { describe, expect, it } from 'vitest';

import type { BreakEvenInput } from '../../schemas/break-even.js';
import { BreakEvenAnalyzer } from '../break-even.js';

describe('BreakEvenAnalyzer', () => {
  it('calculates break-even units and revenue', () => {
    const input: BreakEvenInput = {
      fixedCosts: 1000,
      variableCostPerUnit: 5,
      pricePerUnit: 10,
      targetProfit: 0,
    };
    const result = BreakEvenAnalyzer.analyze(input);
    expect(result.breakEvenPossible).toBe(true);
    expect(result.breakEvenUnits).toBeCloseTo(200, 10);
    expect(result.breakEvenRevenue).toBeCloseTo(2000, 10);
  });

  it('detects impossible break-even when margin is non-positive', () => {
    const input: BreakEvenInput = {
      fixedCosts: 1000,
      variableCostPerUnit: 10,
      pricePerUnit: 10,
      targetProfit: 0,
    };
    const result = BreakEvenAnalyzer.analyze(input);
    expect(result.breakEvenPossible).toBe(false);
    expect(result.breakEvenUnits).toBeNull();
  });
});

