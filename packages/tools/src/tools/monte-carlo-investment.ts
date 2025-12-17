import {
  MonteCarloInvestmentInputSchema,
  MonteCarloInvestmentSimulator,
} from '@financial-analysis/analysis';

export class MonteCarloInvestmentTool {
  static readonly toolName = 'simulate_investment_monte_carlo';
  static readonly description =
    'Run a deterministic Monte Carlo simulation for investment outcomes using geometric Brownian motion';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      initialValue: { type: 'number', minimum: 0 },
      expectedReturn: { type: 'number', description: 'Expected annual return (decimal)' },
      volatility: { type: 'number', minimum: 0, description: 'Annual volatility (decimal)' },
      years: { type: 'number', minimum: 0 },
      stepsPerYear: { type: 'number', default: 252 },
      simulations: { type: 'number', default: 10000 },
      seed: { type: 'number', default: 42, description: 'Seed for deterministic runs' },
      percentiles: {
        type: 'array',
        items: { type: 'number' },
        default: [0.05, 0.5, 0.95],
      },
    },
    required: ['initialValue', 'expectedReturn', 'volatility', 'years'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = MonteCarloInvestmentInputSchema.parse(args);
    return MonteCarloInvestmentSimulator.analyze(validated);
  }
}

