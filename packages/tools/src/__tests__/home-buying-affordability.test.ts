import { describe, expect, it } from 'vitest';
import { HomeBuyingAffordabilityTool } from '../tools/home-buying-affordability';

describe('HomeBuyingAffordabilityTool', () => {
  // Valid input matching HomeBuyingAffordabilityInputSchema from analysis package
  const validInput = {
    personalInfo: {
      age: 32,
      maritalStatus: 'married' as const,
      dependents: 1,
      employmentStatus: 'employed' as const,
      yearsEmployed: 5,
      creditScore: 750,
    },
    finances: {
      annualIncome: 120000,
      monthlyDebtPayments: 500,
      downPaymentAvailable: 60000,
      emergencyFund: 20000,
      otherAssets: 15000,
    },
    homePreferences: {
      targetPrice: 450000,
      location: 'Austin, TX',
      homeType: 'single-family' as const,
      mustHaves: ['3 bedrooms', 'garage'],
      niceToHaves: ['pool', 'home office'],
    },
    goals: {
      timeline: 2,
      riskTolerance: 'moderate' as const,
      priority: 'affordability' as const,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(HomeBuyingAffordabilityTool.toolName).toBe('analyze_home_buying_affordability');
    });

    it('has a description', () => {
      expect(HomeBuyingAffordabilityTool.description).toBeTruthy();
      expect(HomeBuyingAffordabilityTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = HomeBuyingAffordabilityTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('personalInfo');
      expect(schema.required).toContain('financialSituation');
    });
  });

  describe('execute', () => {
    it('performs home buying affordability analysis with valid input', async () => {
      const result = await HomeBuyingAffordabilityTool.execute(validInput);
      expect(result).toBeDefined();
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { data: unknown }).data).toBeDefined();
    });

    it('returns analysis with timestamp', async () => {
      const result = await HomeBuyingAffordabilityTool.execute(validInput);
      expect((result as { success: boolean }).success).toBe(true);
      expect((result as { timestamp: string }).timestamp).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const invalidInput = {
        personalInfo: {
          age: 32,
          // Missing required fields
        },
      };

      const result = await HomeBuyingAffordabilityTool.execute(invalidInput);
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });

    it('returns error for empty input', async () => {
      const result = await HomeBuyingAffordabilityTool.execute({});
      expect((result as { success: boolean }).success).toBe(false);
      expect((result as { error: string }).error).toBeDefined();
    });
  });
});
