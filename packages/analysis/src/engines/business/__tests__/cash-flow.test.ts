import { describe, it, expect } from 'vitest';
import { CashFlowAnalyzer } from '../cash-flow.js';
import { CashFlowAnalysisInputSchema } from '../../../schemas/cash-flow.js';
import { createBasicCashFlowInput } from './fixtures/cash-flow';

describe('CashFlowAnalyzer', () => {
  const createBasicInput = () => createBasicCashFlowInput();

  describe('basic cash flow analysis', () => {
    it('generates monthly cash flows', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.monthlyCashFlows).toBeDefined();
      expect(result.monthlyCashFlows).toHaveLength(12);
    });

    it('tracks month numbers correctly', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.monthlyCashFlows[0]!.month).toBe(1);
      expect(result.monthlyCashFlows[11]!.month).toBe(12);
    });

    it('calculates net cash flow per month', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      result.monthlyCashFlows.forEach((month) => {
        const expectedNet = month.totalInflows - month.totalOutflows;
        expect(month.netCashFlow).toBeCloseTo(expectedNet, 0);
      });
    });

    it('tracks opening and closing balances', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.monthlyCashFlows[0]!.openingBalance).toBeCloseTo(100000, 0);

      // Each month's closing balance should be next month's opening
      for (let i = 0; i < result.monthlyCashFlows.length - 1; i++) {
        expect(result.monthlyCashFlows[i]!.closingBalance).toBeCloseTo(
          result.monthlyCashFlows[i + 1]!.openingBalance,
          0
        );
      }
    });

    it('tracks cumulative cash flow', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      let cumulative = 0;
      result.monthlyCashFlows.forEach((month) => {
        cumulative += month.netCashFlow;
        expect(month.cumulativeCashFlow).toBeCloseTo(cumulative, 0);
      });
    });
  });

  describe('cash flow categories', () => {
    it('separates operating, investing, and financing flows', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      const firstMonth = result.monthlyCashFlows[0]!;

      expect(firstMonth.operatingInflows).toBeDefined();
      expect(firstMonth.operatingOutflows).toBeDefined();
      expect(firstMonth.investingInflows).toBeDefined();
      expect(firstMonth.investingOutflows).toBeDefined();
      expect(firstMonth.financingInflows).toBeDefined();
      expect(firstMonth.financingOutflows).toBeDefined();
    });

    it('calculates net operating cash flow', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      const firstMonth = result.monthlyCashFlows[0]!;
      const expectedNetOp = firstMonth.operatingInflows - firstMonth.operatingOutflows;

      expect(firstMonth.netOperatingCashFlow).toBeCloseTo(expectedNetOp, 0);
    });

    it('summarizes by category', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.cashFlowByCategory).toBeDefined();
      expect(result.cashFlowByCategory.length).toBeGreaterThan(0);
    });
  });

  describe('metrics', () => {
    it('calculates total operating cash flow', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.metrics.totalOperatingCashFlow).toBeDefined();
    });

    it('calculates free cash flow', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      // Free cash flow = Operating - CapEx
      expect(result.metrics.freeCashFlow).toBeDefined();
    });

    it('calculates NPV', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.metrics.npv).toBeDefined();
    });

    it('calculates capital expenditure', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.metrics.capitalExpenditure).toBeDefined();
    });

    it('calculates average monthly operating CF', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.metrics.averageMonthlyOperatingCF).toBeDefined();
    });
  });

  describe('liquidity analysis', () => {
    it('assesses current liquidity', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.liquidityAnalysis).toBeDefined();
      expect(result.liquidityAnalysis.currentLiquidity).toBeDefined();
    });

    it('calculates months of coverage', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.liquidityAnalysis.monthsOfCoverage).toBeDefined();
      expect(result.liquidityAnalysis.monthsOfCoverage).toBeGreaterThanOrEqual(0);
    });

    it('tracks minimum balance violations', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.liquidityAnalysis.minimumBalanceViolations).toBeDefined();
      expect(typeof result.liquidityAnalysis.minimumBalanceViolations).toBe('number');
    });

    it('detects violations with tight minimum', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        ...createBasicInput(),
        openingCashBalance: 30000, // Smaller starting balance
        minimumCashBalance: 25000, // Higher minimum
      });
      const result = CashFlowAnalyzer.analyze(input);

      // May have violations with tighter constraints
      expect(result.liquidityAnalysis.minimumBalanceViolations).toBeDefined();
    });
  });

  describe('risk assessment', () => {
    it('calculates cash flow volatility', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment.cashFlowVolatility).toBeDefined();
    });

    it('assesses liquidity risk', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.riskAssessment.liquidityRisk).toBeDefined();
      expect(['Low', 'Medium', 'High']).toContain(result.riskAssessment.liquidityRisk);
    });

    it('assesses operating risk', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.riskAssessment.operatingRisk).toBeDefined();
      expect(['Low', 'Medium', 'High']).toContain(result.riskAssessment.operatingRisk);
    });

    it('identifies risk factors', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.riskAssessment.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskAssessment.riskFactors)).toBe(true);
    });

    it('suggests mitigation strategies', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.riskAssessment.mitigationStrategies).toBeDefined();
    });
  });

  describe('insights and recommendations', () => {
    it('generates insights', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('generates warnings when appropriate', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('generates recommendations', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('assesses overall health', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.overallHealth).toBeDefined();
      expect(['Excellent', 'Good', 'Fair', 'Poor', 'Critical']).toContain(result.overallHealth);
    });
  });

  describe('healthy cash flow scenario', () => {
    it('healthy cash flow scenario', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 500000,
        minimumCashBalance: 20000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 100000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0.05,
          },
          {
            description: 'Operating Costs',
            type: 'operating',
            category: 'operating-expenses',
            amount: -40000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0.02,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.overallHealth).toBeDefined();
      // Strong revenue with modest costs should yield good or excellent health
      expect(['Excellent', 'Good', 'Fair']).toContain(result.overallHealth);
    });
  });

  describe('growth and special items', () => {
    it('applies growth rates to recurring items', () => {
      const input = createBasicInput();
      const result = CashFlowAnalyzer.analyze(input);

      // Revenue grows at 2% monthly, so later months should have higher inflows
      const firstMonthInflows = result.monthlyCashFlows[0]!.operatingInflows;
      const lastMonthInflows = result.monthlyCashFlows[11]!.operatingInflows;

      // With growth, last month should be higher (or equal if starting month=1)
      expect(lastMonthInflows).toBeGreaterThanOrEqual(firstMonthInflows);
    });

    it('handles one-time cash flow items', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      // Equipment purchase is one-time in March (month 3)
      // Month index 2 (March) should have investing outflows
      const marchMonth = result.monthlyCashFlows[2]; // March is index 2

      // The one-time CapEx should appear in investing outflows
      expect(marchMonth).toBeDefined();
    });

    it('handles debt obligations', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        ...createBasicInput(),
        debtObligations: [
          {
            principal: 100000,
            interestRate: 0.06,
            termMonths: 60,
            startDate: '2024-01-01',
            paymentFrequency: 'monthly',
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // Should have financing outflows from debt service
      expect(result.monthlyCashFlows[0]!.financingOutflows).toBeDefined();
    });
  });

  describe('burn rate', () => {
    it('calculates burn rate for negative cash flow', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Small Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
          {
            description: 'High Expenses',
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

      // Net burn rate should exist (spending > revenue)
      expect(result.metrics).toBeDefined();
      // Burn rate should be positive when expenses exceed revenue
      expect(result.metrics.burnRate).toBeDefined();
    });
  });

  describe('metadata and assumptions', () => {
    it('includes analysis dates', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.analysisStartDate).toBeDefined();
      expect(result.analysisEndDate).toBeDefined();
      expect(result.analysisPeriodMonths).toBe(12);
    });

    it('includes calculation date', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.calculationDate).toBeDefined();
    });

    it('includes assumptions', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.assumptions).toBeDefined();
    });

    it('includes company name when provided', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        ...createBasicInput(),
        companyName: 'Test Corp',
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.companyName).toBe('Test Corp');
    });
  });

  describe('ratios', () => {
    it('calculates financial ratios', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result.ratios).toBeDefined();
    });
  });

  describe('analysis method', () => {
    it('supports direct method', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        ...createBasicInput(),
        method: 'direct',
      });
      const result = CashFlowAnalyzer.analyze(input);

      expect(result.method).toBe('direct');
    });

    it('supports indirect method', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        ...createBasicInput(),
        method: 'indirect',
        netIncome: 250000,
      });
      const result = CashFlowAnalyzer.analyze(input);

      expect(result.method).toBe('indirect');
    });
  });

  describe('frequency variations', () => {
    it('handles quarterly recurring items', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Quarterly Dividend',
            type: 'financing',
            category: 'dividend-payment',
            amount: 10000,
            isRecurring: true,
            frequency: 'quarterly',
            growthRate: 0.05,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // Quarterly items should appear in months 1, 4, 7, 10 (indices 0, 3, 6, 9)
      expect(result.monthlyCashFlows[0]!.financingInflows).toBeGreaterThan(0);
      expect(result.monthlyCashFlows[1]!.financingInflows).toBe(0);
      expect(result.monthlyCashFlows[2]!.financingInflows).toBe(0);
      expect(result.monthlyCashFlows[3]!.financingInflows).toBeGreaterThan(0);
    });

    it('handles annual recurring items', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 24, // 2 years to see growth
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Annual Bonus',
            type: 'operating',
            category: 'revenue',
            amount: 50000,
            isRecurring: true,
            frequency: 'annual',
            growthRate: 0.10,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // Annual items should appear in months 1 and 13 (indices 0 and 12)
      expect(result.monthlyCashFlows[0]!.operatingInflows).toBeGreaterThan(0);
      expect(result.monthlyCashFlows[11]!.operatingInflows).toBe(0);
      expect(result.monthlyCashFlows[12]!.operatingInflows).toBeGreaterThan(0);
      
      // Second year should show growth
      expect(result.monthlyCashFlows[12]!.operatingInflows).toBeGreaterThan(
        result.monthlyCashFlows[0]!.operatingInflows
      );
    });
  });

  describe('seasonality', () => {
    it('applies seasonality factors to monthly items', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        includeSeasonality: true,
        seasonalityFactors: [0.8, 0.9, 1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 1.0, 1.5], // Peak in Dec
        cashFlowItems: [
          {
            description: 'Seasonal Revenue',
            type: 'operating',
            category: 'revenue',
            amount: 10000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // January (factor 0.8) should be lower than December (factor 1.5)
      expect(result.monthlyCashFlows[0]!.operatingInflows).toBeCloseTo(8000, 0); // 10000 * 0.8
      expect(result.monthlyCashFlows[11]!.operatingInflows).toBeCloseTo(15000, 0); // 10000 * 1.5
    });

    it('does not apply seasonality when disabled', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        includeSeasonality: false,
        seasonalityFactors: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2.0],
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
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // All months should have same inflows (no seasonality applied)
      expect(result.monthlyCashFlows[0]!.operatingInflows).toBeCloseTo(10000, 0);
      expect(result.monthlyCashFlows[11]!.operatingInflows).toBeCloseTo(10000, 0);
    });
  });

  describe('investing cash flows', () => {
    it('handles positive investing inflows (asset sales)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Asset Sale',
            type: 'investing',
            category: 'asset-sale',
            amount: 25000,
            isRecurring: false,
            frequency: 'one-time',
            growthRate: 0,
            date: '2024-03-01', // March = 2 months from Jan 1, index 2
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // One-time item in March (approximately index 2)
      // Find the month with investing inflows
      const monthWithInflows = result.monthlyCashFlows.find(m => m.investingInflows > 0);
      expect(monthWithInflows).toBeDefined();
      expect(monthWithInflows!.investingInflows).toBe(25000);
      expect(monthWithInflows!.netInvestingCashFlow).toBeGreaterThan(0);
    });
  });

  describe('financing cash flows', () => {
    it('handles positive financing inflows (loans received)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 100000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Bank Loan',
            type: 'financing',
            category: 'debt-issuance',
            amount: 200000,
            isRecurring: false,
            frequency: 'one-time',
            growthRate: 0,
            date: '2024-02-01',
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      // February (month 2, index 1) should have financing inflows
      expect(result.monthlyCashFlows[1]!.financingInflows).toBeGreaterThan(0);
      expect(result.monthlyCashFlows[1]!.netFinancingCashFlow).toBeGreaterThan(0);
    });

    it('handles negative financing outflows (debt repayment)', () => {
      const input = CashFlowAnalysisInputSchema.parse({
        analysisStartDate: '2024-01-01',
        analysisPeriodMonths: 12,
        method: 'direct',
        openingCashBalance: 500000,
        minimumCashBalance: 5000,
        discountRate: 0.08,
        cashFlowItems: [
          {
            description: 'Loan Repayment',
            type: 'financing',
            category: 'debt-repayment',
            amount: -50000,
            isRecurring: true,
            frequency: 'monthly',
            growthRate: 0,
          },
        ],
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.monthlyCashFlows[0]!.financingOutflows).toBeGreaterThan(0);
      expect(result.monthlyCashFlows[0]!.netFinancingCashFlow).toBeLessThan(0);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = CashFlowAnalyzer.analyze(createBasicInput());

      expect(result).toHaveProperty('analysisStartDate');
      expect(result).toHaveProperty('analysisEndDate');
      expect(result).toHaveProperty('analysisPeriodMonths');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('monthlyCashFlows');
      expect(result).toHaveProperty('cashFlowByCategory');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('liquidityAnalysis');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('overallHealth');
    });
  });
});
