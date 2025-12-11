/**
 * Capital Structure Optimization MCP Tool
 */

import {
  CapitalStructureInputSchema,
  CapitalStructureOptimizer,
} from '@financial-analysis/analysis';

export class CapitalStructureTool {
  static readonly toolName = 'analyze_capital_structure';
  static readonly description =
    'Optimize capital structure with WACC optimization, optimal debt/equity ratio, credit rating impact, and dividend policy analysis';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      companyInfo: {
        type: 'object',
        properties: {
          marketCap: { type: 'number', minimum: 0 },
          currentDebt: { type: 'number', minimum: 0 },
          cashAndEquivalents: { type: 'number', minimum: 0 },
          sharesOutstanding: { type: 'number', minimum: 0 },
          stockPrice: { type: 'number', minimum: 0 },
        },
        required: [
          'marketCap',
          'currentDebt',
          'cashAndEquivalents',
          'sharesOutstanding',
          'stockPrice',
        ],
      },
      financials: {
        type: 'object',
        properties: {
          annualEBITDA: { type: 'number' },
          annualEBIT: { type: 'number' },
          netIncome: { type: 'number' },
          taxRate: { type: 'number', minimum: 0, maximum: 0.5 },
          annualInterestExpense: { type: 'number', minimum: 0 },
        },
        required: ['annualEBITDA', 'annualEBIT', 'netIncome', 'taxRate', 'annualInterestExpense'],
      },
      marketData: {
        type: 'object',
        properties: {
          riskFreeRate: { type: 'number', minimum: 0, maximum: 0.1 },
          marketRiskPremium: { type: 'number', minimum: 0, maximum: 0.2, default: 0.06 },
          beta: { type: 'number', minimum: 0, maximum: 5 },
          creditRating: {
            type: 'string',
            enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'],
          },
        },
        required: ['riskFreeRate', 'beta'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeWACCOptimization: { type: 'boolean', default: true },
          includeDebtCapacity: { type: 'boolean', default: true },
          includeCreditRatingImpact: { type: 'boolean', default: true },
          includeDividendPolicy: { type: 'boolean', default: false },
        },
      },
    },
    required: ['companyInfo', 'financials', 'marketData'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CapitalStructureInputSchema.parse(args);
    return CapitalStructureOptimizer.analyze(validated);
  }
}
