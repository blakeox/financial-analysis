import { CAPMCalculator, CAPMInputSchema } from '@financial-analysis/analysis';

export class CAPMTool {
  static readonly toolName = 'calculate_capm';
  static readonly description =
    'Calculate expected return using CAPM (risk-free rate + beta × market risk premium)';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      riskFreeRate: { type: 'number', description: 'Risk-free rate as decimal (e.g., 0.04)' },
      beta: { type: 'number', description: 'Asset beta' },
      marketRiskPremium: {
        type: 'number',
        description: 'Market risk premium as decimal (e.g., 0.05 for 5%)',
      },
    },
    required: ['riskFreeRate', 'beta', 'marketRiskPremium'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CAPMInputSchema.parse(args);
    return CAPMCalculator.analyze(validated);
  }
}

