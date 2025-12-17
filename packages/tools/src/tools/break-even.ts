import { BreakEvenAnalyzer, BreakEvenInputSchema } from '@financial-analysis/analysis';

export class BreakEvenTool {
  static readonly toolName = 'analyze_break_even';
  static readonly description = 'Calculate break-even point in units and revenue';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      fixedCosts: { type: 'number', description: 'Total fixed costs', minimum: 0 },
      variableCostPerUnit: { type: 'number', description: 'Variable cost per unit', minimum: 0 },
      pricePerUnit: { type: 'number', description: 'Price per unit', minimum: 0 },
      targetProfit: {
        type: 'number',
        description: 'Optional target profit to include in break-even',
        minimum: 0,
        default: 0,
      },
    },
    required: ['fixedCosts', 'variableCostPerUnit', 'pricePerUnit'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = BreakEvenInputSchema.parse(args);
    return BreakEvenAnalyzer.analyze(validated);
  }
}

