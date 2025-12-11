/**
 * FIRE Calculator MCP Tool
 */

import { FIRECalculator, FIRECalculatorInputSchema } from '@financial-analysis/analysis';

export class FIRECalculatorTool {
  static readonly toolName = 'analyze_fire_calculator';
  static readonly description =
    'Calculate Financial Independence (FIRE) number, retirement date, Coast FIRE, Barista FIRE, and savings strategies';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      currentSituation: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100 },
          currentSavings: { type: 'number', minimum: 0 },
          annualIncome: { type: 'number', minimum: 0 },
          annualExpenses: { type: 'number', minimum: 0 },
          monthlySavings: { type: 'number', minimum: 0 },
        },
        required: ['age', 'currentSavings', 'annualIncome', 'annualExpenses', 'monthlySavings'],
      },
      fireGoals: {
        type: 'object',
        properties: {
          targetAge: { type: 'number', minimum: 18, maximum: 100 },
          annualExpensesInRetirement: { type: 'number', minimum: 0 },
          safeWithdrawalRate: { type: 'number', minimum: 0.02, maximum: 0.06, default: 0.04 },
          fireType: {
            type: 'string',
            enum: ['traditional', 'coast', 'barista', 'lean'],
            default: 'traditional',
          },
        },
        required: ['targetAge', 'annualExpensesInRetirement'],
      },
      assumptions: {
        type: 'object',
        properties: {
          expectedReturn: { type: 'number', minimum: 0, maximum: 0.2, default: 0.07 },
          inflationRate: { type: 'number', minimum: 0, maximum: 0.1, default: 0.03 },
          incomeGrowth: { type: 'number', minimum: 0, maximum: 0.2, default: 0.03 },
          expenseReduction: { type: 'number', minimum: 0, maximum: 0.5, default: 0 },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeProjections: { type: 'boolean', default: true },
          includeScenarios: { type: 'boolean', default: true },
          includeExpenseOptimization: { type: 'boolean', default: true },
        },
      },
    },
    required: ['currentSituation', 'fireGoals'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = FIRECalculatorInputSchema.parse(args);
    return FIRECalculator.analyze(validated);
  }
}
