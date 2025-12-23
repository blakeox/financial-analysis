import { describe, expect, it } from 'vitest';

import type { CarbonCreditValuationInput } from '../../../schemas/carbon-credit.js';
import { CarbonCreditValuationCalculator } from '../carbon-credit.js';

describe('CarbonCreditValuationCalculator', () => {
  it('values future carbon credit sale with growth and discounting', () => {
    const input: CarbonCreditValuationInput = {
      tonnesCO2e: 100,
      pricePerTonne: 20,
      yearsUntilSale: 2,
      priceGrowthRate: 0.1,
      discountRate: 0.05,
    };

    const result = CarbonCreditValuationCalculator.analyze(input);
    expect(result.spotValue).toBeCloseTo(2000, 10);
    expect(result.futurePricePerTonne).toBeCloseTo(24.2, 10);
    expect(result.futureValue).toBeCloseTo(2420, 10);
    expect(result.presentValue).toBeCloseTo(2195, 0);
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const input: CarbonCreditValuationInput = {
        tonnesCO2e: 100,
        pricePerTonne: 20,
        yearsUntilSale: 2,
        priceGrowthRate: 0.1,
        discountRate: 0.05,
      };
      const result = CarbonCreditValuationCalculator.analyze(input);

      expect(result).toHaveProperty('tonnesCO2e');
      expect(result).toHaveProperty('pricePerTonne');
      expect(result).toHaveProperty('yearsUntilSale');
      expect(result).toHaveProperty('futurePricePerTonne');
      expect(result).toHaveProperty('spotValue');
      expect(result).toHaveProperty('futureValue');
      expect(result).toHaveProperty('presentValue');
      expect(result).toHaveProperty('discountRate');
      expect(result).toHaveProperty('priceGrowthRate');
    });
  });
});

