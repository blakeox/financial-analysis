import { describe, it, expect } from 'vitest';
import { CollegeSavingsPlanner } from '../college-savings';
import { CollegeSavingsInput } from '../../../schemas/college-savings';

describe('CollegeSavingsPlanner', () => {
  const baseInput: CollegeSavingsInput = {
    familyInfo: {
      numberOfChildren: 1,
      children: [
        {
          name: 'Child 1',
          age: 5,
          expectedCollegeStartAge: 18,
          expectedGraduationAge: 22,
          collegeType: 'public',
          specialNeeds: false,
        },
      ],
      stateOfResidence: 'CA',
      maritalStatus: 'married',
    },
    currentSavings: {
      total529Balance: 10000,
      totalCoverdellBalance: 0,
      totalOtherSavings: 5000,
      monthlyContribution: 500,
    },
    goals: {
      targetCoverage: 1,
      riskTolerance: 'moderate',
      investmentStrategy: 'age-based',
    },
  };

  it('should calculate college savings plan correctly', () => {
    const result = CollegeSavingsPlanner.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.savingsGap).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = CollegeSavingsPlanner.analyze(baseInput);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('savingsGap');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('plan529Analysis');
    });
  });
});
