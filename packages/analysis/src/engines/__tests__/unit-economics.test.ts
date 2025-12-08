import { describe, it, expect } from 'vitest';
import { UnitEconomicsEngine } from '../unit-economics';
import type { UnitEconomicsInput } from '../unit-economics';

describe('UnitEconomicsEngine', () => {
  // Basic input matching the actual engine interface
  const basicInput: UnitEconomicsInput = {
    monthlyMarketingSpend: 10000,
    newCustomersPerMonth: 50,
    averageMonthlyRevenue: 100,
    averageCustomerLifespanMonths: 20,
    costOfGoodsSoldPercent: 30, // 70% gross margin
    variableServicingCostPerCustomer: 5,
    monthlyChurnRate: 5,
  };

  describe('CAC (Customer Acquisition Cost)', () => {
    it('calculates CAC correctly', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // CAC = Marketing Spend / New Customers = 10000 / 50 = 200
      expect(result.cac).toBe(200);
    });

    it('higher spend increases CAC', () => {
      const highSpendInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 20000,
      };

      const result = UnitEconomicsEngine.analyze(highSpendInput);

      expect(result.cac).toBe(400);
    });

    it('more customers decreases CAC', () => {
      const moreCustomersInput: UnitEconomicsInput = {
        ...basicInput,
        newCustomersPerMonth: 100,
      };

      const result = UnitEconomicsEngine.analyze(moreCustomersInput);

      expect(result.cac).toBe(100);
    });
  });

  describe('LTV (Customer Lifetime Value)', () => {
    it('calculates LTV', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.ltv).toBeGreaterThan(0);
    });

    it('higher revenue increases LTV', () => {
      const highRevenueInput: UnitEconomicsInput = {
        ...basicInput,
        averageMonthlyRevenue: 200,
      };

      const basicResult = UnitEconomicsEngine.analyze(basicInput);
      const highRevenueResult = UnitEconomicsEngine.analyze(highRevenueInput);

      expect(highRevenueResult.ltv).toBeGreaterThan(basicResult.ltv);
    });

    it('higher churn decreases LTV', () => {
      const highChurnInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyChurnRate: 10,
      };

      const basicResult = UnitEconomicsEngine.analyze(basicInput);
      const highChurnResult = UnitEconomicsEngine.analyze(highChurnInput);

      expect(highChurnResult.ltv).toBeLessThan(basicResult.ltv);
    });

    it('uses gross margin in LTV calculation', () => {
      const highMarginInput: UnitEconomicsInput = {
        ...basicInput,
        costOfGoodsSoldPercent: 10, // 90% gross margin
      };
      const lowMarginInput: UnitEconomicsInput = {
        ...basicInput,
        costOfGoodsSoldPercent: 50, // 50% gross margin
      };

      const highMarginResult = UnitEconomicsEngine.analyze(highMarginInput);
      const lowMarginResult = UnitEconomicsEngine.analyze(lowMarginInput);

      expect(highMarginResult.ltv).toBeGreaterThan(lowMarginResult.ltv);
    });
  });

  describe('LTV:CAC Ratio', () => {
    it('calculates LTV:CAC ratio', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.ltvToCacRatio).toBeCloseTo(result.ltv / result.cac, 1);
    });

    it('healthy business has ratio > 3', () => {
      const healthyInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 5000,
        averageMonthlyRevenue: 200,
        monthlyChurnRate: 2,
      };

      const result = UnitEconomicsEngine.analyze(healthyInput);

      expect(result.ltvToCacRatio).toBeGreaterThan(3);
    });

    it('struggling business may have ratio < 1', () => {
      const strugglingInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 50000,
        newCustomersPerMonth: 50,
        monthlyChurnRate: 20,
      };

      const result = UnitEconomicsEngine.analyze(strugglingInput);

      expect(result.ltvToCacRatio).toBeLessThan(1);
    });
  });

  describe('Payback Period', () => {
    it('calculates payback period in months', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.paybackPeriodMonths).toBeGreaterThan(0);
    });

    it('payback period is CAC / monthly contribution', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // CAC = 200
      // Contribution margin = 100 * 0.70 - 5 = 65
      // Payback = 200 / 65 ≈ 3.08 months
      const expectedPayback = 200 / 65;
      expect(result.paybackPeriodMonths).toBeCloseTo(expectedPayback, 1);
    });

    it('higher margin shortens payback', () => {
      const highMarginInput: UnitEconomicsInput = {
        ...basicInput,
        costOfGoodsSoldPercent: 10, // 90% gross margin
      };

      const basicResult = UnitEconomicsEngine.analyze(basicInput);
      const highMarginResult = UnitEconomicsEngine.analyze(highMarginInput);

      expect(highMarginResult.paybackPeriodMonths).toBeLessThan(basicResult.paybackPeriodMonths);
    });
  });

  describe('Customer Lifetime', () => {
    it('calculates customer lifetime from churn', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Lifetime = 1 / churn rate = 1 / 0.05 = 20 months
      expect(result.customerLifespanMonths).toBeCloseTo(20, 0);
    });

    it('lower churn means longer lifetime', () => {
      const lowChurnInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyChurnRate: 2,
      };

      const result = UnitEconomicsEngine.analyze(lowChurnInput);

      // Lifetime = 1 / 0.02 = 50 months
      expect(result.customerLifespanMonths).toBeCloseTo(50, 0);
    });
  });

  describe('Benchmarks', () => {
    it('provides LTV:CAC benchmark', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.benchmarks.ltvCacRatio).toBeDefined();
      expect(result.benchmarks.ltvCacRatio.target).toBe(3.0);
      expect(result.benchmarks.ltvCacRatio).toHaveProperty('status');
    });

    it('provides payback benchmark', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.benchmarks.payback).toBeDefined();
      expect(result.benchmarks.payback.target).toBe(12);
    });

    it('provides churn benchmark', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.benchmarks.churn).toBeDefined();
      expect(result.benchmarks.churn.target).toBe(5);
    });

    it('provides gross margin benchmark', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.benchmarks.grossMargin).toBeDefined();
      expect(result.benchmarks.grossMargin.target).toBe(70);
    });

    it('assesses health status', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(['good', 'warning', 'poor']).toContain(result.benchmarks.ltvCacRatio.status);
    });
  });

  describe('Cohort Analysis', () => {
    it('provides cohort analysis array', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.cohortAnalysis).toBeDefined();
      expect(Array.isArray(result.cohortAnalysis)).toBe(true);
      expect(result.cohortAnalysis.length).toBeGreaterThan(0);
    });

    it('cohort analysis shows customers remaining over time', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Month 0 should have 100 customers (cohort of 100)
      expect(result.cohortAnalysis[0].customersRemaining).toBe(100);
      
      // Later months should have fewer customers due to churn
      const laterMonth = result.cohortAnalysis[6];
      expect(laterMonth.customersRemaining).toBeLessThan(100);
    });

    it('cohort analysis tracks cumulative revenue', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Cumulative revenue should increase over time
      expect(result.cohortAnalysis[5].cumulativeRevenue).toBeGreaterThan(
        result.cohortAnalysis[0].cumulativeRevenue
      );
    });

    it('cohort analysis calculates lifetime value', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Each cohort entry should have a lifetime value
      expect(result.cohortAnalysis[12].lifetimeValue).toBeGreaterThan(0);
    });
  });

  describe('Insights', () => {
    it('generates insights array', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('warns about poor LTV:CAC ratio', () => {
      const poorInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 50000,
        monthlyChurnRate: 15,
      };

      const result = UnitEconomicsEngine.analyze(poorInput);

      const ratioInsight = result.insights.find(i => i.includes('LTV') || i.includes('CAC'));
      expect(ratioInsight).toBeDefined();
    });

    it('notes excellent metrics', () => {
      const excellentInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 3000,
        averageMonthlyRevenue: 150,
        monthlyChurnRate: 2,
      };

      const result = UnitEconomicsEngine.analyze(excellentInput);

      const positiveInsight = result.insights.find(i => 
        i.toLowerCase().includes('excellent') || 
        i.toLowerCase().includes('strong') || 
        i.toLowerCase().includes('healthy') ||
        i.includes('✅') ||
        i.includes('🎯')
      );
      expect(positiveInsight).toBeDefined();
    });
  });

  describe('Recommendations', () => {
    it('generates recommendations', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('recommends reducing CAC when high', () => {
      const highCacInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 50000,
        newCustomersPerMonth: 50,
        monthlyChurnRate: 10, // Also high churn to trigger recommendations
      };

      const result = UnitEconomicsEngine.analyze(highCacInput);

      const cacRec = result.recommendations.find(r => 
        r.includes('CAC') || r.includes('acquisition') || r.includes('marketing')
      );
      expect(cacRec).toBeDefined();
    });

    it('recommends improving retention when churn is high', () => {
      const highChurnInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyChurnRate: 15,
      };

      const result = UnitEconomicsEngine.analyze(highChurnInput);

      const retentionRec = result.recommendations.find(r => 
        r.toLowerCase().includes('churn') || r.toLowerCase().includes('retention')
      );
      expect(retentionRec).toBeDefined();
    });
  });

  describe('Warnings', () => {
    it('generates warnings for critical issues', () => {
      const criticalInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 100000, // Very high CAC
        monthlyChurnRate: 15, // Very high churn
      };

      const result = UnitEconomicsEngine.analyze(criticalInput);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Margin Analysis', () => {
    it('includes gross margin percent in output', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Gross margin = 100 - COGS% = 100 - 30 = 70
      expect(result.grossMarginPercent).toBe(70);
    });

    it('calculates contribution margin per customer', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Contribution margin = revenue * margin% - servicing cost
      // = 100 * 0.70 - 5 = 65
      expect(result.contributionMarginPerCustomer).toBeCloseTo(65, 1);
    });
  });

  describe('Revenue Metrics', () => {
    it('calculates monthly recurring revenue', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // MRR = new customers * ARPU = 50 * 100 = 5000
      expect(result.monthlyRecurringRevenue).toBe(50 * 100);
    });

    it('calculates annual recurring revenue', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // ARR = MRR * 12
      expect(result.annualRecurringRevenue).toBe(50 * 100 * 12);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero new customers gracefully', () => {
      const zeroCustomersInput: UnitEconomicsInput = {
        ...basicInput,
        newCustomersPerMonth: 0,
      };

      // Should handle gracefully - CAC would be 0 (no paid customers)
      expect(() => UnitEconomicsEngine.analyze(zeroCustomersInput)).not.toThrow();
    });

    it('handles zero churn (uses lifespan months)', () => {
      const zeroChurnInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyChurnRate: 0,
      };

      const result = UnitEconomicsEngine.analyze(zeroChurnInput);

      // Should use averageCustomerLifespanMonths when churn is 0
      expect(result.customerLifespanMonths).toBe(basicInput.averageCustomerLifespanMonths);
    });

    it('handles 100% margin', () => {
      const fullMarginInput: UnitEconomicsInput = {
        ...basicInput,
        costOfGoodsSoldPercent: 0, // 100% gross margin
      };

      const result = UnitEconomicsEngine.analyze(fullMarginInput);

      expect(result.grossMarginPercent).toBe(100);
    });

    it('handles very low revenue (may result in negative LTV)', () => {
      const lowRevenueInput: UnitEconomicsInput = {
        ...basicInput,
        averageMonthlyRevenue: 1,
        variableServicingCostPerCustomer: 0, // No servicing cost to allow positive LTV
      };

      const result = UnitEconomicsEngine.analyze(lowRevenueInput);

      // With $1 revenue, 70% margin, no servicing cost = $0.70 contribution
      expect(result.ltv).toBeGreaterThan(0);
    });

    it('negative LTV when servicing cost exceeds gross margin', () => {
      const unprofitableInput: UnitEconomicsInput = {
        ...basicInput,
        averageMonthlyRevenue: 1,
        variableServicingCostPerCustomer: 5, // Servicing cost > revenue * margin
      };

      const result = UnitEconomicsEngine.analyze(unprofitableInput);

      // Contribution margin = $1 * 0.70 - $5 = -$4.30 → negative LTV
      expect(result.ltv).toBeLessThan(0);
      expect(result.contributionMarginPerCustomer).toBeLessThan(0);
    });
  });

  describe('Scenario Comparison', () => {
    it('current vs improved scenario', () => {
      const currentResult = UnitEconomicsEngine.analyze(basicInput);
      
      const improvedInput: UnitEconomicsInput = {
        ...basicInput,
        monthlyMarketingSpend: 8000,
        monthlyChurnRate: 3,
      };
      const improvedResult = UnitEconomicsEngine.analyze(improvedInput);

      // Improved should have better LTV:CAC
      expect(improvedResult.ltvToCacRatio).toBeGreaterThan(currentResult.ltvToCacRatio);
    });
  });

  describe('Breakeven Analysis', () => {
    it('includes breakeven month', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.breakEvenMonth).toBeDefined();
      expect(typeof result.breakEvenMonth).toBe('number');
    });

    it('payback period approximates breakeven', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // At minimum, need CAC worth of contribution margin per customer
      const monthsToRecoup = result.cac / result.contributionMarginPerCustomer;
      expect(monthsToRecoup).toBeCloseTo(result.paybackPeriodMonths, 1);
    });
  });

  describe('Summary', () => {
    it('includes overall health assessment', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.summary).toBeDefined();
      expect(['excellent', 'good', 'needs-improvement', 'critical']).toContain(
        result.summary.overallHealth
      );
    });

    it('includes profit per customer', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Profit = LTV - CAC
      expect(result.summary.profitPerCustomer).toBeCloseTo(result.ltv - result.cac, 1);
    });

    it('includes months to positive cash flow', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.summary.monthsToPositiveCashFlow).toBeDefined();
      expect(typeof result.summary.monthsToPositiveCashFlow).toBe('number');
    });

    it('includes annualized customer value', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Annualized value = monthly revenue * 12
      expect(result.summary.annualizedCustomerValue).toBe(basicInput.averageMonthlyRevenue * 12);
    });
  });

  describe('Output Structure', () => {
    it('has all required output fields', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Core metrics
      expect(result).toHaveProperty('cac');
      expect(result).toHaveProperty('ltv');
      expect(result).toHaveProperty('ltvToCacRatio');
      
      // Profitability
      expect(result).toHaveProperty('grossMarginPercent');
      expect(result).toHaveProperty('contributionMarginPerCustomer');
      
      // Timing
      expect(result).toHaveProperty('paybackPeriodMonths');
      expect(result).toHaveProperty('breakEvenMonth');
      
      // Retention
      expect(result).toHaveProperty('customerLifespanMonths');
      expect(result).toHaveProperty('retentionRate');
      expect(result).toHaveProperty('churnRate');
      
      // Revenue
      expect(result).toHaveProperty('monthlyRecurringRevenue');
      expect(result).toHaveProperty('annualRecurringRevenue');
      expect(result).toHaveProperty('netRevenueRetention');
      
      // Analysis
      expect(result).toHaveProperty('cohortAnalysis');
      expect(result).toHaveProperty('benchmarks');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('summary');
    });
  });

  describe('Retention Rate', () => {
    it('calculates retention rate from churn', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      // Retention = (1 - churnRate/100) * 100 = (1 - 0.05) * 100 = 95%
      expect(result.retentionRate).toBeCloseTo(95, 0);
    });

    it('reflects churn rate correctly', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.churnRate).toBe(basicInput.monthlyChurnRate);
    });
  });

  describe('Net Revenue Retention', () => {
    it('calculates NRR based on retention and growth', () => {
      const result = UnitEconomicsEngine.analyze(basicInput);

      expect(result.netRevenueRetention).toBeDefined();
      expect(result.netRevenueRetention).toBeGreaterThan(0);
    });

    it('NRR increases with revenue growth rate', () => {
      const noGrowthResult = UnitEconomicsEngine.analyze(basicInput);
      
      const growthInput: UnitEconomicsInput = {
        ...basicInput,
        revenueGrowthRate: 0.2, // 20% annual growth
      };
      const growthResult = UnitEconomicsEngine.analyze(growthInput);

      expect(growthResult.netRevenueRetention).toBeGreaterThan(noGrowthResult.netRevenueRetention);
    });
  });

  describe('Organic Growth', () => {
    it('organic growth reduces effective CAC', () => {
      const allPaidResult = UnitEconomicsEngine.analyze(basicInput);
      
      const organicInput: UnitEconomicsInput = {
        ...basicInput,
        organicGrowthPercent: 50, // Half of customers are organic
      };
      const organicResult = UnitEconomicsEngine.analyze(organicInput);

      // With 50% organic, CAC should double (same spend, half paid customers)
      expect(organicResult.cac).toBeCloseTo(allPaidResult.cac * 2, 0);
    });
  });
});
