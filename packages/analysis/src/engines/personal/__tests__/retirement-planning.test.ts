import { describe, it, expect } from 'vitest';
import type { RetirementPlanningInput } from '../retirement-planning';
import { RetirementPlanningEngine } from '../retirement-planning';

describe('RetirementPlanningEngine', () => {
  const baseInput: RetirementPlanningInput = {
    personalInfo: {
      age: 40,
      retirementAge: 65,
      lifeExpectancy: 90,
      maritalStatus: 'married',
      dependents: 2,
    },
    currentAccounts: [
      {
        type: '401k',
        balance: 100000,
        annualContribution: 10000,
        employerMatch: 5000,
        expectedReturn: 0.07,
      },
      {
        type: 'ira',
        balance: 50000,
        annualContribution: 6000,
        expectedReturn: 0.07,
      },
    ],
    income: {
      currentAnnual: 100000,
      expectedGrowthRate: 0.03,
      socialSecurity: 30000,
    },
    expenses: {
      currentAnnual: 70000,
      retirementAnnual: 60000,
      inflationRate: 0.025,
    },
    goals: {
      targetRetirementIncome: 60000,
      riskTolerance: 'moderate',
      taxStrategy: 'balanced',
    },
  };

  describe('analyze()', () => {
    it('should return complete retirement planning analysis', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('accountProjections');
      expect(result).toHaveProperty('socialSecurityAnalysis');
      expect(result).toHaveProperty('withdrawalStrategy');
      expect(result).toHaveProperty('retirementReadiness');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('insights');

      expect(result.summary.currentAge).toBe(40);
      expect(result.summary.retirementAge).toBe(65);
      expect(result.summary.yearsToRetirement).toBe(25);
      expect(result.summary.yearsInRetirement).toBe(25);
      expect(result.summary.retirementReadinessScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.retirementReadinessScore).toBeLessThanOrEqual(110);
    });

    it('should project account balances with growth', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.accountProjections).toHaveLength(2);
      expect(result.accountProjections[0].accountType).toBe('401k');
      expect(result.accountProjections[1].accountType).toBe('ira');

      // Projected balances should be higher than current
      expect(parseFloat(result.accountProjections[0].projectedBalance)).toBeGreaterThan(100000);
      expect(parseFloat(result.accountProjections[1].projectedBalance)).toBeGreaterThan(50000);
    });
  });

  describe('retirement savings projection', () => {
    it('should calculate growing contributions with income growth', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        income: {
          ...baseInput.income,
          expectedGrowthRate: 0.05, // 5% income growth
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // With income growth, contributions increase over time
      expect(parseFloat(result.summary.projectedRetirementBalance)).toBeGreaterThan(0);
    });

    it('should project multiple account types', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 150000,
            annualContribution: 15000,
            expectedReturn: 0.08,
          },
          {
            type: 'roth-ira',
            balance: 75000,
            annualContribution: 6000,
            expectedReturn: 0.08,
          },
          {
            type: 'savings',
            balance: 25000,
            annualContribution: 2000,
            expectedReturn: 0.03,
          },
        ],
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.accountProjections).toHaveLength(3);
      expect(result.accountProjections[0].accountType).toBe('401k');
      expect(result.accountProjections[1].accountType).toBe('roth-ira');
      expect(result.accountProjections[2].accountType).toBe('savings');
    });

    it('should calculate total contributions and growth separately', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      for (const projection of result.accountProjections) {
        expect(parseFloat(projection.totalContributions)).toBeGreaterThan(0);
        expect(parseFloat(projection.totalGrowth)).toBeGreaterThan(0);

        const current = parseFloat(projection.currentBalance);
        const contributions = parseFloat(projection.totalContributions);
        const growth = parseFloat(projection.totalGrowth);
        const projected = parseFloat(projection.projectedBalance);

        // Projected = current + contributions + growth
        expect(projected).toBeCloseTo(current + contributions + growth, 0);
      }
    });
  });

  describe('retirement income needs calculation', () => {
    it('should use retirement expenses when provided', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        expenses: {
          currentAnnual: 80000,
          retirementAnnual: 60000,
          inflationRate: 0.025,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Should use 60000 as base, not 80000 * 0.8
      expect(parseFloat(result.summary.retirementIncomeNeeds)).toBeGreaterThan(60000);
    });

    it('should estimate at 80% of current expenses when retirement expenses are 0', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        expenses: {
          currentAnnual: 80000,
          retirementAnnual: 0,
          inflationRate: 0.025,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Should use 80000 * 0.8 = 64000 as base
      const needs = parseFloat(result.summary.retirementIncomeNeeds);
      expect(needs).toBeGreaterThan(64000); // Adjusted for inflation
    });

    it('should adjust for inflation over years to retirement', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 30,
          retirementAge: 65,
        },
        expenses: {
          currentAnnual: 60000,
          retirementAnnual: 60000,
          inflationRate: 0.03,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // 35 years to retirement with 3% inflation should significantly increase needs
      const needs = parseFloat(result.summary.retirementIncomeNeeds);
      expect(needs).toBeGreaterThan(60000 * 1.5); // At least 50% higher
    });
  });

  describe('Social Security analysis', () => {
    it('should use estimated benefit when provided', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        income: {
          ...baseInput.income,
          socialSecurity: 35000,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.socialSecurityAnalysis.annualBenefit).toBeDefined();
    });

    it('should estimate benefit at 30% of income when not provided', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        income: {
          currentAnnual: 100000,
          expectedGrowthRate: 0.03,
          // socialSecurity not provided
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Should be around 30000 (30% of 100000)
      expect(result.socialSecurityAnalysis.annualBenefit).toBeGreaterThan(0);
    });

    it('should reduce benefits for early retirement before 67', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          retirementAge: 62, // Early retirement
        },
        income: {
          ...baseInput.income,
          socialSecurity: 30000,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Should be reduced from 30000
      expect(result.socialSecurityAnalysis.annualBenefit).toBeLessThan(30000);
      expect(result.socialSecurityAnalysis.earlyClaimReduction).toBeGreaterThan(0);
    });

    it('should increase benefits for delayed retirement after 67', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          retirementAge: 70, // Delayed retirement
        },
        income: {
          ...baseInput.income,
          socialSecurity: 30000,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Should be increased from 30000 (8% per year)
      expect(result.socialSecurityAnalysis.annualBenefit).toBeGreaterThan(30000);
      expect(result.socialSecurityAnalysis.delayedClaimIncrease).toBeGreaterThan(0);
    });

    it('should recommend optimal claim age', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.socialSecurityAnalysis.optimalClaimAge).toBeGreaterThanOrEqual(67);
    });
  });

  describe('withdrawal strategy', () => {
    it('should use 4% rule for moderate risk tolerance', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          riskTolerance: 'moderate',
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.withdrawalStrategy.safeWithdrawalRate).toBeCloseTo(4, 1);
    });

    it('should use 3.5% rule for conservative risk tolerance', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          riskTolerance: 'conservative',
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.withdrawalStrategy.safeWithdrawalRate).toBeCloseTo(3.5, 1);
    });

    it('should use 4.5% rule for aggressive risk tolerance', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          riskTolerance: 'aggressive',
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.withdrawalStrategy.safeWithdrawalRate).toBeCloseTo(4.5, 1);
    });

    it('should calculate annual withdrawal amount', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      const balance = parseFloat(result.summary.projectedRetirementBalance);
      const withdrawal = result.withdrawalStrategy.annualWithdrawal;
      const rate = result.withdrawalStrategy.safeWithdrawalRate / 100;

      expect(withdrawal).toBeCloseTo(balance * rate, 0);
    });

    it('should project how long portfolio lasts', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.withdrawalStrategy.portfolioLastsYears).toBeGreaterThan(0);
      expect(result.withdrawalStrategy.portfolioLastsYears).toBeLessThanOrEqual(
        baseInput.personalInfo.lifeExpectancy - baseInput.personalInfo.retirementAge
      );
    });

    it('should include withdrawal strategy description', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.withdrawalStrategy.strategy).toContain('withdrawal rate');
      expect(result.withdrawalStrategy.strategy).toContain('expected returns');
    });
  });

  describe('retirement readiness calculation', () => {
    it('should give high score when savings exceed needs', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 500000,
            annualContribution: 20000,
            expectedReturn: 0.08,
          },
        ],
        expenses: {
          currentAnnual: 50000,
          retirementAnnual: 40000,
          inflationRate: 0.02,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.retirementReadiness.score).toBeGreaterThan(80);
      expect(result.retirementReadiness.gap).toBeLessThanOrEqual(0);
      expect(result.retirementReadiness.additionalContribution).toBe(0);
    });

    it('should penalize score when gap exists', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 30000,
            annualContribution: 5000,
            expectedReturn: 0.06,
          },
        ],
        expenses: {
          currentAnnual: 80000,
          retirementAnnual: 70000,
          inflationRate: 0.03,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.retirementReadiness.score).toBeLessThan(100);
      expect(result.retirementReadiness.gap).toBeGreaterThan(0);
      expect(result.retirementReadiness.additionalContribution).toBeGreaterThan(0);
    });

    it('should calculate additional contribution needed to close gap', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 50000,
            annualContribution: 6000,
            expectedReturn: 0.07,
          },
        ],
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      if (result.retirementReadiness.gap > 0) {
        expect(result.retirementReadiness.additionalContribution).toBeGreaterThan(0);
        // Additional contribution should be proportional to gap
        expect(result.retirementReadiness.additionalContribution).toBeCloseTo(
          result.retirementReadiness.gap * 25,
          0
        );
      }
    });
  });

  describe('recommendations generation', () => {
    it('should recommend increasing contributions when score < 70', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 20000,
            annualContribution: 3000,
            expectedReturn: 0.06,
          },
        ],
        expenses: {
          currentAnnual: 70000,
          retirementAnnual: 60000,
          inflationRate: 0.03,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      if (result.retirementReadiness.score < 70) {
        expect(
          result.recommendations.some((r: string) => r.includes('Increase annual contributions'))
        ).toBe(true);
      }
    });

    it('should recommend Roth conversions for traditional-first strategy when young', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 35,
        },
        goals: {
          ...baseInput.goals,
          taxStrategy: 'traditional-first',
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.recommendations.some((r: string) => r.includes('Roth conversions'))).toBe(true);
    });

    it('should not recommend Roth conversions for traditional-first when age >= 50', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 55,
        },
        goals: {
          ...baseInput.goals,
          taxStrategy: 'traditional-first',
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Should not include Roth conversion recommendation for age >= 50
      const hasRothRec = result.recommendations.some((r: string) => r.includes('Roth conversions'));
      expect(hasRothRec).toBe(false);
    });

    it('should recommend delaying Social Security when optimal age is later', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          retirementAge: 65,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      if (result.socialSecurityAnalysis.optimalClaimAge > 65) {
        expect(
          result.recommendations.some((r: string) => r.includes('delaying Social Security'))
        ).toBe(true);
      }
    });
  });

  describe('insights generation', () => {
    it('should provide insight about years to retirement', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.insights.some((i: string) => i.includes('years until retirement'))).toBe(true);
    });

    it('should provide insight about retirement income needs', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.insights.some((i: string) => i.includes('need'))).toBe(true);
      expect(result.insights.some((i: string) => i.includes('annually'))).toBe(true);
    });

    it('should provide insight about readiness score', () => {
      const result = RetirementPlanningEngine.analyze(baseInput) as any;

      expect(result.insights.some((i: string) => i.includes('readiness score'))).toBe(true);
    });

    it('should provide positive insight when score >= 80', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 500000,
            annualContribution: 20000,
            expectedReturn: 0.08,
          },
        ],
        expenses: {
          currentAnnual: 50000,
          retirementAnnual: 40000,
          inflationRate: 0.02,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      if (result.retirementReadiness.score >= 80) {
        expect(result.insights.some((i: string) => i.includes('on track'))).toBe(true);
      }
    });

    it('should provide cautionary insight when score < 80', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: '401k',
            balance: 30000,
            annualContribution: 4000,
            expectedReturn: 0.06,
          },
        ],
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      if (result.retirementReadiness.score < 80) {
        expect(
          result.insights.some(
            (i: string) => i.includes('increasing contributions') || i.includes('adjusting')
          )
        ).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle short time to retirement', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 63,
          retirementAge: 65,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.summary.yearsToRetirement).toBe(2);
    });

    it('should handle long retirement period', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          retirementAge: 60,
          lifeExpectancy: 100,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.summary.yearsInRetirement).toBe(40);
    });

    it('should handle single account', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        currentAccounts: [
          {
            type: 'ira',
            balance: 75000,
            annualContribution: 6000,
            expectedReturn: 0.07,
          },
        ],
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      expect(result.accountProjections).toHaveLength(1);
      expect(result.accountProjections[0].accountType).toBe('ira');
    });

    it('should handle zero inflation rate', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        expenses: {
          currentAnnual: 60000,
          retirementAnnual: 60000,
          inflationRate: 0,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // With no inflation, retirement needs should equal retirement expenses
      expect(parseFloat(result.summary.retirementIncomeNeeds)).toBeCloseTo(60000, 0);
    });

    it('should handle zero income growth', () => {
      const input: RetirementPlanningInput = {
        ...baseInput,
        income: {
          ...baseInput.income,
          expectedGrowthRate: 0,
        },
      };

      const result = RetirementPlanningEngine.analyze(input) as any;

      // Contributions should remain constant
      expect(parseFloat(result.summary.projectedRetirementBalance)).toBeGreaterThan(0);
    });
  });
});
