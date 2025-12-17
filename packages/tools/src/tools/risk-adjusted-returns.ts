import {
  RiskAdjustedReturnsCalculator,
  RiskAdjustedReturnsInputSchema,
} from '@financial-analysis/analysis';

export class RiskAdjustedReturnsTool {
  static readonly toolName = 'analyze_risk_adjusted_returns';
  static readonly description = 'Calculate Sharpe and Sortino ratios from a return series';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      returns: {
        type: 'array',
        items: { type: 'number' },
        description: 'Periodic returns as decimals (e.g., 0.01 for 1%)',
      },
      riskFreeRate: {
        type: 'number',
        description: 'Risk-free rate per period as decimal',
        default: 0,
      },
      targetReturn: {
        type: 'number',
        description: 'Target/minimum acceptable return per period (Sortino)',
        default: 0,
      },
      periodsPerYear: {
        type: 'number',
        description: 'Annualization factor (e.g., 252 daily, 12 monthly)',
        default: 252,
      },
    },
    required: ['returns'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = RiskAdjustedReturnsInputSchema.parse(args);
    return RiskAdjustedReturnsCalculator.analyze(validated);
  }
}

