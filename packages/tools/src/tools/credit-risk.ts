/**
 * Credit Risk Analyzer MCP Tool
 */

import { CreditRiskAnalyzer, CreditRiskInputSchema } from '@financial-analysis/analysis';

export class CreditRiskTool {
  static readonly toolName = 'analyze_credit_risk';
  static readonly description =
    'Credit risk analysis with Probability of Default (PD), Loss Given Default (LGD), Expected Loss (EL), and stress testing';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      borrowerInfo: {
        type: 'object',
        properties: {
          companyName: { type: 'string' },
          industry: { type: 'string' },
          yearsInBusiness: { type: 'number', minimum: 0, maximum: 100 },
        },
      },
      financials: {
        type: 'object',
        properties: {
          annualRevenue: { type: 'number', minimum: 0 },
          ebitda: { type: 'number' },
          netIncome: { type: 'number' },
          totalDebt: { type: 'number', minimum: 0 },
          totalAssets: { type: 'number', minimum: 0 },
          cashAndEquivalents: { type: 'number', minimum: 0 },
          currentLiabilities: { type: 'number', minimum: 0 },
        },
        required: [
          'annualRevenue',
          'ebitda',
          'netIncome',
          'totalDebt',
          'totalAssets',
          'cashAndEquivalents',
          'currentLiabilities',
        ],
      },
      debtInfo: {
        type: 'object',
        properties: {
          exposureAtDefault: { type: 'number', minimum: 0 },
          currentRating: {
            type: 'string',
            enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'],
          },
          recoveryRate: { type: 'number', minimum: 0, maximum: 1, default: 0.4 },
        },
        required: ['exposureAtDefault'],
      },
      analysis: {
        type: 'object',
        properties: {
          includePD: { type: 'boolean', default: true },
          includeLGD: { type: 'boolean', default: true },
          includeEL: { type: 'boolean', default: true },
          includeStressTesting: { type: 'boolean', default: false },
        },
      },
    },
    required: ['financials', 'debtInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CreditRiskInputSchema.parse(args);
    return CreditRiskAnalyzer.analyze(validated);
  }
}
