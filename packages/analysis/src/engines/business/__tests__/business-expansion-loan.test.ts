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
      expect(result.financialHealth).toBeDefined();
      expect(result.debtCapacity).toBeDefined();
      expect(result.loanScenarios).toBeDefined();
      expect(result.dscr).toBeDefined();
    });

    it('should validate input with Zod schema', () => {
      expect(() => BusinessExpansionLoanInputSchema.parse(basicInput)).not.toThrow();
    });
  });
});
