import { describe, expect, it } from 'vitest';

import type { P2PLendingInput } from '../../schemas/p2p-lending.js';
import { P2PLendingAnalyzer } from '../p2p-lending.js';

describe('P2PLendingAnalyzer', () => {
  it('estimates expected return with defaults and recovery', () => {
    const input: P2PLendingInput = {
      principal: 1000,
      annualInterestRate: 0.12,
      termYears: 1,
      feeRate: 0.01,
      defaultProbability: 0.1,
      recoveryRate: 0.2,
    };

    const result = P2PLendingAnalyzer.analyze(input);
    expect(result.expectedLoss).toBeCloseTo(80, 10);
    expect(result.expectedInterest).toBeCloseTo(108, 10);
    expect(result.expectedEndingValue).toBeCloseTo(1026.92, 2);
    expect(result.expectedTotalReturn).toBeCloseTo(0.02692, 5);
  });

  it('returns null annualized return for zero-term loans', () => {
    const input: P2PLendingInput = {
      principal: 1000,
      annualInterestRate: 0.12,
      termYears: 0,
      feeRate: 0.01,
      defaultProbability: 0.1,
      recoveryRate: 0.2,
    };

    const result = P2PLendingAnalyzer.analyze(input);
    expect(result.expectedAnnualizedReturn).toBeNull();
  });
});

