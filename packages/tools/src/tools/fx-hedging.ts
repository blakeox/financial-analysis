import { FXHedgingAnalyzer, FXHedgingInputSchema } from '@financial-analysis/analysis';

export class FXHedgingTool {
  static readonly toolName = 'analyze_fx_hedge';
  static readonly description =
    'Calculate FX forward rate (interest rate parity) and hedged vs unhedged return impact';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      spotRate: { type: 'number', minimum: 0, description: 'Domestic per 1 foreign currency' },
      domesticRate: { type: 'number', description: 'Domestic interest rate (decimal)' },
      foreignRate: { type: 'number', description: 'Foreign interest rate (decimal)' },
      tenorYears: { type: 'number', minimum: 0 },
      expectedSpotRateAtMaturity: { type: 'number', minimum: 0, description: 'Optional expected future spot rate' },
      foreignAssetReturn: { type: 'number', description: 'Optional foreign asset return over tenor (decimal)' },
    },
    required: ['spotRate', 'domesticRate', 'foreignRate', 'tenorYears'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = FXHedgingInputSchema.parse(args);
    return FXHedgingAnalyzer.analyze(validated);
  }
}

