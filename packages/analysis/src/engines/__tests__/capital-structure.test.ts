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

  it('should fall back to rating-based cost of debt when interest expense is zero', () => {
    const result = CapitalStructureOptimizer.analyze({
      ...baseInput,
      financials: {
        ...baseInput.financials,
        annualInterestExpense: 0,
      },
      marketData: {
        ...baseInput.marketData,
        creditRating: 'BB',
      },
    });

    expect(result.wacc.costOfDebt).toBeCloseTo(0.07, 4);
    expect(result.wacc.wacc).toBeGreaterThan(0);
  });

  it('should expose dividend policy recommendations when enabled', () => {
    const result = CapitalStructureOptimizer.analyze({
      ...baseInput,
      analysis: {
        includeWACCOptimization: false,
        includeDebtCapacity: false,
        includeCreditRatingImpact: false,
        includeDividendPolicy: true,
      },
    }) as any;

    expect(result.dividendPolicy).toBeDefined();
    expect(result.dividendPolicy.recommendations.length).toBeGreaterThan(0);
  });

  it('should mark high leverage as BB and note downgrade risk', () => {
    const result = CapitalStructureOptimizer.analyze({
      ...baseInput,
      companyInfo: {
        ...baseInput.companyInfo,
        currentDebt: 2000000000,
        marketCap: 1000000000,
      },
      analysis: {
        includeWACCOptimization: true,
        includeDebtCapacity: false,
        includeCreditRatingImpact: true,
        includeDividendPolicy: false,
      },
    }) as any;

    expect(result.creditRatingImpact.projectedRating).toBe('BB');
    expect(result.creditRatingImpact.ratingFactors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factor: 'High Debt-to-Equity',
        }),
      ])
    );
    expect(result.optimalStructure.reasoning).toContain('credit rating');
  });

  it('should omit optional analyses when disabled', () => {
    const result = CapitalStructureOptimizer.analyze({
      ...baseInput,
      analysis: {
        includeWACCOptimization: false,
        includeDebtCapacity: false,
        includeCreditRatingImpact: false,
        includeDividendPolicy: false,
      },
    }) as any;

    expect(result.waccOptimization).toBeUndefined();
    expect(result.debtCapacity).toBeUndefined();
    expect(result.creditRatingImpact).toBeUndefined();
    expect(result.dividendPolicy).toBeUndefined();
    expect(result.optimalStructure).toBeDefined();
  });

  it('should handle zero equity without crashing', () => {
    const result = CapitalStructureOptimizer.analyze({
      ...baseInput,
      companyInfo: {
        ...baseInput.companyInfo,
        marketCap: 0,
        currentDebt: 100000000,
      },
      analysis: {
        includeWACCOptimization: false,
        includeDebtCapacity: true,
        includeCreditRatingImpact: true,
        includeDividendPolicy: false,
      },
    }) as any;

    expect(result.currentStructure.debtToEquity).toBe(999);
    expect(result.debtCapacity).toBeDefined();
  });
});
