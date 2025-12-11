/**
 * Emergency Fund Calculator MCP Tool
 */

import { EmergencyFundCalculator, EmergencyFundInputSchema } from '@financial-analysis/analysis';

export class EmergencyFundTool {
  static readonly toolName = 'analyze_emergency_fund';
  static readonly description =
    'Calculate emergency fund target, build timeline, withdrawal scenarios, and savings recommendations';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      currentSituation: {
        type: 'object',
        properties: {
          monthlyExpenses: { type: 'number', minimum: 0 },
          monthlyIncome: { type: 'number', minimum: 0 },
          currentEmergencyFund: { type: 'number', minimum: 0, default: 0 },
          dependents: { type: 'number', minimum: 0, maximum: 10, default: 0 },
          employmentStatus: {
            type: 'string',
            enum: ['employed', 'self-employed', 'unemployed', 'retired'],
          },
        },
        required: ['monthlyExpenses', 'monthlyIncome', 'employmentStatus'],
      },
      goals: {
        type: 'object',
        properties: {
          targetMonths: { type: 'number', minimum: 1, maximum: 24, default: 6 },
          priority: {
            type: 'string',
            enum: ['build-quickly', 'build-gradually', 'maintain'],
            default: 'build-gradually',
          },
        },
      },
      assumptions: {
        type: 'object',
        properties: {
          monthlySavings: { type: 'number', minimum: 0 },
          expectedReturn: { type: 'number', minimum: 0, maximum: 0.1, default: 0.02 },
        },
        required: ['monthlySavings'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeTimeline: { type: 'boolean', default: true },
          includeScenarios: { type: 'boolean', default: true },
        },
      },
    },
    required: ['currentSituation', 'goals', 'assumptions'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = EmergencyFundInputSchema.parse(args);
    return EmergencyFundCalculator.analyze(validated);
  }
}
