import { describe, expect, it } from 'vitest';
import { TaxOptimizationTool } from '../tools/tax-optimization';

describe('TaxOptimizationTool', () => {
  // Valid input matching TaxOptimizationInputSchema from analysis package
  const validInput = {
    personalInfo: {
      age: 35,
      maritalStatus: 'married' as const,
      dependents: 2,
      stateOfResidence: 'CA',
      occupation: 'Software Engineer',
    },
    income: {
      annualSalary: 150000,
      bonus: 20000,
      investmentIncome: 5000,
      rentalIncome: 12000,
      otherIncome: 1000,
    },
    deductions: {
      mortgageInterest: 15000,
      propertyTaxes: 8000,
      charitableContributions: 5000,
      medicalExpenses: 2000,
      otherDeductions: 1000,
    },
    investments: {
      taxableAccounts: 50000,
      traditionalIRA: 100000,
      rothIRA: 30000,
      employer401k: 200000,
      otherRetirement: 10000,
    },
    goals: {
      taxStrategy: 'balanced' as const,
      riskTolerance: 'moderate' as const,
      timeHorizon: 25,
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
