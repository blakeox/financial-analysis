import { describe, expect, it } from 'vitest';

import type { CarbonCreditValuationInput } from '../../schemas/carbon-credit.js';
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
});

