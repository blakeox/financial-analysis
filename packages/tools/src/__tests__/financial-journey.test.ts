import { describe, expect, it } from 'vitest';
import { FinancialJourneyTool } from '../tools/financial-journey';

describe('FinancialJourneyTool', () => {
  const validInput = {
    personalInfo: {
      age: 35,
      maritalStatus: 'married' as const,
      dependents: 2,
      employmentStatus: 'employed' as const,
      annualIncome: 120000,
      monthlyExpenses: 5000,
    },
    currentFinancials: {
      totalAssets: 250000,
      totalDebts: 150000,
      emergencyFund: 15000,
      monthlySavings: 2000,
      creditScore: 750,
    },
    financialGoals: {
      shortTermGoals: [
        {
          id: 'emergency-fund',
          name: 'Build Emergency Fund',
          targetAmount: 30000,
          targetDate: '2025-12-31',
          priority: 'high' as const,
          category: 'emergency' as const,
        },
      ],
      mediumTermGoals: [
        {
          id: 'home-purchase',
          name: 'Buy a Home',
          targetAmount: 100000,
          targetDate: '2028-06-30',
          priority: 'high' as const,
          category: 'home' as const,
        },
      ],
      longTermGoals: [
        {
          id: 'retirement',
          name: 'Retirement Fund',
          targetAmount: 2000000,
          targetDate: '2055-01-01',
          priority: 'high' as const,
          category: 'retirement' as const,
        },
      ],
    },
    journeyStage: 'investment-building' as const,
    analysis: {
      includeCrossModelAnalysis: true,
      includeProgressTracking: true,
      includeMilestoneAnalysis: true,
      includeActionPlan: true,
      includeRiskAssessment: true,
      timeHorizon: 20,
    },
    riskTolerance: {
      investmentRisk: 'moderate' as const,
      debtTolerance: 'medium' as const,
      emergencyTolerance: 'medium' as const,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(FinancialJourneyTool.toolName).toBe('analyze_financial_journey');
    });

    it('has a description', () => {
      expect(FinancialJourneyTool.description).toBeTruthy();
      expect(FinancialJourneyTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = FinancialJourneyTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('personalInfo');
      expect(schema.required).toContain('currentFinancials');
    });
  });

  describe('execute', () => {
    it('performs financial journey analysis', async () => {
      const result = (await FinancialJourneyTool.execute(validInput)) as {
        success: boolean;
        data?: unknown;
        error?: string;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('returns journey stage analysis', async () => {
      const result = (await FinancialJourneyTool.execute(validInput)) as {
        success: boolean;
        data?: {
          journeyOverview?: { currentStage?: string };
        };
      };

      expect(result.success).toBe(true);
      expect(result.data?.journeyOverview).toBeDefined();
    });

    it('includes metadata in response', async () => {
      const result = (await FinancialJourneyTool.execute(validInput)) as {
        success: boolean;
        metadata?: { tool?: string; timestamp?: string };
      };

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.tool).toBe('analyze_financial_journey');
      expect(result.metadata?.timestamp).toBeDefined();
    });

    it('handles missing optional fields with defaults', async () => {
      const minimalInput = {
        personalInfo: {
          age: 30,
          maritalStatus: 'single' as const,
          employmentStatus: 'employed' as const,
          annualIncome: 75000,
          monthlyExpenses: 3000,
        },
        currentFinancials: {
          totalAssets: 50000,
          totalDebts: 20000,
        },
        financialGoals: {
          shortTermGoals: [],
          mediumTermGoals: [],
          longTermGoals: [],
        },
        analysis: {
          includeCrossModelAnalysis: true,
          includeProgressTracking: true,
          includeMilestoneAnalysis: true,
          includeActionPlan: true,
          includeRiskAssessment: true,
          timeHorizon: 20,
        },
        riskTolerance: {
          investmentRisk: 'moderate' as const,
          debtTolerance: 'medium' as const,
          emergencyTolerance: 'medium' as const,
        },
      };

      const result = (await FinancialJourneyTool.execute(minimalInput)) as {
        success: boolean;
        data?: unknown;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const invalidInput = {
        personalInfo: {
          age: 10, // Too young
          maritalStatus: 'married',
          employmentStatus: 'employed',
          annualIncome: 50000,
          monthlyExpenses: 2000,
        },
        currentFinancials: {
          totalAssets: 10000,
          totalDebts: 5000,
        },
      };

      const result = (await FinancialJourneyTool.execute(invalidInput)) as {
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error for missing required fields', async () => {
      const incompleteInput = {
        personalInfo: {
          age: 35,
          // Missing required fields
        },
      };

      const result = (await FinancialJourneyTool.execute(incompleteInput)) as {
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
