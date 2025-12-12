/**
 * Tax Loss Harvesting MCP Tool
 */

import { TaxLossHarvestingInputSchema, TaxLossHarvestingOptimizer } from '@financial-analysis/analysis';

export class TaxLossHarvestingTool {
  static readonly toolName = 'analyze_tax_loss_harvesting';
  static readonly description =
    'Identify tax-loss harvesting opportunities, calculate tax savings, analyze wash sale rules, and optimize capital gains offset';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      portfolio: {
        type: 'object',
        properties: {
          holdings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: 'Stock symbol' },
                shares: { type: 'number', minimum: 0, description: 'Number of shares' },
                costBasis: { type: 'number', minimum: 0, description: 'Cost basis per share' },
                currentPrice: { type: 'number', minimum: 0, description: 'Current price per share' },
                purchaseDate: { type: 'string', description: 'Purchase date (ISO format)' },
                holdingPeriod: { type: 'string', enum: ['short-term', 'long-term'], description: 'Holding period' },
              },
              required: ['symbol', 'shares', 'costBasis', 'currentPrice', 'purchaseDate', 'holdingPeriod'],
            },
          },
          totalValue: { type: 'number', minimum: 0, description: 'Total portfolio value' },
        },
        required: ['holdings', 'totalValue'],
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalTaxRate: {
            type: 'object',
            properties: {
              shortTerm: { type: 'number', minimum: 0, maximum: 0.5, description: 'Short-term capital gains rate' },
              longTerm: { type: 'number', minimum: 0, maximum: 0.3, description: 'Long-term capital gains rate' },
            },
            required: ['shortTerm', 'longTerm'],
          },
          stateTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0, description: 'State tax rate' },
          incomeBracket: { type: 'number', minimum: 0, maximum: 0.5, description: 'Income tax bracket' },
        },
        required: ['federalTaxRate', 'incomeBracket'],
      },
      realizedGains: {
        type: 'object',
        properties: {
          shortTermGains: { type: 'number', minimum: 0, default: 0, description: 'Short-term realized gains' },
          longTermGains: { type: 'number', minimum: 0, default: 0, description: 'Long-term realized gains' },
          ordinaryIncome: { type: 'number', minimum: 0, default: 0, description: 'Ordinary income' },
        },
      },
      harvestingStrategy: {
        type: 'object',
        properties: {
          maxHarvestAmount: { type: 'number', minimum: 0, default: 3000, description: 'Maximum annual harvest amount' },
          includeWashSaleRules: { type: 'boolean', default: true, description: 'Include wash sale rules' },
          washSaleWindow: { type: 'number', minimum: 0, default: 30, description: 'Wash sale window (days)' },
          replacementSecuritySimilarity: {
            type: 'string',
            enum: ['exact', 'similar', 'different'],
            default: 'similar',
            description: 'Replacement security similarity',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeTaxSavingsProjection: { type: 'boolean', default: true, description: 'Include tax savings projection' },
          includeCarryForwardAnalysis: { type: 'boolean', default: true, description: 'Include carry-forward analysis' },
          projectionYears: { type: 'number', minimum: 1, maximum: 10, default: 5, description: 'Projection years' },
        },
      },
    },
    required: ['portfolio', 'taxInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = TaxLossHarvestingInputSchema.parse(args);
    return TaxLossHarvestingOptimizer.analyze(validated);
  }
}
