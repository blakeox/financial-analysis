/**
 * Working Capital Optimizer MCP Tool
 */

import { WorkingCapitalInputSchema, WorkingCapitalOptimizer } from '@financial-analysis/analysis';

export class WorkingCapitalTool {
  static readonly toolName = 'analyze_working_capital';
  static readonly description =
    'Working capital optimization with cash conversion cycle, liquidity analysis, and optimization recommendations';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      companyInfo: {
        type: 'object',
        properties: {
          industry: { type: 'string' },
          annualRevenue: { type: 'number', minimum: 0 },
        },
        required: ['annualRevenue'],
      },
      currentAssets: {
        type: 'object',
        properties: {
          cash: { type: 'number', minimum: 0 },
          accountsReceivable: { type: 'number', minimum: 0 },
          inventory: { type: 'number', minimum: 0 },
          otherCurrentAssets: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['cash', 'accountsReceivable', 'inventory'],
      },
      currentLiabilities: {
        type: 'object',
        properties: {
          accountsPayable: { type: 'number', minimum: 0 },
          shortTermDebt: { type: 'number', minimum: 0 },
          accruedExpenses: { type: 'number', minimum: 0, default: 0 },
          otherCurrentLiabilities: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['accountsPayable', 'shortTermDebt'],
      },
      operatingMetrics: {
        type: 'object',
        properties: {
          daysSalesOutstanding: { type: 'number', minimum: 0, maximum: 365 },
          daysPayableOutstanding: { type: 'number', minimum: 0, maximum: 365 },
          daysInventoryOutstanding: { type: 'number', minimum: 0, maximum: 365 },
          inventoryTurnover: { type: 'number', minimum: 0 },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeCashConversionCycle: { type: 'boolean', default: true },
          includeOptimization: { type: 'boolean', default: true },
          includeLiquidityAnalysis: { type: 'boolean', default: true },
        },
      },
    },
    required: ['companyInfo', 'currentAssets', 'currentLiabilities'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = WorkingCapitalInputSchema.parse(args);
    return WorkingCapitalOptimizer.analyze(validated);
  }
}
