import { describe, expect, it } from 'vitest';
import { InsuranceNeedsTool } from '../tools/insurance-needs';

describe('InsuranceNeedsTool', () => {
  // Valid input matching InsuranceNeedsInputSchema from @financial-analysis/analysis engines
  const validInput = {
    personalInfo: {
      age: 40,
      maritalStatus: 'married' as const,
      dependents: 2,
      employmentStatus: 'employed' as const,
      healthStatus: 'good' as const,
      occupation: 'Engineer',
      annualIncome: 100000,
      monthlyExpenses: 5000,
    },
    currentInsurance: {
      lifeInsurance: {
        termLife: {
          coverage: 250000,
          termYears: 20,
          monthlyPremium: 50,
        },
        wholeLife: {
          coverage: 0,
          cashValue: 0,
          monthlyPremium: 0,
        },
      },
      disabilityInsurance: {
        shortTerm: {
          coverage: 3000,
          waitingPeriod: 14,
          benefitPeriod: 90,
          monthlyPremium: 30,
        },
        longTerm: {
          coverage: 5000,
          waitingPeriod: 90,
          benefitPeriod: 60,
          monthlyPremium: 80,
        },
      },
      longTermCare: {
        coverage: 0,
        dailyBenefit: 0,
        benefitPeriod: 0,
        eliminationPeriod: 0,
        monthlyPremium: 0,
      },
      healthInsurance: {
        coverage: 'employer-provided',
        monthlyPremium: 200,
        deductible: 1500,
        outOfPocketMax: 6000,
      },
    },
    financialSituation: {
      totalAssets: 500000,
      totalDebts: 200000,
      emergencyFund: 30000,
      retirementSavings: 150000,
      otherIncome: 0,
      socialSecurityBenefit: 0,
    },
    goals: {
      incomeReplacementRatio: 0.7,
      debtPayoffGoal: true,
      educationFunding: 100000,
      retirementGoal: 1000000,
      legacyGoal: 50000,
    },
    analysis: {
      includeLifeInsurance: true,
      includeDisabilityInsurance: true,
      includeLongTermCare: true,
      includeHealthInsurance: false,
      inflationRate: 0.03,
      discountRate: 0.05,
      lifeExpectancy: 85,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(InsuranceNeedsTool.toolName).toBe('analyze_insurance_needs');
    });

    it('has a description', () => {
      expect(InsuranceNeedsTool.description).toBeTruthy();
      expect(InsuranceNeedsTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = InsuranceNeedsTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('personalInfo');
      expect(schema.required).toContain('financialSituation');
    });
  });

  describe('execute', () => {
    it('performs insurance needs analysis with valid input', async () => {
      const result = await InsuranceNeedsTool.execute(validInput);
      expect(result).toBeDefined();
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { data: unknown }).data).toBeDefined();
    });

    it('returns analysis with timestamp', async () => {
      const result = await InsuranceNeedsTool.execute(validInput);
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { timestamp: string }).timestamp).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const invalidInput = {
        personalInfo: {
          age: 40,
          // Missing required fields
        },
      };

      const result = await InsuranceNeedsTool.execute(invalidInput);
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });

    it('returns error for empty input', async () => {
      const result = await InsuranceNeedsTool.execute({});
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });
  });
});
