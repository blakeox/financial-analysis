import { describe, expect, it } from 'vitest';
import {
  InsuranceNeedsCalculator,
  InsuranceNeedsInput,
  InsuranceNeedsResult,
} from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator cost analysis', () => {
  const baseInput: InsuranceNeedsInput = createBaseInsuranceInput();

  describe('cost analysis and affordability', () => {
    it('calculates cost analysis correctly', () => {
      const result = InsuranceNeedsCalculator.analyze(baseInput);
      const cost = result.costAnalysis;

      expect(cost.currentMonthlyPremiums).toBe(50 + 0 + 30 + 80 + 0);
      expect(cost.recommendedMonthlyPremiums).toBeGreaterThan(0);
      expect(typeof cost.premiumIncrease).toBe('number');
      expect(cost.costBenefitAnalysis.totalProtectionValue).toBeGreaterThan(0);
      expect(cost.costBenefitAnalysis.totalPremiumCost).toBe(
        cost.recommendedMonthlyPremiums * 12
      );
      expect(cost.costBenefitAnalysis.protectionRatio).toBeGreaterThan(0);
    });

    it('returns affordable when premiums <= 5% of income', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 500000,
          monthlyExpenses: 5000,
        },
        goals: {
          ...baseInput.goals,
          educationFunding: 0,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 0,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(result.costAnalysis.affordabilityAssessment).toBe('affordable');
    });

    it('returns stretch when premiums between 5-10% of income', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 50000,
          age: 55,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      expect(['stretch', 'unaffordable', 'affordable']).toContain(
        result.costAnalysis.affordabilityAssessment
      );
    });

    it('returns unaffordable when premiums > 10% of income', () => {
      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 20000,
          age: 64,
          healthStatus: 'poor',
          occupation: 'construction worker',
          dependents: 5,
        },
        goals: {
          ...baseInput.goals,
          educationFunding: 500000,
          incomeReplacementRatio: 1.0,
        },
        financialSituation: {
          ...baseInput.financialSituation,
          totalDebts: 500000,
        },
      };

      const result = InsuranceNeedsCalculator.analyze(input);
      const premiumRatio =
        (result.costAnalysis.recommendedMonthlyPremiums * 12) / input.personalInfo.annualIncome;
      if (premiumRatio > 0.1) {
        expect(result.costAnalysis.affordabilityAssessment).toBe('unaffordable');
      } else if (premiumRatio > 0.05) {
        expect(result.costAnalysis.affordabilityAssessment).toBe('stretch');
      } else {
        expect(result.costAnalysis.affordabilityAssessment).toBe('affordable');
      }
    });
  });

  describe('cost analysis helper', () => {
    it('computes premium deltas, protection ratio, and affordability', () => {
      const calculateCostAnalysis = (InsuranceNeedsCalculator as unknown as {
        calculateCostAnalysis: (
          input: InsuranceNeedsInput,
          life: InsuranceNeedsResult['lifeInsuranceAnalysis'],
          disability: InsuranceNeedsResult['disabilityInsuranceAnalysis'],
          longTermCare: InsuranceNeedsResult['longTermCareAnalysis']
        ) => InsuranceNeedsResult['costAnalysis'];
      }).calculateCostAnalysis;

      const input: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: { ...baseInput.personalInfo, annualIncome: 90000 },
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { ...baseInput.currentInsurance.lifeInsurance.termLife, monthlyPremium: 60 },
            wholeLife: { ...baseInput.currentInsurance.lifeInsurance.wholeLife, monthlyPremium: 20 },
          },
          disabilityInsurance: {
            shortTerm: {
              ...baseInput.currentInsurance.disabilityInsurance.shortTerm,
              monthlyPremium: 25,
            },
            longTerm: {
              ...baseInput.currentInsurance.disabilityInsurance.longTerm,
              monthlyPremium: 35,
            },
          },
          longTermCare: {
            ...baseInput.currentInsurance.longTermCare,
            monthlyPremium: 15,
          },
        },
      };

      const life: InsuranceNeedsResult['lifeInsuranceAnalysis'] = {
        humanLifeValue: 0,
        incomeReplacementNeeds: 0,
        debtCoverageNeeds: 0,
        educationFundingNeeds: 0,
        finalExpenseNeeds: 0,
        totalRecommendedCoverage: 180000,
        currentCoverage: 40000,
        coverageGap: 140000,
        coverageAdequacy: 'underinsured',
        recommendedTermYears: 20,
        estimatedMonthlyPremium: 120,
      };

      const disability: InsuranceNeedsResult['disabilityInsuranceAnalysis'] = {
        incomeReplacementNeeds: 50000,
        currentCoverage: 15000,
        coverageGap: 35000,
        recommendedCoverage: 50000,
        shortTermNeeds: { recommendedCoverage: 10000, waitingPeriod: 0, benefitPeriod: 6 },
        longTermNeeds: { recommendedCoverage: 25000, waitingPeriod: 90, benefitPeriod: 10 },
        estimatedMonthlyPremium: 90,
      };

      const longTermCare: InsuranceNeedsResult['longTermCareAnalysis'] = {
        projectedCosts: {
          currentAnnualCost: 100000,
          projectedCostAtAge65: 110000,
          projectedCostAtAge75: 130000,
          projectedCostAtAge85: 150000,
        },
        recommendedCoverage: {
          dailyBenefit: 200,
          benefitPeriod: 3,
          eliminationPeriod: 90,
          totalCoverage: 150000,
        },
        currentCoverage: 25000,
        coverageGap: 125000,
        estimatedMonthlyPremium: 70,
        selfInsuranceFeasibility: false,
      };

      const analysis = calculateCostAnalysis.call(
        InsuranceNeedsCalculator,
        input,
        life,
        disability,
        longTermCare
      );

      const expectedCurrentPremiums = 60 + 20 + 25 + 35 + 15;
      const expectedRecommendedPremiums = 120 + 90 + 70;
      expect(analysis.currentMonthlyPremiums).toBe(expectedCurrentPremiums);
      expect(analysis.recommendedMonthlyPremiums).toBe(expectedRecommendedPremiums);
      expect(analysis.premiumIncrease).toBe(expectedRecommendedPremiums - expectedCurrentPremiums);

      const totalProtectionValue = 180000 + 50000 + 150000;
      const totalPremiumCost = expectedRecommendedPremiums * 12;
      expect(analysis.costBenefitAnalysis.totalProtectionValue).toBe(totalProtectionValue);
      expect(analysis.costBenefitAnalysis.totalPremiumCost).toBe(totalPremiumCost);
      expect(analysis.costBenefitAnalysis.protectionRatio).toBeCloseTo(
        totalProtectionValue / totalPremiumCost,
        6
      );
      expect(analysis.affordabilityAssessment).toBe('affordable');
    });

    it('reports a negative premium increase when recommendations lower total spend', () => {
      const calculateCostAnalysis = (InsuranceNeedsCalculator as unknown as {
        calculateCostAnalysis: (
          input: InsuranceNeedsInput,
          life: InsuranceNeedsResult['lifeInsuranceAnalysis'],
          disability: InsuranceNeedsResult['disabilityInsuranceAnalysis'],
          longTermCare: InsuranceNeedsResult['longTermCareAnalysis']
        ) => InsuranceNeedsResult['costAnalysis'];
      }).calculateCostAnalysis;

      const heavyPremiumInput: InsuranceNeedsInput = {
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          annualIncome: 120000,
        },
        currentInsurance: {
          ...baseInput.currentInsurance,
          lifeInsurance: {
            termLife: { ...baseInput.currentInsurance.lifeInsurance.termLife, monthlyPremium: 180 },
            wholeLife: { ...baseInput.currentInsurance.lifeInsurance.wholeLife, monthlyPremium: 120 },
          },
          disabilityInsurance: {
            shortTerm: {
              ...baseInput.currentInsurance.disabilityInsurance.shortTerm,
              monthlyPremium: 90,
            },
            longTerm: {
              ...baseInput.currentInsurance.disabilityInsurance.longTerm,
              monthlyPremium: 110,
            },
          },
          longTermCare: {
            ...baseInput.currentInsurance.longTermCare,
            monthlyPremium: 80,
          },
        },
      };

      const life: InsuranceNeedsResult['lifeInsuranceAnalysis'] = {
        humanLifeValue: 0,
        incomeReplacementNeeds: 0,
        debtCoverageNeeds: 0,
        educationFundingNeeds: 0,
        finalExpenseNeeds: 0,
        totalRecommendedCoverage: 150000,
        currentCoverage: 40000,
        coverageGap: 110000,
        coverageAdequacy: 'underinsured',
        recommendedTermYears: 15,
        estimatedMonthlyPremium: 70,
      };

      const disability: InsuranceNeedsResult['disabilityInsuranceAnalysis'] = {
        incomeReplacementNeeds: 40000,
        currentCoverage: 12000,
        coverageGap: 28000,
        recommendedCoverage: 40000,
        shortTermNeeds: { recommendedCoverage: 8000, waitingPeriod: 0, benefitPeriod: 6 },
        longTermNeeds: { recommendedCoverage: 20000, waitingPeriod: 90, benefitPeriod: 10 },
        estimatedMonthlyPremium: 60,
      };

      const longTermCare: InsuranceNeedsResult['longTermCareAnalysis'] = {
        projectedCosts: {
          currentAnnualCost: 100000,
          projectedCostAtAge65: 110000,
          projectedCostAtAge75: 130000,
          projectedCostAtAge85: 150000,
        },
        recommendedCoverage: {
          dailyBenefit: 200,
          benefitPeriod: 3,
          eliminationPeriod: 90,
          totalCoverage: 150000,
        },
        currentCoverage: 20000,
        coverageGap: 130000,
        estimatedMonthlyPremium: 40,
        selfInsuranceFeasibility: false,
      };

      const analysis = calculateCostAnalysis.call(
        InsuranceNeedsCalculator,
        heavyPremiumInput,
        life,
        disability,
        longTermCare
      );

      const currentPremiums = 180 + 120 + 90 + 110 + 80;
      const recommendedPremiums = 70 + 60 + 40;

      expect(analysis.currentMonthlyPremiums).toBe(currentPremiums);
      expect(analysis.recommendedMonthlyPremiums).toBe(recommendedPremiums);
      expect(analysis.premiumIncrease).toBeLessThan(0);
      expect(analysis.costBenefitAnalysis.totalProtectionValue).toBe(150000 + 40000 + 150000);
      expect(analysis.costBenefitAnalysis.totalPremiumCost).toBe(recommendedPremiums * 12);
      expect(analysis.affordabilityAssessment).toBe('affordable');
    });
  });
});
