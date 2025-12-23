import { describe, expect, it } from 'vitest';

import type { CAPMInput } from '../../../schemas/capm.js';
import { CAPMCalculator } from '../capm.js';

describe('CAPMCalculator', () => {
  it('calculates expected return', () => {
    const input: CAPMInput = { riskFreeRate: 0.03, beta: 1.2, marketRiskPremium: 0.05 };
    const result = CAPMCalculator.analyze(input);
    expect(result.expectedReturn).toBeCloseTo(0.09, 10);
  });

  describe('Comprehensive Analysis', () => {
    it('returns all required fields in the result object', () => {
      const input: CAPMInput = { riskFreeRate: 0.03, beta: 1.2, marketRiskPremium: 0.05 };
      const result = CAPMCalculator.analyze(input);

      expect(result).toHaveProperty('expectedReturn');
      expect(result).toHaveProperty('riskFreeRate');
      expect(result).toHaveProperty('beta');
      expect(result).toHaveProperty('marketRiskPremium');

      expect(result.riskFreeRate).toBe(input.riskFreeRate);
      expect(result.beta).toBe(input.beta);
      expect(result.marketRiskPremium).toBe(input.marketRiskPremium);
    });
  });
});

