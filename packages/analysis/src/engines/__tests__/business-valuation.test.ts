import { describe, it, expect } from 'vitest';
import { BusinessValuationEngine } from '../business-valuation';
import type { BusinessValuationInput } from '../business-valuation';

describe('BusinessValuationEngine', () => {
  const basicInput: BusinessValuationInput = {
    industry: 'saas',
    businessAge: 5,
    annualRevenue: 1000000,
    annualEbitda: 200000,
    annualNetIncome: 150000,
    totalAssets: 500000,
    totalLiabilities: 200000,
    revenueGrowthRate: 15,
  };

  describe('basic valuation', () => {
    it('calculates valuation range', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.valuationLow).toBeGreaterThan(0);
      expect(result.valuationMid).toBeGreaterThan(result.valuationLow);
      expect(result.valuationHigh).toBeGreaterThan(result.valuationMid);
    });

    it('mid valuation is between low and high', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.valuationMid).toBeGreaterThan(result.valuationLow);
      expect(result.valuationMid).toBeLessThan(result.valuationHigh);
    });

    it('uses multiple valuation methods', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.methods.length).toBeGreaterThan(1);
    });
  });

  describe('valuation methods', () => {
    it('includes EBITDA multiple method', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      const ebitdaMethod = result.methods.find((m) => m.name === 'EBITDA Multiple');
      expect(ebitdaMethod).toBeDefined();
      expect(ebitdaMethod!.value).toBeGreaterThan(0);
    });

    it('includes revenue multiple method', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      const revenueMethod = result.methods.find((m) => m.name === 'Revenue Multiple');
      expect(revenueMethod).toBeDefined();
      expect(revenueMethod!.value).toBeGreaterThan(0);
    });

    it('includes SDE multiple for small businesses', () => {
      const smallBusiness: BusinessValuationInput = {
        ...basicInput,
        annualRevenue: 500000,
        businessAge: 3,
      };

      const result = BusinessValuationEngine.analyze(smallBusiness);

      const sdeMethod = result.methods.find((m) => m.name === 'SDE Multiple');
      expect(sdeMethod).toBeDefined();
    });

    it('includes asset-based method when book value is positive', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      const assetMethod = result.methods.find((m) => m.name === 'Asset-Based');
      expect(assetMethod).toBeDefined();
    });

    it('methods have weights', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      result.methods.forEach((method) => {
        expect(method.weight).toBeGreaterThan(0);
        expect(method.weight).toBeLessThanOrEqual(1);
      });
    });

    it('methods have confidence levels', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      result.methods.forEach((method) => {
        expect(['high', 'medium', 'low']).toContain(method.confidence);
      });
    });
  });

  describe('industry multiples', () => {
    it('SaaS businesses get higher multiples', () => {
      const saasResult = BusinessValuationEngine.analyze({ ...basicInput, industry: 'saas' });
      const retailResult = BusinessValuationEngine.analyze({ ...basicInput, industry: 'retail' });

      expect(saasResult.valuationMid).toBeGreaterThan(retailResult.valuationMid);
    });

    it('technology businesses get reasonable multiples', () => {
      const techInput: BusinessValuationInput = {
        ...basicInput,
        industry: 'technology',
      };

      const result = BusinessValuationEngine.analyze(techInput);

      expect(result.valuationMid).toBeGreaterThan(basicInput.annualEbitda * 3);
    });

    it('handles unknown industry gracefully', () => {
      const unknownInput: BusinessValuationInput = {
        ...basicInput,
        industry: 'unknown-industry',
      };

      const result = BusinessValuationEngine.analyze(unknownInput);

      expect(result.valuationMid).toBeGreaterThan(0);
    });
  });

  describe('adjustments', () => {
    it('high growth rate adds positive adjustment', () => {
      const highGrowthInput: BusinessValuationInput = {
        ...basicInput,
        revenueGrowthRate: 25,
      };

      const result = BusinessValuationEngine.analyze(highGrowthInput);

      const growthAdj = result.adjustments.find((a) => a.name.includes('Growth'));
      expect(growthAdj).toBeDefined();
      expect(growthAdj!.impact).toBe('positive');
    });

    it('revenue decline adds negative adjustment', () => {
      const decliningInput: BusinessValuationInput = {
        ...basicInput,
        revenueGrowthRate: -10,
      };

      const result = BusinessValuationEngine.analyze(decliningInput);

      const declineAdj = result.adjustments.find((a) => a.name.includes('Decline'));
      expect(declineAdj).toBeDefined();
      expect(declineAdj!.impact).toBe('negative');
    });

    it('high customer concentration adds negative adjustment', () => {
      const concentratedInput: BusinessValuationInput = {
        ...basicInput,
        customerConcentration: 40,
      };

      const result = BusinessValuationEngine.analyze(concentratedInput);

      const concAdj = result.adjustments.find((a) => a.name.includes('Concentration'));
      expect(concAdj).toBeDefined();
      expect(concAdj!.impact).toBe('negative');
    });

    it('high owner dependency reduces value', () => {
      const dependentInput: BusinessValuationInput = {
        ...basicInput,
        ownerDependency: 'high',
      };

      const result = BusinessValuationEngine.analyze(dependentInput);

      const ownerAdj = result.adjustments.find((a) => a.name.includes('Owner Dependency'));
      expect(ownerAdj).toBeDefined();
      expect(ownerAdj!.impact).toBe('negative');
    });

    it('recurring revenue adds positive adjustment', () => {
      const recurringInput: BusinessValuationInput = {
        ...basicInput,
        hasRecurringRevenue: true,
      };

      const result = BusinessValuationEngine.analyze(recurringInput);

      const recurringAdj = result.adjustments.find((a) => a.name.includes('Recurring'));
      expect(recurringAdj).toBeDefined();
      expect(recurringAdj!.impact).toBe('positive');
    });

    it('documented processes add positive adjustment', () => {
      const documentedInput: BusinessValuationInput = {
        ...basicInput,
        hasDocumentedProcesses: true,
      };

      const result = BusinessValuationEngine.analyze(documentedInput);

      const docAdj = result.adjustments.find((a) => a.name.includes('Documented'));
      expect(docAdj).toBeDefined();
      expect(docAdj!.impact).toBe('positive');
    });

    it('established business gets positive adjustment', () => {
      const establishedInput: BusinessValuationInput = {
        ...basicInput,
        businessAge: 15,
      };

      const result = BusinessValuationEngine.analyze(establishedInput);

      const ageAdj = result.adjustments.find((a) => a.name.includes('Established'));
      expect(ageAdj).toBeDefined();
      expect(ageAdj!.impact).toBe('positive');
    });

    it('early stage business gets negative adjustment', () => {
      const earlyInput: BusinessValuationInput = {
        ...basicInput,
        businessAge: 1,
      };

      const result = BusinessValuationEngine.analyze(earlyInput);

      const earlyAdj = result.adjustments.find((a) => a.name.includes('Early'));
      expect(earlyAdj).toBeDefined();
      expect(earlyAdj!.impact).toBe('negative');
    });
  });

  describe('book value', () => {
    it('calculates book value correctly', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.bookValue).toBe(basicInput.totalAssets - basicInput.totalLiabilities);
    });

    it('calculates adjusted book value', () => {
      const inputWithAssets: BusinessValuationInput = {
        ...basicInput,
        inventoryValue: 50000,
        equipmentValue: 100000,
      };

      const result = BusinessValuationEngine.analyze(inputWithAssets);

      // Adjusted book value should be different from raw book value
      expect(result.adjustedBookValue).toBeDefined();
    });
  });

  describe('per-unit metrics', () => {
    it('calculates value per dollar of revenue', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.valuePerDollarRevenue).toBeCloseTo(
        result.valuationMid / basicInput.annualRevenue,
        2
      );
    });

    it('calculates value per customer when provided', () => {
      const inputWithCustomers: BusinessValuationInput = {
        ...basicInput,
        customerCount: 500,
      };

      const result = BusinessValuationEngine.analyze(inputWithCustomers);

      expect(result.valuePerCustomer).toBeDefined();
      expect(result.valuePerCustomer).toBeCloseTo(result.valuationMid / 500, 0);
    });
  });

  describe('summary', () => {
    it('provides recommended value', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.summary.recommendedValue).toBe(result.valuationMid);
    });

    it('provides valuation range string', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.summary.valuationRange).toContain('$');
      expect(result.summary.valuationRange).toContain(' - ');
    });

    it('assesses confidence level', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(['high', 'medium', 'low']).toContain(result.summary.confidenceLevel);
    });

    it('identifies most relevant method', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.summary.mostRelevantMethod).toBeDefined();
    });
  });

  describe('insights', () => {
    it('generates insights', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('recommendations', () => {
    it('generates recommendations', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('provides margin improvement recommendations for low margin', () => {
      const lowMarginInput: BusinessValuationInput = {
        ...basicInput,
        annualEbitda: 50000, // Low margin
      };

      const result = BusinessValuationEngine.analyze(lowMarginInput);

      const marginRec = result.recommendations.find(
        (r) => r.includes('margin') || r.includes('Margin')
      );
      expect(marginRec).toBeDefined();
    });
  });

  describe('warnings', () => {
    it('generates warnings', () => {
      const result = BusinessValuationEngine.analyze(basicInput);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('warns about negative EBITDA', () => {
      const negativeEbitdaInput: BusinessValuationInput = {
        ...basicInput,
        annualEbitda: -50000,
      };

      const result = BusinessValuationEngine.analyze(negativeEbitdaInput);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('warns about very new business', () => {
      const newBusinessInput: BusinessValuationInput = {
        ...basicInput,
        businessAge: 0.5,
      };

      const result = BusinessValuationEngine.analyze(newBusinessInput);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('warns about negative book value', () => {
      const negativeBookInput: BusinessValuationInput = {
        ...basicInput,
        totalAssets: 100000,
        totalLiabilities: 200000,
      };

      const result = BusinessValuationEngine.analyze(negativeBookInput);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('warns about extreme customer concentration', () => {
      const extremeConcentration: BusinessValuationInput = {
        ...basicInput,
        customerConcentration: 60,
      };

      const result = BusinessValuationEngine.analyze(extremeConcentration);

      const criticalWarning = result.warnings.find(
        (w) => w.includes('CRITICAL') || w.includes('60')
      );
      expect(criticalWarning).toBeDefined();
    });
  });

  describe('confidence assessment', () => {
    it('high confidence for established profitable business', () => {
      const solidInput: BusinessValuationInput = {
        ...basicInput,
        businessAge: 10,
        annualEbitda: 300000,
      };

      const result = BusinessValuationEngine.analyze(solidInput);

      expect(['high', 'medium']).toContain(result.summary.confidenceLevel);
    });

    it('lower confidence for early stage business', () => {
      const earlyInput: BusinessValuationInput = {
        ...basicInput,
        businessAge: 1,
        annualEbitda: 10000,
      };

      const result = BusinessValuationEngine.analyze(earlyInput);

      expect(['medium', 'low']).toContain(result.summary.confidenceLevel);
    });
  });
});
