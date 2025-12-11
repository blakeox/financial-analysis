/**
 * Capital Structure Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { CapitalStructureInput } from '../../schemas/capital-structure.js';
import { CapitalStructureOptimizer } from '../capital-structure.js';

describe('CapitalStructureOptimizer', () => {
  const baseInput: CapitalStructureInput = {
    companyInfo: {
      marketCap: 1000000000,
      currentDebt: 200000000,
      cashAndEquivalents: 50000000,
      sharesOutstanding: 10000000,
      stockPrice: 100,
    },
    financials: {
      annualEBITDA: 150000000,
      annualEBIT: 120000000,
      netIncome: 80000000,
      taxRate: 0.25,
      annualInterestExpense: 10000000,
    },
    marketData: {
      riskFreeRate: 0.03,
      marketRiskPremium: 0.06,
      beta: 1.2,
      creditRating: 'BBB',
    },
    analysis: {
      includeWACCOptimization: true,
      includeDebtCapacity: true,
      includeCreditRatingImpact: true,
      includeDividendPolicy: false,
    },
  };

  it('should calculate current capital structure', () => {
    const result = CapitalStructureOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.currentStructure).toBeDefined();
    expect(result.currentStructure.debtToEquity).toBeGreaterThan(0);
  });

  it('should calculate WACC', () => {
    const result = CapitalStructureOptimizer.analyze(baseInput);
    expect(result.wacc).toBeDefined();
    expect(result.wacc.wacc).toBeGreaterThan(0);
    expect(result.wacc.wacc).toBeLessThan(1);
  });

  it('should optimize WACC when requested', () => {
    const result = CapitalStructureOptimizer.analyze(baseInput);
    expect(result.waccOptimization).toBeDefined();
    expect(result.waccOptimization?.optimalWACC).toBeGreaterThan(0);
    expect(result.waccOptimization?.optimalDebtToEquity).toBeGreaterThanOrEqual(0);
  });

  it('should analyze debt capacity', () => {
    const result = CapitalStructureOptimizer.analyze(baseInput);
    expect(result.debtCapacity).toBeDefined();
    expect(result.debtCapacity?.maxDebt).toBeGreaterThan(0);
  });

  it('should assess credit rating impact', () => {
    const result = CapitalStructureOptimizer.analyze(baseInput);
    expect(result.creditRatingImpact).toBeDefined();
    expect(result.creditRatingImpact?.projectedRating).toBeDefined();
  });
});
