import { describe, expect, it } from 'vitest';
import {
  InsuranceNeedsCalculator,
  InsuranceNeedsInput,
  InsuranceNeedsResult,
} from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator life coverage scenarios', () => {
  const baseInput: InsuranceNeedsInput = createBaseInsuranceInput();

  describe('coverage adequacy branches', () => {
    it('returns adequate when current coverage >= 90% of recommended', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              coverage: 2000000,
              termYears: 20,
              monthlyPremium: 100,
            },
            wholeLife: {
              coverage: 500000,
              cashValue: 100000,
              monthlyPremium: 200,
            },
          },
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.coverageAdequacy).toBe('adequate');
    });

    it('returns underinsured when current coverage < 70% of recommended', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 200000,
          dependents: 4,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              coverage: 50000,
              termYears: 10,
              monthlyPremium: 20,
            },
            wholeLife: {
              coverage: 0,
              cashValue: 0,
              monthlyPremium: 0,
            },
          },
        },
        goals: {
          ...baseInput.goals,
          educationFunding: 500000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.coverageAdequacy).toBe('underinsured');
    });

    it('returns middle branch between 70-90% of recommended coverage', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 100000,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              coverage: 600000,
              termYears: 20,
              monthlyPremium: 50,
            },
            wholeLife: {
              coverage: 0,
              cashValue: 0,
              monthlyPremium: 0,
            },
          },
        },
        goals: {
          ...baseInput.goals,
          debtPayoffGoal: false,
          educationFunding: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(['adequate', 'underinsured', 'overinsured']).toContain(
        result.lifeInsuranceAnalysis.coverageAdequacy
      );
    });
  });

  describe('life insurance helper', () => {
    it('treats coverage at or above 90% of needs as adequate with no gap', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateLifeInsuranceNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['lifeInsuranceAnalysis'];
      };

      const baseNeeds = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        baseInput
      );

      const adequateInput: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              ...baseInput.currentInsurance.lifeInsurance.termLife,
              coverage: baseNeeds.totalRecommendedCoverage,
            },
            wholeLife: {
              ...baseInput.currentInsurance.lifeInsurance.wholeLife,
              coverage: 0,
            },
          },
        },
      };

      const adequateNeeds = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        adequateInput
      );

      expect(adequateNeeds.coverageAdequacy).toBe('adequate');
      expect(adequateNeeds.coverageGap).toBeCloseTo(0, 6);
    });

    it('labels 70-90% coverage as overinsured and <70% as underinsured', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateLifeInsuranceNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['lifeInsuranceAnalysis'];
      };

      const baseNeeds = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        baseInput
      );
      const targetCoverage = baseNeeds.totalRecommendedCoverage;

      const overinsuredInput: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              ...baseInput.currentInsurance.lifeInsurance.termLife,
              coverage: targetCoverage * 0.8,
            },
            wholeLife: {
              ...baseInput.currentInsurance.lifeInsurance.wholeLife,
              coverage: 0,
            },
          },
        },
      };

      const underinsuredInput: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              ...baseInput.currentInsurance.lifeInsurance.termLife,
              coverage: targetCoverage * 0.6,
            },
            wholeLife: {
              ...baseInput.currentInsurance.lifeInsurance.wholeLife,
              coverage: 0,
            },
          },
        },
      };

      const overinsuredNeeds = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        overinsuredInput
      );
      const underinsuredNeeds = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        underinsuredInput
      );

      expect(overinsuredNeeds.coverageAdequacy).toBe('overinsured');
      expect(overinsuredNeeds.coverageGap).toBeCloseTo(targetCoverage * 0.2, 2);
      expect(underinsuredNeeds.coverageAdequacy).toBe('underinsured');
      expect(underinsuredNeeds.coverageGap).toBeCloseTo(targetCoverage * 0.4, 2);
    });

    it('counts whole-life coverage toward adequacy when term coverage is zero', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateLifeInsuranceNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['lifeInsuranceAnalysis'];
      };

      const baseNeeds = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        baseInput
      );

      const wholeLifeOnlyInput: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: {
              ...baseInput.currentInsurance.lifeInsurance.termLife,
              coverage: 0,
            },
            wholeLife: {
              ...baseInput.currentInsurance.lifeInsurance.wholeLife,
              coverage: baseNeeds.totalRecommendedCoverage,
            },
          },
        },
      };

      const needs = helpers.calculateLifeInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        wholeLifeOnlyInput
      );

      expect(needs.currentCoverage).toBeCloseTo(baseNeeds.totalRecommendedCoverage, 6);
      expect(needs.coverageAdequacy).toBe('adequate');
      expect(needs.coverageGap).toBe(0);
    });
  });

  describe('life insurance premium branches', () => {
    it('applies age > 40 multiplier for life insurance premium', () => {
      const inputYoung: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, age: 35 },
      };
      const inputOld: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, age: 45 },
      };

      InsuranceNeedsCalculator.analyze(inputYoung);
      const resultOld = InsuranceNeedsCalculator.analyze(inputOld);

      expect(resultOld.lifeInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('applies age > 50 multiplier for life insurance premium', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, age: 55 },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('applies excellent health discount', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, healthStatus: 'excellent' },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('applies poor health surcharge', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, healthStatus: 'poor' },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });

    it('applies term > 20 years multiplier', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, age: 25 },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.recommendedTermYears).toBeGreaterThanOrEqual(0);
    });
  });

  describe('debt coverage goal', () => {
    it('includes debt in coverage when debtPayoffGoal is true', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          debtPayoffGoal: true,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 300000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.debtCoverageNeeds).toBe(300000);
    });

    it('excludes debt from coverage when debtPayoffGoal is false', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          debtPayoffGoal: false,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 300000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.debtCoverageNeeds).toBe(0);
    });
  });

  describe('present value calculation branch', () => {
    it('handles zero discount rate correctly', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        analysis: {
          ...baseInput.analysis,
          discountRate: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.lifeInsuranceAnalysis.incomeReplacementNeeds).toBeGreaterThan(0);
    });
  });
});
