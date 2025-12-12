/**
 * Startup Financial Model MCP Tool
 */

import { StartupFinancialModelInputSchema, StartupFinancialModel } from '@financial-analysis/analysis';

export class StartupFinancialModelTool {
  static readonly toolName = 'analyze_startup_financial_model';
  static readonly description =
    'Comprehensive startup financial model with revenue projections, burn rate, runway, unit economics, and funding scenarios';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      companyInfo: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Company name' },
          industry: { type: 'string', description: 'Industry' },
          businessModel: {
            type: 'string',
            enum: ['saas', 'marketplace', 'ecommerce', 'services', 'hardware', 'other'],
            default: 'saas',
            description: 'Business model',
          },
          stage: {
            type: 'string',
            enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth'],
            default: 'seed',
            description: 'Funding stage',
          },
        },
        required: ['companyName', 'industry'],
      },
      financials: {
        type: 'object',
        properties: {
          currentCash: { type: 'number', minimum: 0, description: 'Current cash' },
          monthlyBurnRate: { type: 'number', minimum: 0, description: 'Monthly burn rate' },
          monthlyRevenue: { type: 'number', minimum: 0, default: 0, description: 'Monthly revenue' },
          annualRecurringRevenue: { type: 'number', minimum: 0, default: 0, description: 'ARR' },
        },
        required: ['currentCash', 'monthlyBurnRate'],
      },
      revenueProjections: {
        type: 'object',
        properties: {
          monthlyGrowthRate: { type: 'number', minimum: 0, maximum: 1, default: 0.1, description: 'Monthly growth rate' },
          churnRate: { type: 'number', minimum: 0, maximum: 1, default: 0.05, description: 'Monthly churn rate' },
          averageRevenuePerUser: { type: 'number', minimum: 0, default: 0, description: 'ARPU' },
        },
      },
      unitEconomics: {
        type: 'object',
        properties: {
          customerAcquisitionCost: { type: 'number', minimum: 0, default: 0, description: 'CAC' },
          lifetimeValue: { type: 'number', minimum: 0, default: 0, description: 'LTV' },
          grossMargin: { type: 'number', minimum: 0, maximum: 1, default: 0.7, description: 'Gross margin' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeRunway: { type: 'boolean', default: true, description: 'Include runway' },
          includeBurnRate: { type: 'boolean', default: true, description: 'Include burn rate' },
          includeUnitEconomics: { type: 'boolean', default: true, description: 'Include unit economics' },
          includeFundingScenarios: { type: 'boolean', default: true, description: 'Include funding scenarios' },
          projectionMonths: { type: 'number', minimum: 6, maximum: 60, default: 24, description: 'Projection months' },
        },
        required: ['projectionMonths'],
      },
    },
    required: ['companyInfo', 'financials'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = StartupFinancialModelInputSchema.parse(args);
    return StartupFinancialModel.analyze(validated);
  }
}

