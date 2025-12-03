import { describe, expect, it } from 'vitest';
import { CollegeSavingsTool } from '../tools/college-savings';

describe('CollegeSavingsTool', () => {
  // Valid input matching CollegeSavingsInputSchema from analysis package
  const validInput = {
    familyInfo: {
      numberOfChildren: 2,
      children: [
        {
          name: 'Alice',
          age: 8,
          expectedCollegeStartAge: 18,
          expectedGraduationAge: 22,
          collegeType: 'public' as const,
          specialNeeds: false,
        },
        {
          name: 'Bob',
          age: 5,
          expectedCollegeStartAge: 18,
          expectedGraduationAge: 22,
          collegeType: 'private' as const,
          specialNeeds: false,
        },
      ],
      stateOfResidence: 'CA',
      maritalStatus: 'married' as const,
    },
    currentSavings: {
      total529Balance: 25000,
      totalCoverdellBalance: 5000,
      totalOtherSavings: 10000,
      monthlyContribution: 500,
    },
    goals: {
      targetCoverage: 0.8,
      riskTolerance: 'moderate' as const,
      investmentStrategy: 'age-based' as const,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(CollegeSavingsTool.toolName).toBe('analyze_college_savings');
    });

    it('has a description', () => {
      expect(CollegeSavingsTool.description).toBeTruthy();
      expect(CollegeSavingsTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = CollegeSavingsTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('familyInfo');
    });
  });

  describe('execute', () => {
    it('performs college savings analysis with valid input', async () => {
      const result = await CollegeSavingsTool.execute(validInput);
      expect(result).toBeDefined();
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { data: unknown }).data).toBeDefined();
    });

    it('returns analysis with timestamp', async () => {
      const result = await CollegeSavingsTool.execute(validInput);
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { timestamp: string }).timestamp).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const invalidInput = {
        familyInfo: {
          numberOfChildren: 1,
          // Missing required children array
        },
      };

      const result = await CollegeSavingsTool.execute(invalidInput);
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });

    it('returns error for empty input', async () => {
      const result = await CollegeSavingsTool.execute({});
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });
  });
});
