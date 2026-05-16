import { describe, expect, it } from 'vitest';
import { CashFlowAnalyzer } from '../cash-flow.js';
import { CashFlowAnalysisInputSchema } from '../../schemas/cash-flow.js';

describe('CashFlowAnalyzer liquidity and risk scenarios', () => {
  describe('liquidity levels', () => {
    it('assesses Good liquidity (6-12 months coverage)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 200000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Good');
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeGreaterThan(6);
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeLessThanOrEqual(12);
    });

    it('assesses Adequate liquidity (3-6 months coverage)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Adequate');
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeGreaterThan(3);
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeLessThanOrEqual(6);
    });

    it('assesses Poor liquidity (1-3 months coverage)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 50000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Poor');
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeGreaterThan(1);
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeLessThanOrEqual(3);
    });

    it('assesses Critical liquidity (<1 month coverage)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 20000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Critical');
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeLessThanOrEqual(1);
    });

    it('assesses Excellent liquidity (>12 months coverage)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 500000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Excellent');
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeGreaterThan(12);
    });
  });

  describe('risk levels', () => {
    it('detects high liquidity risk with critical liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 15000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'High Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.riskAssessment.liquidityRisk).toBe('High');
      expect(result.riskAssessment.riskFactors).toContain('Insufficient cash reserves');
      expect(result.riskAssessment.mitigationStrategies).toContain('Build cash reserves');
    });

    it('detects medium liquidity risk with adequate liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.riskAssessment.liquidityRisk).toBe('Medium');
    });

    it('detects high operating risk with volatile cash flows', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 500000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        includeSeasonality: true,
        seasonalityFactors: [0.1, 0.1, 0.1, 0.1, 0.1, 5.0, 5.0, 0.1, 0.1, 0.1, 0.1, 0.1],
        cashFlowItems: [
          {
            description: 'Volatile Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 50000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.riskAssessment.operatingRisk).toBe('High');
      expect(result.riskAssessment.riskFactors).toContain('Highly volatile cash flows');
      expect(result.riskAssessment.mitigationStrategies).toContain('Diversify revenue streams');
    });
  });

  describe('warnings generation', () => {
    it('generates warning for critical liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 15000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.warnings).toContain(
        '⚠️ Critical liquidity situation - immediate action required'
      );
      expect(result.warnings.some((w) => w.includes('High liquidity risk'))).toBe(true);
    });

    it('generates warning for minimum balance violations', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 30000,
        minimumCashBalance: 50000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Small Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 5000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.minimumBalanceViolations).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Minimum cash balance violated'))).toBe(true);
      expect(result.riskAssessment.riskFactors).toContain('Minimum balance violations detected');
    });

    it('generates warning for poor liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 50000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Poor');
      expect(result.warnings).toContain(
        '⚠️ Critical liquidity situation - immediate action required'
      );
    });
  });

  describe('insights generation', () => {
    it('generates insight for positive free cash flow', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 100000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -30000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.insights.some((i) => i.includes('Positive free cash flow'))).toBe(true);
    });

    it('generates insight for negative free cash flow', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 500000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -30000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'CapEx',
            type: 'investing',
            category: 'capital-expenditure',
            amount: -10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.insights.some((i) => i.includes('requires financing'))).toBe(true);
    });

    it('generates warning insight for low cash coverage', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 50000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(
        result.insights.some((i) => i.includes('⚠️') && i.includes('months of cash coverage'))
      ).toBe(true);
    });

    it('generates runway insight when burn rate is positive', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 5000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.metrics.burnRate).toBeGreaterThan(0);
      expect(result.insights.some((i) => i.includes('runway'))).toBe(true);
    });
  });

  describe('recommendations generation', () => {
    it('recommends improving cash flow when free cash flow is negative', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 500000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -30000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(
        result.recommendations.some(
          (r) =>
            r.includes('improving operating cash flow') ||
            r.includes('reducing capital expenditures')
        )
      ).toBe(true);
    });

    it('recommends building reserves when coverage is low', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.recommendations.some((r) => r.includes('Build cash reserves'))).toBe(true);
    });

    it('recommends cost reduction when burn rate is positive', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 5000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.metrics.burnRate).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('cost reduction'))).toBe(true);
    });
  });

  describe('overall health assessment', () => {
    it('assesses Excellent health with positive FCF and excellent liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 1000000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 100000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -30000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.metrics.freeCashFlow).toBeGreaterThan(0);
      expect(result.liquidityAnalysis.currentLiquidity).toBe('Excellent');
      expect(result.overallHealth).toBe('Excellent');
    });

    it('assesses Good health with positive FCF and good liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 200000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 50000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.metrics.freeCashFlow).toBeGreaterThan(0);
      expect(result.liquidityAnalysis.currentLiquidity).toBe('Good');
      expect(result.overallHealth).toBe('Good');
    });

    it('assesses Fair health with adequate liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Adequate');
      expect(result.overallHealth).toBe('Fair');
    });

    it('assesses Poor health with poor liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 50000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 20000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Poor');
      expect(result.overallHealth).toBe('Poor');
    });

    it('assesses Critical health with critical liquidity', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 20000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -25000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.liquidityAnalysis.currentLiquidity).toBe('Critical');
      expect(result.overallHealth).toBe('Critical');
    });
  });

  describe('cash flow quality', () => {
    it('calculates cash flow quality when net income is provided', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'indirect',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        netIncome: 500000,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 100000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'Expenses',
            type: 'operating',
            category: 'operating-expenses',
            amount: -50000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.metrics.cashFlowQuality).toBeGreaterThan(0);
    });
  });

  describe('debt obligations beyond term', () => {
    it('stops debt payments after term ends', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        debtObligations: [
          {
            principal: 10000,
            interestRate: 0.06,
            termMonths: 6,
            startDate: '2024-01-01',
            paymentFrequency: 'monthly',
          },
        ],
        cashFlowItems: [
          {
            description: 'Placeholder',
            type: 'operating',
            category: 'revenue',
            amount: 1000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.monthlyCashFlows[0]!.financingOutflows).toBeGreaterThan(0);
      expect(result.monthlyCashFlows[5]!.financingOutflows).toBeGreaterThan(0);
      expect(result.monthlyCashFlows[6]!.financingOutflows).toBe(0);
      expect(result.monthlyCashFlows[11]!.financingOutflows).toBe(0);
    });
  });
});
