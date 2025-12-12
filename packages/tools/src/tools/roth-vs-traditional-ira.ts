/**
 * Roth vs Traditional IRA MCP Tool
 */

import { RothVsTraditionalIRACalculator, RothVsTraditionalIRAInputSchema } from '@financial-analysis/analysis';

export class RothVsTraditionalIRATool {
  static readonly toolName = 'analyze_roth_vs_traditional_ira';
  static readonly description =
    'Compare Roth vs Traditional IRA strategies with tax bracket analysis, conversion scenarios, and withdrawal optimization';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          retirementAge: { type: 'number', minimum: 59.5, maximum: 100, description: 'Retirement age' },
          currentTaxBracket: { type: 'number', minimum: 0, maximum: 0.5, description: 'Current tax bracket' },
          expectedRetirementTaxBracket: { type: 'number', minimum: 0, maximum: 0.5, description: 'Expected retirement tax bracket' },
        },
        required: ['age', 'retirementAge', 'currentTaxBracket', 'expectedRetirementTaxBracket'],
      },
      contributionDetails: {
        type: 'object',
        properties: {
          annualContribution: { type: 'number', minimum: 0, maximum: 7000, description: 'Annual contribution' },
          catchUpContribution: { type: 'number', minimum: 0, maximum: 1000, default: 0, description: 'Catch-up contribution (age 50+)' },
          yearsToContribute: { type: 'number', minimum: 1, maximum: 50, description: 'Years to contribute' },
        },
        required: ['annualContribution', 'yearsToContribute'],
      },
      accountDetails: {
        type: 'object',
        properties: {
          currentTraditionalBalance: { type: 'number', minimum: 0, default: 0, description: 'Current Traditional IRA balance' },
          currentRothBalance: { type: 'number', minimum: 0, default: 0, description: 'Current Roth IRA balance' },
          expectedReturn: { type: 'number', minimum: 0, maximum: 0.2, default: 0.07, description: 'Expected return' },
        },
      },
      taxInfo: {
        type: 'object',
        properties: {
          currentMarginalTaxRate: { type: 'number', minimum: 0, maximum: 0.5, description: 'Current marginal tax rate' },
          expectedRetirementMarginalTaxRate: { type: 'number', minimum: 0, maximum: 0.5, description: 'Expected retirement marginal tax rate' },
          stateTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0, description: 'State tax rate' },
          stateTaxDeduction: { type: 'boolean', default: false, description: 'State tax deduction available' },
        },
        required: ['currentMarginalTaxRate', 'expectedRetirementMarginalTaxRate'],
      },
      withdrawalStrategy: {
        type: 'object',
        properties: {
          annualWithdrawalAmount: { type: 'number', minimum: 0, default: 0, description: 'Annual withdrawal amount' },
          withdrawalStartAge: { type: 'number', minimum: 59.5, maximum: 100, description: 'Withdrawal start age' },
          includeRequiredMinimumDistributions: { type: 'boolean', default: true, description: 'Include RMDs' },
          rmdsStartAge: { type: 'number', minimum: 72, maximum: 75, default: 73, description: 'RMDs start age' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeConversionAnalysis: { type: 'boolean', default: true, description: 'Include conversion analysis' },
          includeTaxBracketOptimization: { type: 'boolean', default: true, description: 'Include tax bracket optimization' },
          projectionYears: { type: 'number', minimum: 10, maximum: 50, default: 30, description: 'Projection years' },
        },
      },
    },
    required: ['personalInfo', 'contributionDetails', 'taxInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = RothVsTraditionalIRAInputSchema.parse(args);
    return RothVsTraditionalIRACalculator.analyze(validated);
  }
}

