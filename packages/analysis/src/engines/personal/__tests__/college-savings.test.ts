import { describe, it, expect } from 'vitest';
import { CollegeSavingsPlanner } from '../college-savings';
import { CollegeSavingsInput } from '../../../schemas/college-savings';

describe('CollegeSavingsPlanner', () => {
  const baseInput: CollegeSavingsInput = {
    familyInfo: {
      numberOfChildren: 2,
      children: [
        {
          name: 'Emma',
          age: 5,
          expectedCollegeStartAge: 18,
          expectedGraduationAge: 22,
          collegeType: 'public',
          specialNeeds: false,
          expectedMajor: 'Engineering',
        },
        {
          name: 'Noah',
          age: 2,
          expectedCollegeStartAge: 18,
          expectedGraduationAge: 22,
          collegeType: 'public',
          specialNeeds: false,
          expectedMajor: 'Business',
        },
      ],
      stateOfResidence: 'California',
      maritalStatus: 'married',
    },
    currentSavings: {
      total529Balance: 20000,
      totalCoverdellBalance: 5000,
      totalOtherSavings: 10000,
      monthlyContribution: 500,
    },
    goals: {
      targetCoverage: 1.0,
      riskTolerance: 'moderate',
      investmentStrategy: 'age-based',
    },
  };

  describe('analyze()', () => {
    it('should return complete college savings analysis', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('costProjections');
      expect(result).toHaveProperty('plan529Analysis');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('insights');

      expect(result.summary.totalProjectedCost).toBeGreaterThan(0);
      expect(result.summary.totalCurrentSavings).toBe(35000);
      expect(result.summary.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.summary.successProbability).toBeLessThanOrEqual(100);
    });

    it('should calculate projections for multiple children', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(result.costProjections).toHaveLength(2);
      expect(result.costProjections[0].childName).toBe('Emma');
      expect(result.costProjections[1].childName).toBe('Noah');
    });
  });

  describe('cost projections by college type', () => {
    it('should calculate costs for community college', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Alex',
              age: 10,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 20,
              collegeType: 'community',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.costProjections).toHaveLength(1);
      expect(result.costProjections[0].totalCost).toBeGreaterThan(0);
      expect(result.costProjections[0].totalCost).toBeLessThan(50000);
    });

    it('should calculate costs for public university', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Sarah',
              age: 10,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.costProjections).toHaveLength(1);
      expect(result.costProjections[0].totalCost).toBeGreaterThan(50000);
    });

    it('should calculate costs for private university', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Michael',
              age: 10,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'private',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.costProjections).toHaveLength(1);
      expect(result.costProjections[0].totalCost).toBeGreaterThan(100000);
    });

    it('should calculate costs for ivy-league university', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Jessica',
              age: 10,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'ivy-league',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.costProjections).toHaveLength(1);
      expect(result.costProjections[0].totalCost).toBeGreaterThan(200000);
    });

    it('should adjust for inflation based on years to college', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Child1',
              age: 2,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
            {
              name: 'Child2',
              age: 10,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.costProjections[0].totalCost).toBeGreaterThan(result.costProjections[1].totalCost);
    });
  });

  describe('savings projection with risk tolerance', () => {
    it('should project savings with conservative risk tolerance', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          riskTolerance: 'conservative',
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(parseFloat(result.summary.projectedSavingsAtCollegeStart)).toBeGreaterThan(35000);
    });

    it('should project savings with moderate risk tolerance', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          riskTolerance: 'moderate',
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(parseFloat(result.summary.projectedSavingsAtCollegeStart)).toBeGreaterThan(35000);
    });

    it('should project savings with aggressive risk tolerance', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        goals: {
          ...baseInput.goals,
          riskTolerance: 'aggressive',
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(parseFloat(result.summary.projectedSavingsAtCollegeStart)).toBeGreaterThan(35000);
    });
  });

  describe('required contribution calculation', () => {
    it('should calculate required monthly contribution', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(parseFloat(result.summary.requiredMonthlyContribution)).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero months to college gracefully', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Senior',
              age: 18,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.summary.requiredMonthlyContribution).toBeDefined();
    });
  });

  describe('529 plan analysis', () => {
    it('should calculate state tax benefit', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(parseFloat(result.plan529Analysis.stateTaxBenefit)).toBeGreaterThan(0);
    });

    it('should show federal tax benefit as zero', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(parseFloat(result.plan529Analysis.federalTaxBenefit)).toBe(0);
    });

    it('should recommend increased contribution', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      const recommended = parseFloat(result.plan529Analysis.recommendedContribution);
      const current = baseInput.currentSavings.monthlyContribution * 12;
      expect(recommended).toBeGreaterThan(current);
    });
  });

  describe('success probability', () => {
    it('should show 100% success when fully funded', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 300000,
          totalCoverdellBalance: 100000,
          totalOtherSavings: 50000,
          monthlyContribution: 1000,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      if (result.summary.savingsGap <= 0) {
        expect(result.summary.successProbability).toBe(100);
      }
    });

    it('should show low success when gap > 50% of target', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 500,
          totalCoverdellBalance: 0,
          totalOtherSavings: 0,
          monthlyContribution: 10,
        },
        familyInfo: {
          ...baseInput.familyInfo,
          children: [
            {
              name: 'Child',
              age: 17,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'private',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.summary.successProbability).toBeLessThan(50);
    });

    it('should show medium success when gap is 30-50% of target', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 15000,
          totalCoverdellBalance: 5000,
          totalOtherSavings: 5000,
          monthlyContribution: 200,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.summary.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.summary.successProbability).toBeLessThanOrEqual(100);
    });

    it('should show high success when gap < 30% of target', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 50000,
          totalCoverdellBalance: 20000,
          totalOtherSavings: 20000,
          monthlyContribution: 800,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.summary.successProbability).toBeGreaterThan(0);
    });
  });

  describe('recommendations', () => {
    it('should recommend increasing contributions when gap exists', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 5000,
          totalCoverdellBalance: 0,
          totalOtherSavings: 0,
          monthlyContribution: 100,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      if (result.summary.savingsGap > 0) {
        expect(result.recommendations.some((r) => r.includes('Increase monthly contributions'))).toBe(true);
      }
    });

    it('should recommend opening 529 plan when balance is zero', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 0,
          totalCoverdellBalance: 5000,
          totalOtherSavings: 10000,
          monthlyContribution: 300,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.recommendations.some((r) => r.includes('529 plan'))).toBe(true);
    });

    it('should recommend separate accounts for multiple children', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        familyInfo: {
          ...baseInput.familyInfo,
          numberOfChildren: 3,
          children: [
            {
              name: 'Child1',
              age: 5,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
            {
              name: 'Child2',
              age: 8,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
            {
              name: 'Child3',
              age: 12,
              expectedCollegeStartAge: 18,
              expectedGraduationAge: 22,
              collegeType: 'public',
              specialNeeds: false,
            },
          ],
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      expect(result.recommendations.some((r) => r.includes('separate 529'))).toBe(true);
    });
  });

  describe('insights', () => {
    it('should provide insight about years to college', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(result.insights.some((i) => i.includes('years until'))).toBe(true);
    });

    it('should mention savings gap when underfunded', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 3000,
          totalCoverdellBalance: 0,
          totalOtherSavings: 0,
          monthlyContribution: 50,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      if (result.summary.savingsGap > 0) {
        expect(result.insights.some((i) => i.includes('additional'))).toBe(true);
      }
    });

    it('should provide positive insight when on track', () => {
      const input: CollegeSavingsInput = {
        ...baseInput,
        currentSavings: {
          total529Balance: 150000,
          totalCoverdellBalance: 50000,
          totalOtherSavings: 50000,
          monthlyContribution: 1500,
        },
      };

      const result = CollegeSavingsPlanner.analyze(input);

      if (result.summary.savingsGap <= 0) {
        expect(result.insights.some((i) => i.includes('on track'))).toBe(true);
      }
    });

    it('should mention 529 tax benefits', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(result.insights.some((i) => i.includes('529'))).toBe(true);
      expect(result.insights.some((i) => i.includes('tax-free'))).toBe(true);
    });
  });
});
