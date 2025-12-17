import {
  DividendReinvestmentCalculator,
  DividendReinvestmentInputSchema,
} from '@financial-analysis/analysis';

export class DividendReinvestmentTool {
  static readonly toolName = 'calculate_dividend_reinvestment';
  static readonly description =
    'Model dividend reinvestment growth over time with optional dividend and price growth';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      initialInvestment: { type: 'number', minimum: 0 },
      sharePrice: { type: 'number', minimum: 0 },
      years: { type: 'number', minimum: 0 },
      annualDividendYield: { type: 'number', minimum: 0, description: 'Dividend yield (decimal)' },
      dividendFrequency: { type: 'string', enum: ['monthly', 'quarterly', 'annual'], default: 'quarterly' },
      sharePriceGrowthRate: { type: 'number', default: 0, description: 'Share price growth rate (decimal)' },
      dividendGrowthRate: { type: 'number', default: 0, description: 'Dividend growth rate (decimal)' },
      annualContribution: { type: 'number', minimum: 0, default: 0 },
    },
    required: ['initialInvestment', 'sharePrice', 'years', 'annualDividendYield'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = DividendReinvestmentInputSchema.parse(args);
    return DividendReinvestmentCalculator.analyze(validated);
  }
}

