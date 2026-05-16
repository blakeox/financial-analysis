/**
 * Long-Term Care Planning MCP Tool
 */

import { LongTermCareCalculator, LongTermCareInputSchema } from '@financial-analysis/analysis';

export class LongTermCareTool {
  static readonly toolName = 'analyze_long_term_care';
  static readonly description =
    'Analyze long-term care insurance needs, compare self-funding vs insurance, assess hybrid strategies, and estimate lifetime care costs';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 40, maximum: 100, description: 'Current age' },
          gender: { type: 'string', enum: ['male', 'female'], description: 'Gender' },
          healthStatus: {
            type: 'string',
            enum: ['excellent', 'good', 'fair', 'poor'],
            description: 'Health status',
          },
        },
        required: ['age', 'gender', 'healthStatus'],
      },
      careNeeds: {
        type: 'object',
        properties: {
          expectedCareStartAge: {
            type: 'number',
            minimum: 65,
            maximum: 100,
            default: 80,
            description: 'Expected care start age',
          },
          expectedCareDuration: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            default: 3,
            description: 'Expected care duration (years)',
          },
          careType: {
            type: 'string',
            enum: ['home-care', 'assisted-living', 'nursing-home', 'mixed'],
            default: 'mixed',
            description: 'Care type',
          },
          annualCareCost: {
            type: 'number',
            minimum: 0,
            default: 100000,
            description: 'Annual care cost',
          },
          careCostInflation: {
            type: 'number',
            minimum: 0,
            maximum: 0.1,
            default: 0.05,
            description: 'Care cost inflation rate',
          },
        },
        required: ['expectedCareStartAge', 'expectedCareDuration', 'annualCareCost'],
      },
      insuranceOptions: {
        type: 'object',
        properties: {
          hasLTCInsurance: { type: 'boolean', default: false, description: 'Has LTC insurance' },
          policyDetails: {
            type: 'object',
            properties: {
              dailyBenefit: { type: 'number', minimum: 0, description: 'Daily benefit amount' },
              benefitPeriod: { type: 'number', minimum: 0, description: 'Benefit period (years)' },
              eliminationPeriod: {
                type: 'number',
                minimum: 0,
                default: 90,
                description: 'Elimination period (days)',
              },
              annualPremium: { type: 'number', minimum: 0, description: 'Annual premium' },
            },
          },
        },
      },
      financialResources: {
        type: 'object',
        properties: {
          currentAssets: { type: 'number', minimum: 0, description: 'Current assets' },
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          expectedRetirementAssets: {
            type: 'number',
            minimum: 0,
            description: 'Expected retirement assets',
          },
        },
        required: ['currentAssets', 'annualIncome'],
      },
      strategy: {
        type: 'object',
        properties: {
          fundingMethod: {
            type: 'string',
            enum: ['self-fund', 'ltc-insurance', 'hybrid', 'medicaid-planning'],
            default: 'hybrid',
            description: 'Funding method',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeProbabilityAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include probability analysis',
          },
          includeScenarioAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include scenario analysis',
          },
          projectionYears: {
            type: 'number',
            minimum: 10,
            maximum: 50,
            default: 30,
            description: 'Projection years',
          },
        },
      },
    },
    required: ['personalInfo', 'careNeeds', 'financialResources'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = LongTermCareInputSchema.parse(args);
    return LongTermCareCalculator.analyze(validated);
  }
}
