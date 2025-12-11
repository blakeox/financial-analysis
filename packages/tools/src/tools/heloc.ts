/**
 * HELOC Analyzer MCP Tool
 */

import { HELOCAnalyzer, HELOCInputSchema } from '@financial-analysis/analysis';

export class HELOCTool {
  static readonly toolName = 'analyze_heloc';
  static readonly description =
    'Analyze Home Equity Line of Credit (HELOC) options, compare to refinancing and personal loans, calculate payments, tax implications, and risk assessment';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      propertyInfo: {
        type: 'object',
        properties: {
          currentHomeValue: { type: 'number', minimum: 0 },
          currentMortgageBalance: { type: 'number', minimum: 0 },
          mortgageInterestRate: { type: 'number', minimum: 0, maximum: 0.2 },
          yearsRemaining: { type: 'number', minimum: 0, maximum: 30 },
        },
        required: [
          'currentHomeValue',
          'currentMortgageBalance',
          'mortgageInterestRate',
          'yearsRemaining',
        ],
      },
      helocDetails: {
        type: 'object',
        properties: {
          creditLimit: { type: 'number', minimum: 0 },
          interestRate: { type: 'number', minimum: 0, maximum: 0.2 },
          drawPeriod: { type: 'number', minimum: 1, maximum: 10 },
          repaymentPeriod: { type: 'number', minimum: 1, maximum: 20 },
          initialDraw: { type: 'number', minimum: 0 },
          annualFee: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['creditLimit', 'interestRate', 'drawPeriod', 'repaymentPeriod'],
      },
      usage: {
        type: 'object',
        properties: {
          purpose: {
            type: 'string',
            enum: ['home-improvement', 'debt-consolidation', 'investment', 'education', 'other'],
          },
          drawAmount: { type: 'number', minimum: 0 },
          drawTiming: { type: 'string', enum: ['immediate', 'gradual', 'as-needed'] },
        },
        required: ['purpose', 'drawAmount', 'drawTiming'],
      },
      comparison: {
        type: 'object',
        properties: {
          compareToRefinancing: { type: 'boolean', default: true },
          compareToPersonalLoan: { type: 'boolean', default: false },
          newMortgageRate: { type: 'number', minimum: 0, maximum: 0.2 },
          personalLoanRate: { type: 'number', minimum: 0, maximum: 0.2 },
        },
      },
    },
    required: ['propertyInfo', 'helocDetails', 'usage'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = HELOCInputSchema.parse(args);
    return HELOCAnalyzer.analyze(validated);
  }
}
