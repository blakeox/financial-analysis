import { describe, expect, it } from 'vitest';
import { InsuranceNeedsCalculator, InsuranceNeedsInput } from '../insurance-needs';
import { createBaseInsuranceInput } from './fixtures/insurance-needs';

describe('InsuranceNeedsCalculator helper utilities', () => {
  const baseInput = createBaseInsuranceInput();

  describe('present value helper', () => {
    it('falls back to a simple product when discount rate is zero', () => {
      const calculatePresentValue = (InsuranceNeedsCalculator as unknown as {
        calculatePresentValue: (annualAmount: number, years: number, discountRate: number) => number;
      }).calculatePresentValue;

      const result = calculatePresentValue(40000, 10, 0);
      expect(result).toBe(400000);
    });

    it('discounts future income when a positive rate is supplied', () => {
      const calculatePresentValue = (InsuranceNeedsCalculator as unknown as {
        calculatePresentValue: (annualAmount: number, years: number, discountRate: number) => number;
      }).calculatePresentValue;

      const annualAmount = 60000;
      const years = 8;
      const discountRate = 0.04;

      const result = calculatePresentValue(annualAmount, years, discountRate);
      const manual = (annualAmount * (1 - Math.pow(1 + discountRate, -years))) / discountRate;

      expect(result).toBeCloseTo(manual, 6);
    });
  });

  describe('human life value helper', () => {
    it('discounts earnings through age 65 using a 5% rate', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateHumanLifeValue: (personalInfo: InsuranceNeedsInput['personalInfo']) => number;
      };

      const personalInfo = { ...baseInput.personalInfo, age: 40, annualIncome: 120000 };
      const yearsToRetirement = 25;
      const manual =
        (personalInfo.annualIncome * (1 - Math.pow(1 + 0.05, -yearsToRetirement))) / 0.05;

      const result = helpers.calculateHumanLifeValue.call(InsuranceNeedsCalculator, personalInfo);
      expect(result).toBeCloseTo(manual, 6);
    });

    it('returns zero when already beyond retirement age', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateHumanLifeValue: (personalInfo: InsuranceNeedsInput['personalInfo']) => number;
      };

      const personalInfo = { ...baseInput.personalInfo, age: 70 };
      const result = helpers.calculateHumanLifeValue.call(InsuranceNeedsCalculator, personalInfo);
      expect(result).toBe(0);
    });
  });

  describe('income replacement helper', () => {
    it('applies the income replacement ratio and discount rate', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateIncomeReplacementNeeds: (
          personalInfo: InsuranceNeedsInput['personalInfo'],
          goals: InsuranceNeedsInput['goals'],
          analysis: InsuranceNeedsInput['analysis']
        ) => number;
      };

      const personalInfo = { ...baseInput.personalInfo, age: 35, annualIncome: 90000 };
      const goals = { ...baseInput.goals, incomeReplacementRatio: 0.6 };
      const analysis = { ...baseInput.analysis, discountRate: 0.04 };
      const yearsToRetirement = 30;
      const replacementIncome = personalInfo.annualIncome * goals.incomeReplacementRatio;
      const manual =
        (replacementIncome * (1 - Math.pow(1 + analysis.discountRate, -yearsToRetirement))) /
        analysis.discountRate;

      const result = helpers.calculateIncomeReplacementNeeds.call(
        InsuranceNeedsCalculator,
        personalInfo,
        goals,
        analysis
      );
      expect(result).toBeCloseTo(manual, 6);
    });

    it('drops to zero when no working years remain', () => {
      const helpers = InsuranceNeedsCalculator as unknown as {
        calculateIncomeReplacementNeeds: (
          personalInfo: InsuranceNeedsInput['personalInfo'],
          goals: InsuranceNeedsInput['goals'],
          analysis: InsuranceNeedsInput['analysis']
        ) => number;
      };

      const personalInfo = { ...baseInput.personalInfo, age: 70 };
      const result = helpers.calculateIncomeReplacementNeeds.call(
        InsuranceNeedsCalculator,
        personalInfo,
        baseInput.goals,
        baseInput.analysis
      );
      expect(result).toBe(0);
    });
  });

  describe('projected cost helper', () => {
    it('applies inflation compounding between current and target ages', () => {
      const calculateProjectedCost = (InsuranceNeedsCalculator as unknown as {
        calculateProjectedCost: (
          currentCost: number,
          currentAge: number,
          targetAge: number,
          inflationRate: number
        ) => number;
      }).calculateProjectedCost;

      const cost = calculateProjectedCost(100000, 40, 50, 0.03);
      expect(cost).toBeCloseTo(100000 * Math.pow(1.03, 10), 6);
    });

    it('returns the same cost when target age equals current age', () => {
      const calculateProjectedCost = (InsuranceNeedsCalculator as unknown as {
        calculateProjectedCost: (
          currentCost: number,
          currentAge: number,
          targetAge: number,
          inflationRate: number
        ) => number;
      }).calculateProjectedCost;

      expect(calculateProjectedCost(75000, 55, 55, 0.04)).toBe(75000);
    });
  });

  describe('recommended term years helper', () => {
    it('limits term to the smallest of retirement horizon, child horizon, and 30 years', () => {
      const calculateRecommendedTermYears = (InsuranceNeedsCalculator as unknown as {
        calculateRecommendedTermYears: (
          personalInfo: InsuranceNeedsInput['personalInfo']
        ) => number;
      }).calculateRecommendedTermYears;

      const youngTerm = calculateRecommendedTermYears({ ...baseInput.personalInfo, age: 20 });
      expect(youngTerm).toBe(5);

      const midTerm = calculateRecommendedTermYears({ ...baseInput.personalInfo, age: 30 });
      expect(midTerm).toBe(0);

      const nearRetirement = calculateRecommendedTermYears({ ...baseInput.personalInfo, age: 60 });
      expect(nearRetirement).toBe(0);
    });
  });

  describe('affordability helper', () => {
    it('classifies affordability as stretch for premium ratios between 5–10%', () => {
      const assessAffordability = (InsuranceNeedsCalculator as unknown as {
        assessAffordability: (monthlyPremiums: number, annualIncome: number) =>
          'affordable' | 'stretch' | 'unaffordable';
      }).assessAffordability;

      const result = assessAffordability(260, 60000);
      expect(result).toBe('stretch');
    });

    it('marks exactly 5% premium ratio as affordable via helper', () => {
      const assessAffordability = (InsuranceNeedsCalculator as unknown as {
        assessAffordability: typeof InsuranceNeedsCalculator['assessAffordability'];
      }).assessAffordability;

      expect(assessAffordability(250, 60000)).toBe('affordable');
    });

    it('marks exactly 10% premium ratio as stretch and above as unaffordable', () => {
      const assessAffordability = (InsuranceNeedsCalculator as unknown as {
        assessAffordability: typeof InsuranceNeedsCalculator['assessAffordability'];
      }).assessAffordability;

      expect(assessAffordability(500, 60000)).toBe('stretch');
      expect(assessAffordability(520, 60000)).toBe('unaffordable');
    });
  });

  describe('premium estimator helpers', () => {
    it('directly discounts excellent health and surcharges poor health via helper', () => {
      const estimator = (InsuranceNeedsCalculator as unknown as {
        estimateLifeInsurancePremium: typeof InsuranceNeedsCalculator['estimateLifeInsurancePremium'];
      }).estimateLifeInsurancePremium;

      const coverage = 500000;
      const termYears = 20;

      const excellent = estimator.call(InsuranceNeedsCalculator, coverage, 35, 'excellent', termYears);
      const standard = estimator.call(InsuranceNeedsCalculator, coverage, 35, 'good', termYears);
      const poor = estimator.call(InsuranceNeedsCalculator, coverage, 35, 'poor', termYears);

      expect(excellent).toBeLessThan(standard);
      expect(poor).toBeGreaterThan(standard);
      expect(poor / standard).toBeCloseTo(2, 5);
    });

    it('applies the long-term multiplier when term years exceed 20 via helper', () => {
      const estimateLifeInsurancePremium = (InsuranceNeedsCalculator as unknown as {
        estimateLifeInsurancePremium: (
          coverage: number,
          age: number,
          healthStatus: string,
          termYears: number
        ) => number;
      }).estimateLifeInsurancePremium;

      const basePremium = estimateLifeInsurancePremium(100000, 30, 'good', 10);
      const longTermPremium = estimateLifeInsurancePremium(100000, 30, 'good', 25);

      expect(longTermPremium).toBeGreaterThan(basePremium);
      expect(longTermPremium).toBeCloseTo(basePremium * 1.2, 5);
    });

    it('charges more for high-risk occupations on disability coverage', () => {
      const estimator = (InsuranceNeedsCalculator as unknown as {
        estimateDisabilityInsurancePremium: typeof InsuranceNeedsCalculator['estimateDisabilityInsurancePremium'];
      }).estimateDisabilityInsurancePremium;

      const basePremium = estimator.call(InsuranceNeedsCalculator, 60000, 40, 'Accountant', 'good');
      const highRiskPremium = estimator.call(
        InsuranceNeedsCalculator,
        60000,
        40,
        'Firefighter',
        'good'
      );

      expect(highRiskPremium).toBeGreaterThan(basePremium);
      expect(highRiskPremium / basePremium).toBeGreaterThan(1.9);
    });

    it('applies age multipliers for disability premiums via helper', () => {
      const estimator = (InsuranceNeedsCalculator as unknown as {
        estimateDisabilityInsurancePremium: typeof InsuranceNeedsCalculator['estimateDisabilityInsurancePremium'];
      }).estimateDisabilityInsurancePremium;

      const coverage = 60000;
      const young = estimator.call(InsuranceNeedsCalculator, coverage, 35, 'Accountant', 'good');
      const older = estimator.call(InsuranceNeedsCalculator, coverage, 55, 'Accountant', 'good');

      expect(older).toBeGreaterThan(young);
      expect(older / young).toBeCloseTo(2.34, 2);
    });

    it('adjusts disability premiums for health quality', () => {
      const estimator = (InsuranceNeedsCalculator as unknown as {
        estimateDisabilityInsurancePremium: typeof InsuranceNeedsCalculator['estimateDisabilityInsurancePremium'];
      }).estimateDisabilityInsurancePremium;

      const coverage = 80000;
      const excellent = estimator.call(
        InsuranceNeedsCalculator,
        coverage,
        40,
        'Accountant',
        'excellent'
      );
      const poor = estimator.call(InsuranceNeedsCalculator, coverage, 40, 'Accountant', 'poor');

      expect(excellent).toBeLessThan(poor);
      expect(poor / excellent).toBeCloseTo(1.5 / 0.8, 2);
    });

    it('raises long-term care premiums for older clients with poor health', () => {
      const estimator = (InsuranceNeedsCalculator as unknown as {
        estimateLongTermCarePremium: typeof InsuranceNeedsCalculator['estimateLongTermCarePremium'];
      }).estimateLongTermCarePremium;

      const basePremium = estimator.call(InsuranceNeedsCalculator, 300, 3, 50, 'good');
      const highRiskPremium = estimator.call(InsuranceNeedsCalculator, 300, 3, 65, 'poor');

      expect(highRiskPremium).toBeGreaterThan(basePremium);
      expect(highRiskPremium / basePremium).toBeGreaterThan(3);
    });

    it('isolates health impact on long-term care premiums via helper', () => {
      const estimator = (InsuranceNeedsCalculator as unknown as {
        estimateLongTermCarePremium: typeof InsuranceNeedsCalculator['estimateLongTermCarePremium'];
      }).estimateLongTermCarePremium;

      const age = 55;
      const excellent = estimator.call(InsuranceNeedsCalculator, 250, 3, age, 'excellent');
      const poor = estimator.call(InsuranceNeedsCalculator, 250, 3, age, 'poor');

      expect(excellent).toBeLessThan(poor);
      expect(poor / excellent).toBeCloseTo(1.875, 3);
    });
  });
});
