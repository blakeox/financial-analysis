import { NPVIRRCalculator, NPVIRRInputSchema } from '@financial-analysis/analysis';

export class NPVIRRTool {
  static readonly toolName = 'calculate_npv_irr';
  static readonly description = 'Calculate NPV, IRR, and payback period with optional sensitivity';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      cashFlows: {
        type: 'array',
        items: { type: 'number' },
        description: 'Cash flows by period (period 0 is initial investment)',
      },
      discountRate: { type: 'number', description: 'Discount rate as decimal (e.g., 0.1 for 10%)' },
      sensitivityDiscountRates: {
        type: 'array',
        items: { type: 'number' },
        description: 'Optional list of discount rates for NPV sensitivity',
      },
    },
    required: ['cashFlows', 'discountRate'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = NPVIRRInputSchema.parse(args);
    return NPVIRRCalculator.analyze(validated);
  }
}
