/**
 * Refinancing Calculator MCP Tool
 */

import { RefinancingCalculator, RefinancingInputSchema } from '@financial-analysis/analysis';

export class RefinancingTool {
  static readonly toolName = 'analyze_refinancing';
  static readonly description =
    'Comprehensive mortgage refinancing analysis with break-even point, interest savings, payment comparison, and net benefit calculation';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      currentMortgage: {
        type: 'object',
        properties: {
          principalBalance: { type: 'number', minimum: 0 },
          interestRate: { type: 'number', minimum: 0, maximum: 0.2 },
          remainingTerm: { type: 'number', minimum: 0, maximum: 30 },
          monthlyPayment: { type: 'number', minimum: 0 },
        },
        required: ['principalBalance', 'interestRate', 'remainingTerm', 'monthlyPayment'],
      },
      newMortgage: {
        type: 'object',
        properties: {
          interestRate: { type: 'number', minimum: 0, maximum: 0.2 },
          term: { type: 'number', minimum: 5, maximum: 30 },
          refinanceType: {
            type: 'string',
            enum: ['rate-and-term', 'cash-out', 'cash-in'],
          },
          cashOutAmount: { type: 'number', minimum: 0, default: 0 },
          cashInAmount: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['interestRate', 'term', 'refinanceType'],
      },
      costs: {
        type: 'object',
        properties: {
          closingCosts: { type: 'number', minimum: 0 },
          points: { type: 'number', minimum: 0, maximum: 5, default: 0 },
          appraisalFee: { type: 'number', minimum: 0, default: 0 },
          otherFees: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['closingCosts'],
      },
      goals: {
        type: 'object',
        properties: {
          priority: {
            type: 'string',
            enum: ['lower-payment', 'lower-rate', 'cash-out', 'shorter-term', 'reduce-interest'],
            default: 'lower-rate',
          },
          includeBreakEvenAnalysis: { type: 'boolean', default: true },
        },
      },
    },
    required: ['currentMortgage', 'newMortgage', 'costs'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = RefinancingInputSchema.parse(args);
    return RefinancingCalculator.analyze(validated);
  }
}
