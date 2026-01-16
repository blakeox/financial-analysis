import { describe, it, expect } from 'vitest';
import { BusinessExpansionLoanJourney } from '../business-expansion-loan.js';
import { BusinessExpansionLoanInputSchema } from '../../../schemas/business-expansion-loan.js';
import type { BusinessExpansionLoanInput } from '../../../schemas/business-expansion-loan.js';

describe('BusinessExpansionLoanJourney', () => {
  const basicInput: BusinessExpansionLoanInput = {
    businessInfo: {
      businessName: 'Test Corp',
      industry: 'Technology',
      yearsInBusiness: 5,
      businessType: 'corporation',
      employeeCount: 10,
    },
    currentFinancials: {
      annualRevenue: 1000000,
      annualEBITDA: 200000,
      currentDebt: 50000,
      monthlyDebtPayments: 1000,
      cashOnHand: 100000,
      accountsReceivable: 50000,
      accountsPayable: 20000,
      creditScore: 750,
    },
    expansionPlan: {
      loanAmount: 500000,
      loanPurpose: 'expansion',
      expectedRevenueIncrease: 200000,
      expectedEBITDAIncrease: 50000,
      timeline: 5,
      description: 'New office',
    },
    loanPreferences: {
      preferredTerm: 5,
      preferredRate: 0.06,
      loanType: 'term-loan',
      collateralAvailable: true,
      collateralValue: 200000,
    },
    goals: {
      riskTolerance: 'moderate',
      priority: 'lowest-cost',
      includeScenarioAnalysis: true,
    },
  };

  describe('analyze()', () => {
    it('should perform comprehensive business expansion loan analysis', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.financialHealthScore).toBeGreaterThan(0);
      expect(result.summary.debtCapacity).toBeGreaterThan(0);
      expect(result.summary.recommendedLoanAmount).toBeGreaterThan(0);
      expect(result.summary.monthlyPayment).toBeGreaterThan(0);
      expect(result.summary.dscr).toBeGreaterThan(0);
      expect(result.summary.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.summary.riskLevel).toMatch(/low|medium|high/);

      expect(result.financialHealth).toBeDefined();
      expect(result.financialHealth.score).toBeGreaterThanOrEqual(0);
      expect(result.financialHealth.score).toBeLessThanOrEqual(100);
      expect(result.financialHealth.metrics).toBeDefined();
      expect(result.financialHealth.strengths).toBeInstanceOf(Array);
      expect(result.financialHealth.weaknesses).toBeInstanceOf(Array);

      expect(result.debtCapacity).toBeDefined();
      expect(result.debtCapacity.maxLoanAmount).toBeGreaterThan(0);
      expect(result.debtCapacity.recommendedLoanAmount).toBeGreaterThan(0);
      expect(result.debtCapacity.debtCapacityRatio).toBeGreaterThan(0);
      expect(result.debtCapacity.factors).toBeInstanceOf(Array);

      expect(result.loanScenarios).toBeDefined();
      expect(result.loanScenarios.optimal).toBeDefined();
      expect(result.loanScenarios.optimal.term).toBe(5);
      expect(result.loanScenarios.optimal.rate).toBe(0.06);
      expect(result.loanScenarios.optimal.monthlyPayment).toBeGreaterThan(0);
      expect(result.loanScenarios.optimal.totalInterest).toBeGreaterThan(0);
      expect(result.loanScenarios.optimal.totalCost).toBeGreaterThan(basicInput.expansionPlan.loanAmount);

      expect(result.dscr).toBeDefined();
      expect(result.dscr.ratio).toBeGreaterThan(0);
      expect(result.dscr.status).toBeTruthy();
      expect(result.dscr.interpretation).toBeTruthy();

      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment.overallRisk).toMatch(/low|medium|high/);
      expect(result.riskAssessment.riskFactors).toBeInstanceOf(Array);
      expect(result.riskAssessment.mitigations).toBeInstanceOf(Array);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);

      expect(result.cashFlowProjection).toBeDefined();
      expect(result.cashFlowProjection.months).toBeInstanceOf(Array);
      expect(result.cashFlowProjection.months.length).toBe(24);
      expect(result.cashFlowProjection.summary).toBeDefined();

      expect(result.insights).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should validate input with Zod schema', () => {
      expect(() => BusinessExpansionLoanInputSchema.parse(basicInput)).not.toThrow();
    });

    it('should assess financial health correctly for strong business', () => {
      const strongInput = {
        ...basicInput,
        currentFinancials: {
          ...basicInput.currentFinancials,
          annualEBITDA: 400000,
          currentDebt: 50000,
          creditScore: 780,
        },
        businessInfo: {
          ...basicInput.businessInfo,
          yearsInBusiness: 10,
        },
      };

      const result = BusinessExpansionLoanJourney.analyze(strongInput) as any;

      expect(result.financialHealth.score).toBeGreaterThan(70);
      expect(result.financialHealth.strengths.length).toBeGreaterThan(0);
      expect(result.summary.riskLevel).toBe('low');
    });

    it('should assess financial health correctly for weak business', () => {
      const weakInput = {
        ...basicInput,
        currentFinancials: {
          ...basicInput.currentFinancials,
          annualEBITDA: 50000,
          currentDebt: 300000,
          creditScore: 580,
          cashOnHand: 10000,
        },
        businessInfo: {
          ...basicInput.businessInfo,
          yearsInBusiness: 1,
        },
      };

      const result = BusinessExpansionLoanJourney.analyze(weakInput) as any;

      expect(result.financialHealth.score).toBeLessThan(70);
      expect(result.financialHealth.weaknesses.length).toBeGreaterThan(0);
      expect(result.summary.riskLevel).toMatch(/medium|high/);
    });

    it('should calculate debt capacity correctly', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.debtCapacity.maxLoanAmount).toBeGreaterThan(0);
      expect(result.debtCapacity.recommendedLoanAmount).toBeLessThanOrEqual(result.debtCapacity.maxLoanAmount);
      expect(result.debtCapacity.debtCapacityRatio).toBeGreaterThan(0);
    });

    it('should generate loan scenarios with alternatives', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.loanScenarios.optimal).toBeDefined();
      expect(result.loanScenarios.alternatives).toBeInstanceOf(Array);
      expect(result.loanScenarios.alternatives.length).toBeGreaterThan(0);

      result.loanScenarios.alternatives.forEach((alt: any) => {
        expect(alt.term).toBeGreaterThan(0);
        expect(alt.rate).toBeGreaterThan(0);
        expect(alt.monthlyPayment).toBeGreaterThan(0);
        expect(alt.totalInterest).toBeGreaterThan(0);
        expect(alt.totalCost).toBeGreaterThan(0);
        expect(alt.description).toBeTruthy();
      });
    });

    it('should project cash flow with loan payments', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.cashFlowProjection.months).toBeInstanceOf(Array);
      expect(result.cashFlowProjection.months.length).toBe(24);

      const firstMonth = result.cashFlowProjection.months[0];
      expect(firstMonth.month).toBe(1);
      expect(firstMonth.revenue).toBeGreaterThan(0);
      expect(firstMonth.ebitda).toBeGreaterThan(0);
      expect(firstMonth.loanPayment).toBeGreaterThan(0);
      expect(firstMonth.netCashFlow).toBeDefined();
      expect(firstMonth.cumulativeCashFlow).toBeDefined();

      expect(result.cashFlowProjection.summary.averageMonthlyCashFlow).toBeDefined();
      expect(result.cashFlowProjection.summary.monthsPositive).toBeGreaterThanOrEqual(0);
      expect(result.cashFlowProjection.summary.monthsNegative).toBeGreaterThanOrEqual(0);
      expect(result.cashFlowProjection.summary.monthsPositive + result.cashFlowProjection.summary.monthsNegative).toBe(24);
    });

    it('should calculate DSCR correctly', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.dscr.ratio).toBeGreaterThan(0);
      expect(['excellent', 'good', 'marginal', 'poor']).toContain(result.dscr.status);
      expect(result.dscr.interpretation).toBeTruthy();

      if (result.dscr.ratio >= 1.5) {
        expect(result.dscr.status).toBe('excellent');
      } else if (result.dscr.ratio >= 1.25) {
        expect(result.dscr.status).toBe('good');
      } else if (result.dscr.ratio >= 1.0) {
        expect(result.dscr.status).toBe('marginal');
      } else {
        expect(result.dscr.status).toBe('poor');
      }
    });

    it('should assess risks comprehensively', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.riskAssessment.overallRisk).toMatch(/low|medium|high/);
      expect(result.riskAssessment.riskFactors).toBeInstanceOf(Array);
      expect(result.riskAssessment.mitigations).toBeInstanceOf(Array);

      result.riskAssessment.riskFactors.forEach((factor: any) => {
        expect(factor.factor).toBeTruthy();
        expect(['low', 'medium', 'high']).toContain(factor.severity);
        expect(factor.description).toBeTruthy();
      });
    });

    it('should identify high-risk scenarios correctly', () => {
      const highRiskInput = {
        ...basicInput,
        currentFinancials: {
          ...basicInput.currentFinancials,
          annualEBITDA: 40000,
          currentDebt: 200000,
          monthlyDebtPayments: 5000,
          cashOnHand: 5000,
        },
        expansionPlan: {
          ...basicInput.expansionPlan,
          loanAmount: 1000000,
        },
      };

      const result = BusinessExpansionLoanJourney.analyze(highRiskInput) as any;

      expect(result.summary.riskLevel).toBe('high');
      expect(result.riskAssessment.riskFactors.length).toBeGreaterThan(0);
      const hasHighSeverityRisk = result.riskAssessment.riskFactors.some((r: any) => r.severity === 'high');
      expect(hasHighSeverityRisk).toBe(true);
    });

    it('should generate appropriate recommendations', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach((rec: any) => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });

    it('should calculate success probability between 0 and 100', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.summary.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.summary.successProbability).toBeLessThanOrEqual(100);
    });

    it('should handle different loan types with appropriate market rates', () => {
      const sbaInput = {
        ...basicInput,
        loanPreferences: {
          ...basicInput.loanPreferences,
          loanType: 'sba',
          preferredRate: undefined,
        },
      };

      const result = BusinessExpansionLoanJourney.analyze(sbaInput) as any;
      expect(result.loanScenarios.optimal.rate).toBe(0.065);

      const lineOfCreditInput = {
        ...basicInput,
        loanPreferences: {
          ...basicInput.loanPreferences,
          loanType: 'line-of-credit',
          preferredRate: undefined,
        },
      };

      const result2 = BusinessExpansionLoanJourney.analyze(lineOfCreditInput) as any;
      expect(result2.loanScenarios.optimal.rate).toBe(0.1);
    });

    it('should handle excellent credit scenario with better rate alternatives', () => {
      const excellentCreditInput = {
        ...basicInput,
        currentFinancials: {
          ...basicInput.currentFinancials,
          creditScore: 800,
        },
      };

      const result = BusinessExpansionLoanJourney.analyze(excellentCreditInput) as any;

      const betterRateAlt = result.loanScenarios.alternatives.find((alt: any) =>
        alt.description.includes('excellent credit')
      );
      expect(betterRateAlt).toBeDefined();
      expect(betterRateAlt.rate).toBeLessThan(basicInput.loanPreferences.preferredRate!);
    });

    it('should include scenario analysis when requested', () => {
      const result = BusinessExpansionLoanJourney.analyze(basicInput) as any;

      expect(result.loanScenarios.alternatives.length).toBeGreaterThan(0);
    });
  });
});
