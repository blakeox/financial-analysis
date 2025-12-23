import { Decimal } from 'decimal.js';

import type { ESGScoreInput } from '../../schemas/esg-score.js';

export interface ESGScoreResult {
  score: number;
  rating: string;
  components: {
    environmental: number;
    social: number;
    governance: number;
  };
  weights: {
    environmental: number;
    social: number;
    governance: number;
  };
}

function ratingFromScore(score: number): string {
  if (score >= 85) return 'AAA';
  if (score >= 75) return 'AA';
  if (score >= 65) return 'A';
  if (score >= 55) return 'BBB';
  if (score >= 45) return 'BB';
  if (score >= 35) return 'B';
  return 'CCC';
}

export class ESGScoringCalculator {
  static analyze(input: ESGScoreInput): ESGScoreResult {
    const weights = input.weights ?? { environmental: 1, social: 1, governance: 1 };
    const weightSum = weights.environmental + weights.social + weights.governance;
    const normalized = weightSum > 0
      ? {
          environmental: weights.environmental / weightSum,
          social: weights.social / weightSum,
          governance: weights.governance / weightSum,
        }
      : { environmental: 1 / 3, social: 1 / 3, governance: 1 / 3 };

    const score = new Decimal(input.environmentalScore)
      .times(normalized.environmental)
      .plus(new Decimal(input.socialScore).times(normalized.social))
      .plus(new Decimal(input.governanceScore).times(normalized.governance))
      .toNumber();

    return {
      score,
      rating: ratingFromScore(score),
      components: {
        environmental: input.environmentalScore,
        social: input.socialScore,
        governance: input.governanceScore,
      },
      weights: normalized,
    };
  }
}

