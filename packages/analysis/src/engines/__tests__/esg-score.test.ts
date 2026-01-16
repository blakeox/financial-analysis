import { describe, expect, it } from 'vitest';

import type { ESGScoreInput } from '../../schemas/esg-score.js';
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

  it('normalizes custom weights and returns component weights', () => {
    const input: ESGScoreInput = {
      environmentalScore: 90,
      socialScore: 60,
      governanceScore: 30,
      weights: {
        environmental: 2,
        social: 1,
        governance: 1,
      },
    };

    const result = ESGScoringCalculator.analyze(input);
    expect(result.weights).toEqual({
      environmental: 0.5,
      social: 0.25,
      governance: 0.25,
    });
    expect(result.score).toBeCloseTo(67.5, 10);
    expect(result.rating).toBe('A');
  });

  it('uses equal weights when provided weights sum to zero', () => {
    const input: ESGScoreInput = {
      environmentalScore: 90,
      socialScore: 60,
      governanceScore: 30,
      weights: {
        environmental: 0,
        social: 0,
        governance: 0,
      },
    };

    const result = ESGScoringCalculator.analyze(input);
    expect(result.weights).toEqual({
      environmental: 1 / 3,
      social: 1 / 3,
      governance: 1 / 3,
    });
    expect(result.score).toBeCloseTo(60, 10);
    expect(result.rating).toBe('BBB');
  });

  it.each([
    { score: 90, rating: 'AAA' },
    { score: 80, rating: 'AA' },
    { score: 70, rating: 'A' },
    { score: 60, rating: 'BBB' },
    { score: 50, rating: 'BB' },
    { score: 40, rating: 'B' },
    { score: 20, rating: 'CCC' },
  ])('assigns rating $rating for score $score', ({ score, rating }) => {
    const input: ESGScoreInput = {
      environmentalScore: score,
      socialScore: score,
      governanceScore: score,
    };

    const result = ESGScoringCalculator.analyze(input);
    expect(result.rating).toBe(rating);
  });
});

