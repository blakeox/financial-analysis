import { OptionsPricingAnalyzer, type OptionsPricingInput } from '@financial-analysis/analysis';

export class OptionsPricingTool {
  static readonly toolName = 'analyze_options_pricing';
  static readonly description =
    'Performs comprehensive options pricing and analysis using multiple pricing models (Black-Scholes, Binomial, Monte Carlo). Calculates option fair value, Greeks (delta, gamma, theta, vega, rho), intrinsic and time value, breakeven prices, and provides trading insights. Supports European, American, Bermudan, Asian, and Barrier options.';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      optionType: {
        type: 'string',
        enum: ['call', 'put'],
        description: 'Type of option (call or put)',
      },
      optionStyle: {
        type: 'string',
        enum: ['European', 'American', 'Bermudan', 'Asian', 'Barrier'],
        description: 'Style of option determining exercise rights',
        default: 'European',
      },
      strikePrice: {
        type: 'number',
        description: 'Strike price (exercise price) of the option',
        minimum: 0,
      },
      currentPrice: {
        type: 'number',
        description: 'Current price of the underlying asset',
        minimum: 0,
      },
      expiryDate: {
        type: 'string',
        description: 'Option expiry date in ISO 8601 format (YYYY-MM-DD)',
      },
      volatility: {
        type: 'number',
        description: 'Annualized volatility of the underlying as a decimal (e.g., 0.25 for 25%)',
        minimum: 0,
        maximum: 5,
      },
      riskFreeRate: {
        type: 'number',
        description: 'Risk-free interest rate as a decimal (e.g., 0.05 for 5%)',
        minimum: 0,
        maximum: 1,
      },
      dividendYield: {
        type: 'number',
        description: 'Dividend yield as a decimal (e.g., 0.02 for 2%)',
        minimum: 0,
        maximum: 1,
        default: 0,
      },
      pricingModel: {
        type: 'string',
        enum: ['Black-Scholes', 'Binomial', 'Monte Carlo'],
        description: 'Pricing model to use for valuation',
        default: 'Black-Scholes',
      },
      binomialSteps: {
        type: 'number',
        description: 'Number of steps for binomial tree (only for Binomial model)',
        minimum: 10,
        maximum: 1000,
        default: 100,
      },
      monteCarloSimulations: {
        type: 'number',
        description: 'Number of simulation paths for Monte Carlo (only for Monte Carlo model)',
        minimum: 1000,
        maximum: 100000,
        default: 10000,
      },
      barrierType: {
        type: 'string',
        enum: ['up-and-out', 'up-and-in', 'down-and-out', 'down-and-in'],
        description: 'Type of barrier for barrier options',
      },
      barrierLevel: {
        type: 'number',
        description: 'Barrier price level for barrier options',
        minimum: 0,
      },
      rebate: {
        type: 'number',
        description: 'Rebate paid if barrier is hit (for barrier options)',
        minimum: 0,
        default: 0,
      },
      averagingType: {
        type: 'string',
        enum: ['arithmetic', 'geometric'],
        description: 'Averaging method for Asian options',
        default: 'arithmetic',
      },
      observationDates: {
        type: 'array',
        description: 'Observation dates for Asian options (ISO 8601 format)',
        items: {
          type: 'string',
        },
      },
      earlyExerciseDates: {
        type: 'array',
        description: 'Allowed early exercise dates for Bermudan options (ISO 8601 format)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['optionType', 'strikePrice', 'currentPrice', 'expiryDate', 'volatility', 'riskFreeRate'],
  };

  static async execute(args: unknown): Promise<string> {
    try {
      const result = await OptionsPricingAnalyzer.analyze(args as OptionsPricingInput);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      if (error instanceof Error) {
        return JSON.stringify({ error: error.message }, null, 2);
      }
      return JSON.stringify({ error: 'Unknown error occurred' }, null, 2);
    }
  }
}
