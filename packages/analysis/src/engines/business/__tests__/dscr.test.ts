import { describe, it, expect } from 'vitest';
import { DSCRCalculator } from '../dscr.js';
import type { DSCRInput } from '../../../schemas/dscr.js';

describe('DSCRCalculator', () => {
  const baseInput: DSCRInput = {
    ebitda: 500000,
    annualDebtService: 300000,
    existingDebtService: 300000,
    newLoanPayment: 5000, // Monthly
  };

  it('should calculate DSCR correctly', () => {
    const result = DSCRCalculator.analyze(baseInput) as any;
    expect(result.ratio).toBeDefined();
    expect(result.status).toBeDefined();
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = DSCRCalculator.analyze(baseInput) as any;

      expect(result).toHaveProperty('ratio');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('interpretation');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('targetRatio');
      expect(result).toHaveProperty('margin');
    });
  });
});
