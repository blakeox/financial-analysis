/**
 * LBO Model MCP Tool
 */

import { LBOInputSchema, LBOModel } from '@financial-analysis/analysis';

export class LBOTool {
  static readonly toolName = 'analyze_lbo';
  static readonly description =
    'Leveraged buyout analysis with IRR, MOIC, debt paydown, exit scenarios, and risk assessment';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      targetCompany: {
        type: 'object',
        properties: {
          ebitda: { type: 'number', minimum: 0 },
          revenue: { type: 'number', minimum: 0 },
          debt: { type: 'number', minimum: 0 },
          equity: { type: 'number', minimum: 0 },
        },
        required: ['ebitda', 'revenue', 'debt', 'equity'],
      },
      transaction: {
        type: 'object',
        properties: {
          purchasePrice: { type: 'number', minimum: 0 },
          equityContribution: { type: 'number', minimum: 0 },
          debtAmount: { type: 'number', minimum: 0 },
          transactionFees: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['purchasePrice', 'equityContribution', 'debtAmount'],
      },
      financing: {
        type: 'object',
        properties: {
          seniorDebt: {
            type: 'object',
            properties: {
              amount: { type: 'number', minimum: 0 },
              interestRate: { type: 'number', minimum: 0, maximum: 0.2 },
              term: { type: 'number', minimum: 1, maximum: 10 },
            },
            required: ['amount', 'interestRate', 'term'],
          },
          mezzanineDebt: {
            type: 'object',
            properties: {
              amount: { type: 'number', minimum: 0, default: 0 },
              interestRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.12 },
              term: { type: 'number', minimum: 1, maximum: 10, default: 7 },
            },
          },
        },
        required: ['seniorDebt'],
      },
      projections: {
        type: 'object',
        properties: {
          ebitdaGrowth: { type: 'number', minimum: -0.2, maximum: 0.5, default: 0.05 },
          revenueGrowth: { type: 'number', minimum: -0.2, maximum: 0.5, default: 0.05 },
          exitMultiple: { type: 'number', minimum: 3, maximum: 20, default: 8 },
          holdingPeriod: { type: 'number', minimum: 3, maximum: 10, default: 5 },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeIRR: { type: 'boolean', default: true },
          includeMOIC: { type: 'boolean', default: true },
          includeDebtPaydown: { type: 'boolean', default: true },
          includeExitScenarios: { type: 'boolean', default: true },
        },
      },
    },
    required: ['targetCompany', 'transaction', 'financing'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = LBOInputSchema.parse(args);
    return LBOModel.analyze(validated);
  }
}
