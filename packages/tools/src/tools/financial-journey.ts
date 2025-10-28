/**
 * Financial Journey MCP Tool
 * Wrapper for FinancialJourneyAnalysisEngine to provide MCP integration
 */

import {
  FinancialJourneyAnalysisEngine,
  FinancialJourneyInputSchema,
} from '@financial-analysis/analysis';

export class FinancialJourneyTool {
  static readonly toolName = 'analyze_financial_journey';
  static readonly description =
    'Multi-stage financial journey analysis including cross-model analysis, progress tracking, milestone analysis, personalized action plans, and journey-based recommendations';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed'],
            description: 'Marital status',
          },
          dependents: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            default: 0,
            description: 'Number of dependents',
          },
          employmentStatus: {
            type: 'string',
            enum: ['employed', 'self-employed', 'unemployed', 'retired'],
            description: 'Employment status',
          },
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          monthlyExpenses: { type: 'number', minimum: 0, description: 'Monthly expenses' },
        },
        required: ['age', 'maritalStatus', 'employmentStatus', 'annualIncome', 'monthlyExpenses'],
      },
      currentFinancials: {
        type: 'object',
        properties: {
          totalAssets: { type: 'number', minimum: 0, description: 'Total assets' },
          totalDebts: { type: 'number', minimum: 0, description: 'Total debts' },
          emergencyFund: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Emergency fund amount',
          },
          monthlySavings: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Monthly savings amount',
          },
          creditScore: { type: 'number', minimum: 300, maximum: 850, description: 'Credit score' },
        },
        required: ['totalAssets', 'totalDebts'],
      },
      financialGoals: {
        type: 'object',
        properties: {
          shortTermGoals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                targetAmount: { type: 'number', minimum: 0 },
                targetDate: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                category: {
                  type: 'string',
                  enum: ['emergency', 'debt', 'savings', 'purchase', 'other'],
                },
              },
              required: ['id', 'name', 'targetAmount', 'targetDate', 'priority', 'category'],
            },
            default: [],
          },
          mediumTermGoals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                targetAmount: { type: 'number', minimum: 0 },
                targetDate: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                category: {
                  type: 'string',
                  enum: ['home', 'education', 'vehicle', 'business', 'other'],
                },
              },
              required: ['id', 'name', 'targetAmount', 'targetDate', 'priority', 'category'],
            },
            default: [],
          },
          longTermGoals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                targetAmount: { type: 'number', minimum: 0 },
                targetDate: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                category: {
                  type: 'string',
                  enum: ['retirement', 'legacy', 'financial-independence', 'other'],
                },
              },
              required: ['id', 'name', 'targetAmount', 'targetDate', 'priority', 'category'],
            },
            default: [],
          },
        },
      },
      journeyStage: {
        type: 'string',
        enum: [
          'getting-started',
          'debt-management',
          'emergency-funding',
          'home-buying',
          'investment-building',
          'retirement-planning',
          'wealth-preservation',
          'legacy-planning',
        ],
        default: 'getting-started',
        description: 'Current financial journey stage',
      },
      analysis: {
        type: 'object',
        properties: {
          includeCrossModelAnalysis: { type: 'boolean', default: true },
          includeProgressTracking: { type: 'boolean', default: true },
          includeMilestoneAnalysis: { type: 'boolean', default: true },
          includeActionPlan: { type: 'boolean', default: true },
          includeRiskAssessment: { type: 'boolean', default: true },
          timeHorizon: {
            type: 'number',
            minimum: 1,
            maximum: 50,
            default: 20,
            description: 'Analysis time horizon in years',
          },
        },
      },
      riskTolerance: {
        type: 'object',
        properties: {
          investmentRisk: {
            type: 'string',
            enum: ['conservative', 'moderate', 'aggressive'],
            default: 'moderate',
          },
          debtTolerance: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
          emergencyTolerance: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium',
          },
        },
      },
    },
    required: ['personalInfo', 'currentFinancials'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input
      const validatedInput = FinancialJourneyInputSchema.parse(input);

      // Perform analysis
      const result = FinancialJourneyAnalysisEngine.analyze(validatedInput);

      return {
        success: true,
        data: result,
        metadata: {
          tool: FinancialJourneyTool.toolName,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          tool: FinancialJourneyTool.toolName,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
