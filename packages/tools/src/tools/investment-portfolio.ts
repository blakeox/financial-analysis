/**
 * Investment Portfolio MCP Tool
 * Wrapper for InvestmentPortfolioAnalyzer to provide MCP integration
 */

import {
  InvestmentPortfolioAnalyzer,
  InvestmentPortfolioInputSchema,
} from '@financial-analysis/analysis';

export class InvestmentPortfolioTool {
  static readonly toolName = 'analyze_investment_portfolio';
  static readonly description =
    'Comprehensive investment portfolio analysis including asset allocation optimization, risk-return analysis, rebalancing strategies, tax-loss harvesting, performance tracking, and Monte Carlo portfolio simulation';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      portfolio: {
        type: 'object',
        properties: {
          totalValue: { type: 'number', minimum: 0, description: 'Total portfolio value' },
          currency: { type: 'string', default: 'USD', description: 'Portfolio currency' },
          investmentHorizon: {
            type: 'number',
            minimum: 1,
            maximum: 50,
            default: 20,
            description: 'Investment horizon in years',
          },
          riskTolerance: {
            type: 'string',
            enum: ['conservative', 'moderate', 'aggressive'],
            default: 'moderate',
            description: 'Risk tolerance level',
          },
        },
        required: ['totalValue'],
      },
      holdings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Investment symbol' },
            name: { type: 'string', description: 'Investment name' },
            assetClass: {
              type: 'string',
              enum: [
                'stocks',
                'bonds',
                'real-estate',
                'commodities',
                'cash',
                'crypto',
                'alternatives',
              ],
              description: 'Asset class',
            },
            subAssetClass: { type: 'string', description: 'Sub-asset class' },
            shares: { type: 'number', minimum: 0, description: 'Number of shares' },
            currentPrice: { type: 'number', minimum: 0, description: 'Current price per share' },
            costBasis: { type: 'number', minimum: 0, description: 'Cost basis per share' },
            purchaseDate: { type: 'string', description: 'Purchase date' },
            accountType: {
              type: 'string',
              enum: ['taxable', 'traditional-ira', 'roth-ira', '401k', 'hsa'],
              default: 'taxable',
              description: 'Account type',
            },
          },
          required: [
            'symbol',
            'name',
            'assetClass',
            'shares',
            'currentPrice',
            'costBasis',
            'purchaseDate',
          ],
        },
        description: 'Portfolio holdings',
      },
      targetAllocation: {
        type: 'object',
        properties: {
          stocks: { type: 'number', minimum: 0, maximum: 1, default: 0.6 },
          bonds: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
          realEstate: { type: 'number', minimum: 0, maximum: 1, default: 0.05 },
          commodities: { type: 'number', minimum: 0, maximum: 1, default: 0.02 },
          cash: { type: 'number', minimum: 0, maximum: 1, default: 0.03 },
          crypto: { type: 'number', minimum: 0, maximum: 1, default: 0 },
          alternatives: { type: 'number', minimum: 0, maximum: 1, default: 0 },
        },
        description: 'Target asset allocation',
      },
      assumptions: {
        type: 'object',
        properties: {
          expectedReturn: {
            type: 'object',
            properties: {
              stocks: { type: 'number', minimum: 0, maximum: 0.2, default: 0.08 },
              bonds: { type: 'number', minimum: 0, maximum: 0.1, default: 0.04 },
              realEstate: { type: 'number', minimum: 0, maximum: 0.15, default: 0.06 },
              commodities: { type: 'number', minimum: 0, maximum: 0.15, default: 0.05 },
              cash: { type: 'number', minimum: 0, maximum: 0.05, default: 0.02 },
              crypto: { type: 'number', minimum: 0, maximum: 0.5, default: 0.12 },
              alternatives: { type: 'number', minimum: 0, maximum: 0.2, default: 0.07 },
            },
          },
          volatility: {
            type: 'object',
            properties: {
              stocks: { type: 'number', minimum: 0, maximum: 1, default: 0.16 },
              bonds: { type: 'number', minimum: 0, maximum: 1, default: 0.06 },
              realEstate: { type: 'number', minimum: 0, maximum: 1, default: 0.12 },
              commodities: { type: 'number', minimum: 0, maximum: 1, default: 0.18 },
              cash: { type: 'number', minimum: 0, maximum: 1, default: 0.01 },
              crypto: { type: 'number', minimum: 0, maximum: 1, default: 0.4 },
              alternatives: { type: 'number', minimum: 0, maximum: 1, default: 0.15 },
            },
          },
        },
        description: 'Investment assumptions',
      },
      analysis: {
        type: 'object',
        properties: {
          includeRebalancing: { type: 'boolean', default: true },
          includeTaxOptimization: { type: 'boolean', default: true },
          includeMonteCarlo: { type: 'boolean', default: true },
          includePerformanceAnalysis: { type: 'boolean', default: true },
          monteCarloSimulations: { type: 'number', minimum: 1000, maximum: 100000, default: 10000 },
          rebalancingFrequency: {
            type: 'string',
            enum: ['monthly', 'quarterly', 'annually'],
            default: 'annually',
          },
          taxLossHarvesting: { type: 'boolean', default: true },
        },
        description: 'Analysis parameters',
      },
      taxInfo: {
        type: 'object',
        properties: {
          taxBracket: { type: 'number', minimum: 0, maximum: 0.5, default: 0.22 },
          capitalGainsRate: { type: 'number', minimum: 0, maximum: 0.5, default: 0.15 },
          stateTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.05 },
          taxLossHarvestingThreshold: { type: 'number', minimum: 0, default: 1000 },
        },
        description: 'Tax information',
      },
      benchmark: {
        type: 'object',
        properties: {
          symbol: { type: 'string', default: 'SPY', description: 'Benchmark symbol' },
          name: { type: 'string', default: 'S&P 500', description: 'Benchmark name' },
          expectedReturn: { type: 'number', minimum: 0, maximum: 0.2, default: 0.08 },
          volatility: { type: 'number', minimum: 0, maximum: 1, default: 0.16 },
        },
        description: 'Performance benchmark',
      },
    },
    required: ['portfolio', 'holdings', 'targetAllocation'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input
      const validatedInput = InvestmentPortfolioInputSchema.parse(input);

      // Perform analysis
      const result = InvestmentPortfolioAnalyzer.analyze(validatedInput);

      return {
        success: true,
        data: result,
        metadata: {
          tool: InvestmentPortfolioTool.toolName,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          tool: InvestmentPortfolioTool.toolName,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
