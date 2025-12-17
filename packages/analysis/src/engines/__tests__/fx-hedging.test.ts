import { describe, expect, it } from 'vitest';

import type { FXHedgingInput } from '../../schemas/fx-hedging.js';
import { FXHedgingAnalyzer } from '../fx-hedging.js';

describe('FXHedgingAnalyzer', () => {
  it('computes forward rate and hedged/unhedged returns', () => {
    const input: FXHedgingInput = {
      spotRate: 1.2,
      domesticRate: 0.05,
      foreignRate: 0.02,
      tenorYears: 1,
      expectedSpotRateAtMaturity: 1.3,
      foreignAssetReturn: 0.1,
    };

    const result = FXHedgingAnalyzer.analyze(input);
    expect(result.forwardRate).toBeCloseTo(1.235294, 5);
    expect(result.hedgedReturn).toBeCloseTo(0.132352, 5);
    expect(result.unhedgedReturn).toBeCloseTo(0.191667, 5);
  });
});

