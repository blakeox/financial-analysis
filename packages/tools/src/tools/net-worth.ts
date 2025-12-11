/**
 * Net Worth Tracker MCP Tool
 */

import { NetWorthInputSchema, NetWorthTracker } from '@financial-analysis/analysis';

export class NetWorthTool {
  static readonly toolName = 'analyze_net_worth';
  static readonly description =
    'Track net worth over time with asset/liability breakdown, projections, milestones, and debt analysis';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      assets: {
        type: 'object',
        properties: {
          cash: { type: 'number', minimum: 0 },
          investments: { type: 'number', minimum: 0 },
          realEstate: { type: 'number', minimum: 0 },
          retirementAccounts: { type: 'number', minimum: 0 },
          businessValue: { type: 'number', minimum: 0, default: 0 },
          otherAssets: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['cash', 'investments', 'realEstate', 'retirementAccounts'],
      },
      liabilities: {
        type: 'object',
        properties: {
          mortgages: { type: 'number', minimum: 0 },
          creditCardDebt: { type: 'number', minimum: 0 },
          studentLoans: { type: 'number', minimum: 0 },
          autoLoans: { type: 'number', minimum: 0 },
          otherDebt: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['mortgages', 'creditCardDebt', 'studentLoans', 'autoLoans'],
      },
      projections: {
        type: 'object',
        properties: {
          assetGrowthRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.07 },
          debtPaydownRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.05 },
          yearsToProject: { type: 'number', minimum: 1, maximum: 50, default: 10 },
        },
      },
      goals: {
        type: 'object',
        properties: {
          targetNetWorth: { type: 'number', minimum: 0 },
          targetDate: { type: 'string' },
          includeMilestones: { type: 'boolean', default: true },
        },
      },
    },
    required: ['assets', 'liabilities'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = NetWorthInputSchema.parse(args);
    return NetWorthTracker.analyze(validated);
  }
}
