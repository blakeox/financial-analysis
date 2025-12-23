import { describe, expect, it } from 'vitest';

import type { ESGScoreInput } from '../../../schemas/esg-score.js';
import { ESGScoringCalculator } from '../esg-score.js';

describe('ESGScoringCalculator', () => {
  it('computes weighted ESG score and rating', () => {
    const input: ESGScoreInput = {
      environmentalScore: 80,
      socialScore: 70,
      governanceScore: 60,
    };
    const result = ESGScoringCalculator.analyze(input);
    expect(result.score).toBeCloseTo(70, 10);
    expect(result.rating).toBe('A');
  });
});

