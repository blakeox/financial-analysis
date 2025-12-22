import { describe, expect, it } from 'vitest';
import { TaxOptimizationTool } from '../tools/tax-optimization';

describe('TaxOptimizationTool', () => {
  // Valid input matching TaxOptimizationInputSchema from analysis package
  const validInput = {
    personalInfo: {
      age: 35,
      maritalStatus: 'married-filing-jointly' as const,
      dependents: 2,
      state: 'CA',
      filingStatus: 'married-joint' as const,
    },
    currentTaxSituation: {
      annualIncome: 150000,
      adjustedGrossIncome: 140000,
      taxableIncome: 120000,
      federalTaxOwed: 20000,
      stateTaxOwed: 5000,
      effectiveTaxRate: 0.16,
      marginalTaxRate: 0.24,
      totalTaxOwed: 25000,
    },
    investmentHoldings: [
      {
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        shares: 100,
        currentPrice: 200,
        costBasis: 150,
        purchaseDate: '2020-01-01',
        accountType: 'taxable' as const,
        holdingPeriod: 'long-term' as const,
        unrealizedGainLoss: 5000,
      }
    ],
    retirementAccounts: {
      traditional401k: { balance: 100000, annualContribution: 19500, employerMatch: 5000 },
      roth401k: { balance: 0, annualContribution: 0 },
      traditionalIRA: { balance: 50000, annualContribution: 0, deductibleContribution: 0 },
      rothIRA: { balance: 20000, annualContribution: 6000 },
      hsa: { balance: 5000, annualContribution: 3600, employerContribution: 500 },
    },
    deductionsCredits: {
      standardDeduction: 25900,
      itemizedDeductions: {
        mortgageInterest: 10000,
        propertyTaxes: 5000,
        stateIncomeTax: 5000,
        charitableContributions: 1000,
        medicalExpenses: 0,
        otherDeductions: 0,
      },
      taxCredits: {
        childTaxCredit: 4000,
        earnedIncomeCredit: 0,
        educationCredits: 0,
        otherCredits: 0,
      },
    },
    goals: {
      retirementAge: 65,
      expectedRetirementTaxRate: 0.15,
      charitableGivingGoal: 1000,
      taxLossHarvestingGoal: 3000,
      capitalGainsGoal: 0,
    },
    analysis: {
      includeTaxLossHarvesting: true,
      includeRothConversion: true,
      includeCharitableGiving: true,
      includeCapitalGainsOptimization: true,
      includeEstimatedTaxPlanning: true,
      includeBracketOptimization: true,
      inflationRate: 0.03,
      discountRate: 0.05,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(TaxOptimizationTool.toolName).toBe('analyze_tax_optimization');
    });

    it('has a description', () => {
      expect(TaxOptimizationTool.description).toBeTruthy();
      expect(TaxOptimizationTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = TaxOptimizationTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('personalInfo');
      expect(schema.required).toContain('currentTaxSituation');
    });
  });

  describe('execute', () => {
    it('performs tax optimization analysis with valid input', async () => {
      const result = await TaxOptimizationTool.execute(validInput);
      expect(result).toBeDefined();
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { data: unknown }).data).toBeDefined();
    });

    it('returns analysis data structure', async () => {
      const result = await TaxOptimizationTool.execute(validInput);
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { timestamp: string }).timestamp).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const invalidInput = {
        personalInfo: {
          age: 35,
          // Missing required fields
        },
      };

      const result = await TaxOptimizationTool.execute(invalidInput);
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });

    it('returns error for empty input', async () => {
      const result = await TaxOptimizationTool.execute({});
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });
  });
});
