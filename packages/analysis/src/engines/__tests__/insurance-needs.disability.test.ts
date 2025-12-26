import { describe, expect, it } from 'vitest';
import {
  InsuranceNeedsCalculator,
  InsuranceNeedsInput,
  InsuranceNeedsResult,
} from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator disability coverage scenarios', () => {
  const baseInput: InsuranceNeedsInput = createBaseInsuranceInput();

  describe('disability insurance helper', () => {
    it('limits long-term benefit period to remaining working years for near retirees', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateDisabilityInsuranceNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['disabilityInsuranceAnalysis'];
      };

      const nearRetirementInput: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 64,
          monthlyExpenses: 4500,
        },
      };

      const needs = helpers.calculateDisabilityInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        nearRetirementInput
      );

      expect(needs.longTermNeeds.benefitPeriod).toBe(1);
      expect(needs.shortTermNeeds.recommendedCoverage).toBe(
        nearRetirementInput.personalInfo.monthlyExpenses * 3
      );
    });

    it('caps benefit period at 20 years and zeroes gap when coverage equals recommendation', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateDisabilityInsuranceNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['disabilityInsuranceAnalysis'];
      };

      const incomeReplacementRatio = 0.6;
      const annualIncome = 90000;
      const recommendedCoverage = annualIncome * incomeReplacementRatio;

      const wellCoveredInput: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 30,
          annualIncome,
          monthlyExpenses: 3500,
        },
        goals: {
          ...baseInput.goals,
          incomeReplacementRatio,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          disabilityInsurance: {
            shortTerm: {
              ...baseInput.currentInsurance.disabilityInsurance.shortTerm,
              coverage: 20000,
            },
            longTerm: {
              ...baseInput.currentInsurance.disabilityInsurance.longTerm,
              coverage: recommendedCoverage - 20000,
            },
          },
        },
      };

      const needs = helpers.calculateDisabilityInsuranceNeeds.call(
        InsuranceNeedsCalculator,
        wellCoveredInput
      );

      expect(needs.recommendedCoverage).toBe(recommendedCoverage);
      expect(needs.longTermNeeds.benefitPeriod).toBe(20);
      expect(needs.coverageGap).toBe(0);
    });
  });

  describe('disability premium branches', () => {
    it('applies high-risk occupation multiplier for disability premium', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          occupation: 'Firefighter',
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.disabilityInsuranceAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });
  });
});
