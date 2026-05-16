import { P2PLendingAnalyzer, P2PLendingInputSchema } from '@financial-analysis/analysis';

export class P2PLendingTool {
  static readonly toolName = 'analyze_p2p_lending';
  static readonly description =
    'Estimate expected return for peer-to-peer lending given interest, fees, default probability, and recovery';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      principal: { type: 'number', minimum: 0 },
      annualInterestRate: {
        type: 'number',
        minimum: 0,
        description: 'Nominal annual interest rate (decimal)',
      },
      termYears: { type: 'number', minimum: 0 },
      feeRate: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Fee rate applied to interest (decimal)',
      },
      defaultProbability: { type: 'number', minimum: 0, maximum: 1, default: 0 },
      recoveryRate: { type: 'number', minimum: 0, maximum: 1, default: 0 },
    },
    required: ['principal', 'annualInterestRate', 'termYears'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = P2PLendingInputSchema.parse(args);
    return P2PLendingAnalyzer.analyze(validated);
  }
}
