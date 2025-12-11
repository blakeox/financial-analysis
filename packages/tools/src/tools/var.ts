/**
 * VaR Calculator MCP Tool
 */

import { VaRCalculator, VaRInputSchema } from '@financial-analysis/analysis';

export class VaRTool {
  static readonly toolName = 'analyze_var';
  static readonly description =
    'Value at Risk (VaR) calculation using historical, parametric, or Monte Carlo methods with stress testing and backtesting';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      portfolio: {
        type: 'object',
        properties: {
          positions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                quantity: { type: 'number', minimum: 0 },
                currentPrice: { type: 'number', minimum: 0 },
                assetClass: {
                  type: 'string',
                  enum: ['stock', 'bond', 'commodity', 'currency', 'other'],
                },
              },
              required: ['symbol', 'quantity', 'currentPrice', 'assetClass'],
            },
          },
          totalValue: { type: 'number', minimum: 0 },
        },
        required: ['positions', 'totalValue'],
      },
      parameters: {
        type: 'object',
        properties: {
          confidenceLevel: { type: 'number', minimum: 0.9, maximum: 0.99, default: 0.95 },
          timeHorizon: { type: 'number', minimum: 1, maximum: 252, default: 1 },
          method: {
            type: 'string',
            enum: ['historical', 'parametric', 'monte-carlo'],
            default: 'historical',
          },
        },
      },
      marketData: {
        type: 'object',
        properties: {
          historicalReturns: {
            type: 'array',
            items: { type: 'number' },
          },
          volatilities: {
            type: 'array',
            items: { type: 'number' },
          },
          correlations: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeStressTesting: { type: 'boolean', default: false },
          includeBacktesting: { type: 'boolean', default: false },
        },
      },
    },
    required: ['portfolio', 'parameters'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = VaRInputSchema.parse(args);
    return VaRCalculator.analyze(validated);
  }
}
