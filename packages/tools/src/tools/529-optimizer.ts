/**
 * 529 Plan Optimizer MCP Tool
 */

import {
  FiveTwoNineOptimizer,
  FiveTwoNineOptimizerInputSchema,
} from '@financial-analysis/analysis';

export class FiveTwoNineOptimizerTool {
  static readonly toolName = 'analyze_529_optimizer';
  static readonly description =
    'Optimize 529 plan contributions, compare state plans, analyze financial aid impact, and project education funding';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          stateOfResidence: { type: 'string', description: 'State of residence' },
          filingStatus: {
            type: 'string',
            enum: ['single', 'married-joint', 'married-separate', 'head-of-household'],
            description: 'Filing status',
          },
          stateTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0,
            description: 'State tax rate',
          },
        },
        required: ['stateOfResidence', 'filingStatus'],
      },
      children: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            age: { type: 'number', minimum: 0, maximum: 25, description: 'Child age' },
            yearsUntilCollege: {
              type: 'number',
              minimum: 0,
              maximum: 25,
              description: 'Years until college',
            },
            expectedCollegeCost: {
              type: 'number',
              minimum: 0,
              default: 0,
              description: 'Expected 4-year college cost',
            },
            collegeType: {
              type: 'string',
              enum: ['public-in-state', 'public-out-state', 'private', 'unknown'],
              default: 'public-in-state',
              description: 'College type',
            },
          },
          required: ['age', 'yearsUntilCollege'],
        },
        minItems: 1,
      },
      contributionPlan: {
        type: 'object',
        properties: {
          annualContribution: { type: 'number', minimum: 0, description: 'Annual contribution' },
          contributionIncrease: {
            type: 'number',
            minimum: 0,
            maximum: 0.1,
            default: 0.03,
            description: 'Annual contribution increase',
          },
        },
        required: ['annualContribution'],
      },
      financialAid: {
        type: 'object',
        properties: {
          expectFinancialAid: {
            type: 'boolean',
            default: true,
            description: 'Expect financial aid',
          },
          expectedAidPercentage: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.3,
            description: 'Expected aid percentage',
          },
        },
      },
      strategy: {
        type: 'object',
        properties: {
          optimizeFor: {
            type: 'string',
            enum: ['max-tax-benefit', 'lowest-fees', 'best-investments', 'aid-optimization'],
            default: 'max-tax-benefit',
            description: 'Optimization goal',
          },
          includeMultiStateComparison: {
            type: 'boolean',
            default: true,
            description: 'Include multi-state comparison',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeProjection: { type: 'boolean', default: true, description: 'Include projection' },
          includeShortfallAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include shortfall analysis',
          },
          includeRolloverAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include rollover analysis',
          },
        },
      },
    },
    required: ['personalInfo', 'children', 'contributionPlan'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = FiveTwoNineOptimizerInputSchema.parse(args);
    return FiveTwoNineOptimizer.analyze(validated);
  }
}
