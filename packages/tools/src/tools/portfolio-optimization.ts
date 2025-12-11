/**
 * Portfolio Optimizer MCP Tool
 */

import { PortfolioOptimizationInputSchema, PortfolioOptimizer } from '@financial-analysis/analysis';

export class PortfolioOptimizationTool {
  static readonly toolName = 'analyze_portfolio_optimization';
  static readonly description =
    'Portfolio optimization with mean-variance optimization, efficient frontier, asset allocation, and rebalancing recommendations';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      portfolio: {
        type: 'object',
        properties: {
          currentHoldings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                shares: { type: 'number', minimum: 0 },
                currentPrice: { type: 'number', minimum: 0 },
                assetClass: {
                  type: 'string',
                  enum: ['stock', 'bond', 'real-estate', 'commodity', 'cash', 'other'],
                },
              },
              required: ['symbol', 'shares', 'currentPrice', 'assetClass'],
            },
          },
          totalValue: { type: 'number', minimum: 0 },
        },
        required: ['currentHoldings', 'totalValue'],
      },
      constraints: {
        type: 'object',
        properties: {
          riskTolerance: {
            type: 'string',
            enum: ['conservative', 'moderate', 'aggressive'],
            default: 'moderate',
          },
          minAllocation: { type: 'number', minimum: 0, maximum: 1, default: 0 },
          maxAllocation: { type: 'number', minimum: 0, maximum: 1, default: 1 },
          targetReturn: { type: 'number', minimum: 0, maximum: 0.5 },
          maxRisk: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      marketData: {
        type: 'object',
        properties: {
          expectedReturns: {
            type: 'array',
            items: { type: 'number' },
          },
          volatilities: {
            type: 'array',
            items: { type: 'number' },
          },
          correlationMatrix: {
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
          includeEfficientFrontier: { type: 'boolean', default: true },
          includeRebalancing: { type: 'boolean', default: false },
        },
      },
    },
    required: ['portfolio', 'constraints'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = PortfolioOptimizationInputSchema.parse(args);
    return PortfolioOptimizer.analyze(validated);
  }
}
