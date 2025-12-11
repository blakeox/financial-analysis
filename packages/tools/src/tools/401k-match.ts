/**
 * 401(k) Employer Match Optimizer MCP Tool
 */

import {
  EmployerMatch401kInputSchema,
  EmployerMatch401kOptimizer,
} from '@financial-analysis/analysis';

export class EmployerMatch401kTool {
  static readonly toolName = 'analyze_401k_match';
  static readonly description =
    'Maximize 401(k) employer match, analyze vesting schedule, optimize contribution strategy, and calculate tax benefits';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      planDetails: {
        type: 'object',
        properties: {
          employerMatch: { type: 'number', minimum: 0, maximum: 1 },
          matchLimit: { type: 'number', minimum: 0, maximum: 1 },
          vestingSchedule: {
            type: 'string',
            enum: ['immediate', 'cliff', 'graded'],
            default: 'immediate',
          },
          vestingYears: { type: 'number', minimum: 0, maximum: 10, default: 0 },
          currentVestingPercentage: { type: 'number', minimum: 0, maximum: 1, default: 1 },
        },
        required: ['employerMatch', 'matchLimit', 'vestingSchedule'],
      },
      employeeInfo: {
        type: 'object',
        properties: {
          annualSalary: { type: 'number', minimum: 0 },
          currentContribution: { type: 'number', minimum: 0, maximum: 0.5 },
          currentBalance: { type: 'number', minimum: 0, default: 0 },
          yearsOfService: { type: 'number', minimum: 0, maximum: 50, default: 0 },
        },
        required: ['annualSalary', 'currentContribution'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeMaximization: { type: 'boolean', default: true },
          includeVestingAnalysis: { type: 'boolean', default: true },
          includeTaxAnalysis: { type: 'boolean', default: true },
        },
      },
    },
    required: ['planDetails', 'employeeInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = EmployerMatch401kInputSchema.parse(args);
    return EmployerMatch401kOptimizer.analyze(validated);
  }
}
