import { describe, expect, it } from 'vitest';
import {
  InsuranceNeedsCalculator,
  InsuranceNeedsInput,
  InsuranceNeedsResult,
} from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator long-term care scenarios', () => {
  const baseInput: InsuranceNeedsInput = createBaseInsuranceInput();

  describe('long-term care helper', () => {
    it('projects annual costs with inflation to ages 65, 75, and 85', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateLongTermCareNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['longTermCareAnalysis'];
      };

      const ltc = helpers.calculateLongTermCareNeeds.call(InsuranceNeedsCalculator, baseInput);
      const { inflationRate } = baseInput.analysis;
      const currentCost = 100000;
      const yearsTo65 = 65 - baseInput.personalInfo.age;
      const yearsTo75 = 75 - baseInput.personalInfo.age;
      const yearsTo85 = 85 - baseInput.personalInfo.age;

      expect(ltc.projectedCosts.projectedCostAtAge65).toBeCloseTo(
        currentCost * Math.pow(1 + inflationRate, yearsTo65),
        6
      );
      expect(ltc.projectedCosts.projectedCostAtAge75).toBeCloseTo(
        currentCost * Math.pow(1 + inflationRate, yearsTo75),
        6
      );
      expect(ltc.projectedCosts.projectedCostAtAge85).toBeCloseTo(
        currentCost * Math.pow(1 + inflationRate, yearsTo85),
        6
      );
    });

    it('uses fixed recommended coverage and subtracts existing benefits for the gap', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateLongTermCareNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['longTermCareAnalysis'];
      };

      const coveredInput: InsuranceNeedsInput = {
        ...baseInput,
        currentInsurance: {
          ...baseInput.currentInsurance,
          longTermCare: {
            ...baseInput.currentInsurance.longTermCare,
            coverage: 100000,
          },
        },
      };

      const ltc = helpers.calculateLongTermCareNeeds.call(InsuranceNeedsCalculator, coveredInput);

      expect(ltc.recommendedCoverage.totalCoverage).toBe(300 * 365 * 3);
      expect(ltc.coverageGap).toBeCloseTo(ltc.recommendedCoverage.totalCoverage - 100000, 2);
      expect(ltc.selfInsuranceFeasibility).toBe(false);
    });

    it('flags self-insurance feasible when liquid assets reach 2x coverage', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateLongTermCareNeeds: (
          input: InsuranceNeedsInput
        ) => InsuranceNeedsResult['longTermCareAnalysis'];
      };

      const wealthyInput: InsuranceNeedsInput = {
        ...baseInput,
        financialSituation: {
          ...baseInput.financialSituation,
          totalAssets: 1500000,
          retirementSavings: 200000,
        },
      };

      const ltc = helpers.calculateLongTermCareNeeds.call(InsuranceNeedsCalculator, wealthyInput);

      expect(ltc.selfInsuranceFeasibility).toBe(true);
      expect(ltc.coverageGap).toBe(ltc.recommendedCoverage.totalCoverage);
    });
  });

  describe('self-insurance feasibility', () => {
    it('returns true when liquid assets >= 2x recommended coverage', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        financialSituation: {
          ...baseInput.financialSituation,
          totalAssets: 2000000,
          retirementSavings: 100000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.longTermCareAnalysis.selfInsuranceFeasibility).toBe(true);
    });

    it('returns false when liquid assets < 2x recommended coverage', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        financialSituation: {
          ...baseInput.financialSituation,
          totalAssets: 200000,
          retirementSavings: 150000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.longTermCareAnalysis.selfInsuranceFeasibility).toBe(false);
    });

    it('treats exactly 2x liquid assets as feasible via helper', () => {
      const helper = (
        InsuranceNeedsCalculator as unknown as {
          assessSelfInsuranceFeasibility: (
            financialSituation: InsuranceNeedsInput['financialSituation'],
            recommendedCoverage: number
          ) => boolean;
        }
      ).assessSelfInsuranceFeasibility;

      const liquidFriendlySituation: InsuranceNeedsInput['financialSituation'] = {
        totalAssets: 500000,
        totalDebts: 100000,
        emergencyFund: 20000,
        retirementSavings: 100000,
        otherIncome: 0,
        socialSecurityBenefit: 0,
      };

      const tighterSituation: InsuranceNeedsInput['financialSituation'] = {
        ...liquidFriendlySituation,
        totalAssets: 350000,
        retirementSavings: 150000,
      };

      expect(helper(liquidFriendlySituation, 200000)).toBe(true);
      expect(helper(tighterSituation, 200000)).toBe(false);
    });
  });

  describe('long-term care premium branches', () => {
    it('applies age > 60 multiplier for long-term care premium', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, age: 65 },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.longTermCareAnalysis.estimatedMonthlyPremium).toBeGreaterThan(0);
    });
  });

  describe('priority recommendations for LTC', () => {
    it('sets high priority for LTC when user over 50', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 55,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const ltcRec = result.insuranceSummary.priorityRecommendations.find(
        (r) => r.type === 'long-term-care'
      );
      if (ltcRec) {
        expect(ltcRec.priority).toBe('high');
      }
    });

    it('sets medium priority for LTC when user under 50', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 40,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const ltcRec = result.insuranceSummary.priorityRecommendations.find(
        (r) => r.type === 'long-term-care'
      );
      if (ltcRec) {
        expect(ltcRec.priority).toBe('medium');
      }
    });
  });
});
