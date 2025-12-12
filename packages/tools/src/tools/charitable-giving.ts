/**
 * Charitable Giving MCP Tool
 */

import { CharitableGivingInputSchema, CharitableGivingOptimizer } from '@financial-analysis/analysis';

export class CharitableGivingTool {
  static readonly toolName = 'analyze_charitable_giving';
  static readonly description =
    'Optimize charitable giving strategies with donor-advised funds, QCDs, appreciated securities, and tax deduction maximization';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          filingStatus: {
            type: 'string',
            enum: ['single', 'married-joint', 'married-separate', 'head-of-household'],
            description: 'Filing status',
          },
          adjustedGrossIncome: { type: 'number', minimum: 0, description: 'Adjusted gross income' },
        },
        required: ['age', 'filingStatus', 'adjustedGrossIncome'],
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalTaxRate: { type: 'number', minimum: 0, maximum: 0.5, description: 'Federal tax rate' },
          stateTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0, description: 'State tax rate' },
          itemizeDeductions: { type: 'boolean', default: false, description: 'Itemize deductions' },
          standardDeduction: { type: 'number', minimum: 0, default: 14600, description: 'Standard deduction' },
        },
        required: ['federalTaxRate'],
      },
      givingDetails: {
        type: 'object',
        properties: {
          annualGivingAmount: { type: 'number', minimum: 0, description: 'Annual giving amount' },
          givingMethod: {
            type: 'string',
            enum: ['cash', 'appreciated-securities', 'donor-advised-fund', 'qcd', 'trust'],
            description: 'Giving method',
          },
          appreciatedAssetDetails: {
            type: 'object',
            properties: {
              assetType: { type: 'string', enum: ['stocks', 'real-estate', 'other'], description: 'Asset type' },
              costBasis: { type: 'number', minimum: 0, description: 'Cost basis' },
              currentValue: { type: 'number', minimum: 0, description: 'Current value' },
              holdingPeriod: { type: 'string', enum: ['short-term', 'long-term'], description: 'Holding period' },
            },
          },
          qcdDetails: {
            type: 'object',
            properties: {
              age: { type: 'number', minimum: 70.5, description: 'Age (must be 70.5+)' },
              iraBalance: { type: 'number', minimum: 0, description: 'IRA balance' },
              qcdAmount: { type: 'number', minimum: 0, maximum: 100000, description: 'QCD amount' },
            },
          },
        },
        required: ['annualGivingAmount', 'givingMethod'],
      },
      strategy: {
        type: 'object',
        properties: {
          optimizeFor: {
            type: 'string',
            enum: ['max-tax-benefit', 'simplicity', 'flexibility', 'estate-planning'],
            default: 'max-tax-benefit',
            description: 'Optimization goal',
          },
          bunchingStrategy: { type: 'boolean', default: false, description: 'Bunching strategy' },
          includeEstatePlanning: { type: 'boolean', default: false, description: 'Include estate planning' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          compareMethods: { type: 'boolean', default: true, description: 'Compare giving methods' },
          includeMultiYearProjection: { type: 'boolean', default: true, description: 'Include multi-year projection' },
          projectionYears: { type: 'number', minimum: 1, maximum: 20, default: 5, description: 'Projection years' },
        },
      },
    },
    required: ['personalInfo', 'taxInfo', 'givingDetails'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CharitableGivingInputSchema.parse(args);
    return CharitableGivingOptimizer.analyze(validated);
  }
}
