/**
 * Social Security Optimizer MCP Tool
 */

import { SocialSecurityInputSchema, SocialSecurityOptimizer } from '@financial-analysis/analysis';

export class SocialSecurityTool {
  static readonly toolName = 'analyze_social_security';
  static readonly description =
    'Optimize Social Security claiming strategy with break-even analysis, spousal benefits, survivor benefits, and lifetime benefit projections';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          birthDate: { type: 'string', description: 'Birth date (ISO format)' },
          currentAge: { type: 'number', minimum: 62, maximum: 70, description: 'Current age' },
          fullRetirementAge: {
            type: 'number',
            minimum: 66,
            maximum: 67,
            description: 'Full retirement age',
          },
          lifeExpectancy: {
            type: 'number',
            minimum: 70,
            maximum: 100,
            default: 85,
            description: 'Life expectancy',
          },
        },
        required: ['birthDate', 'currentAge', 'fullRetirementAge'],
      },
      earnings: {
        type: 'object',
        properties: {
          currentAnnualEarnings: {
            type: 'number',
            minimum: 0,
            description: 'Current annual earnings',
          },
          averageLifetimeEarnings: {
            type: 'number',
            minimum: 0,
            description: 'Average lifetime earnings',
          },
        },
        required: ['currentAnnualEarnings'],
      },
      maritalStatus: {
        type: 'string',
        enum: ['single', 'married', 'divorced', 'widowed'],
        description: 'Marital status',
      },
      claimingStrategy: {
        type: 'object',
        properties: {
          primaryClaimingAge: {
            type: 'number',
            minimum: 62,
            maximum: 70,
            description: 'Primary claiming age',
          },
        },
        required: ['primaryClaimingAge'],
      },
      goals: {
        type: 'object',
        properties: {
          optimizeFor: {
            type: 'string',
            enum: ['maximum-lifetime', 'maximum-monthly', 'survivor-benefits', 'spousal-benefits'],
            default: 'maximum-lifetime',
            description: 'Optimization goal',
          },
        },
      },
    },
    required: ['personalInfo', 'earnings', 'maritalStatus', 'claimingStrategy'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = SocialSecurityInputSchema.parse(args);
    return SocialSecurityOptimizer.analyze(validated);
  }
}
