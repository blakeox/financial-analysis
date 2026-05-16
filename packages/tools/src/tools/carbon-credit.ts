import {
  CarbonCreditValuationCalculator,
  CarbonCreditValuationInputSchema,
} from '@financial-analysis/analysis';

export class CarbonCreditValuationTool {
  static readonly toolName = 'value_carbon_credits';
  static readonly description =
    'Value carbon credits (CO2e tonnes) with optional price growth and discounting';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      tonnesCO2e: { type: 'number', minimum: 0 },
      pricePerTonne: { type: 'number', minimum: 0 },
      yearsUntilSale: { type: 'number', minimum: 0, default: 0 },
      priceGrowthRate: {
        type: 'number',
        default: 0,
        description: 'Annual price growth rate (decimal)',
      },
      discountRate: { type: 'number', default: 0, description: 'Annual discount rate (decimal)' },
    },
    required: ['tonnesCO2e', 'pricePerTonne'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CarbonCreditValuationInputSchema.parse(args);
    return CarbonCreditValuationCalculator.analyze(validated);
  }
}
