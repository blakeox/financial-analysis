/**
 * Cryptocurrency Tax MCP Tool
 */

import {
  CryptocurrencyTaxInputSchema,
  CryptocurrencyTaxCalculator,
} from '@financial-analysis/analysis';

export class CryptocurrencyTaxTool {
  static readonly toolName = 'analyze_cryptocurrency_tax';
  static readonly description =
    'Calculate cryptocurrency tax obligations with FIFO/LIFO/HIFO methods, wash sale analysis, staking/mining income, and DeFi transactions';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          taxYear: {
            type: 'number',
            minimum: 2000,
            maximum: 2100,
            default: 2024,
            description: 'Tax year',
          },
          filingStatus: {
            type: 'string',
            enum: ['single', 'married-joint', 'married-separate', 'head-of-household'],
            description: 'Filing status',
          },
          federalTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.5,
            default: 0.22,
            description: 'Federal tax rate',
          },
          stateTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0,
            description: 'State tax rate',
          },
        },
        required: ['taxYear', 'filingStatus', 'federalTaxRate'],
      },
      transactions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            transactionType: {
              type: 'string',
              enum: ['buy', 'sell', 'trade', 'gift', 'mining', 'staking', 'defi', 'nft'],
              description: 'Transaction type',
            },
            asset: { type: 'string', description: 'Cryptocurrency asset' },
            date: { type: 'string', description: 'Transaction date (ISO format)' },
            amount: { type: 'number', minimum: 0, description: 'Amount' },
            costBasis: { type: 'number', minimum: 0, default: 0, description: 'Cost basis' },
            fairMarketValue: { type: 'number', minimum: 0, description: 'Fair market value' },
            proceeds: { type: 'number', minimum: 0, default: 0, description: 'Proceeds' },
            holdingPeriod: {
              type: 'string',
              enum: ['short-term', 'long-term'],
              description: 'Holding period',
            },
          },
          required: ['transactionType', 'asset', 'date', 'amount', 'fairMarketValue'],
        },
        minItems: 1,
      },
      costBasisMethod: {
        type: 'string',
        enum: ['fifo', 'lifo', 'hifo', 'specific-identification'],
        default: 'fifo',
        description: 'Cost basis method',
      },
      analysis: {
        type: 'object',
        properties: {
          includeCapitalGains: {
            type: 'boolean',
            default: true,
            description: 'Include capital gains',
          },
          includeOrdinaryIncome: {
            type: 'boolean',
            default: true,
            description: 'Include ordinary income',
          },
          includeWashSaleAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include wash sale analysis',
          },
          includeForm8949: { type: 'boolean', default: true, description: 'Include Form 8949' },
        },
      },
    },
    required: ['personalInfo', 'transactions'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CryptocurrencyTaxInputSchema.parse(args);
    return CryptocurrencyTaxCalculator.analyze(validated);
  }
}
