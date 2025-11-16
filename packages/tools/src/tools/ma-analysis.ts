/**
 * M&A (Mergers & Acquisitions) Analysis MCP Tool
 * Wrapper for MAAnalysisEngine to provide MCP integration
 */

import { MAAnalysisEngine, MAAnalysisInputSchema } from '@financial-analysis/analysis';

export class MAAnalysisTool {
  static readonly toolName = 'analyze_ma_deal';
  static readonly description =
    'Comprehensive M&A deal analysis including synergy analysis, accretion/dilution, integration planning, value creation, sensitivity and scenario analysis';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      transaction: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['merger', 'acquisition', 'divestiture', 'spin-off', 'joint-venture'],
            description: 'Transaction type',
          },
          structure: {
            type: 'string',
            enum: ['cash', 'stock', 'mixed', 'asset-purchase', 'stock-purchase'],
            description: 'Transaction structure',
          },
          announcementDate: { type: 'string', description: 'Announcement date (ISO format)' },
          expectedClosingDate: { type: 'string', description: 'Expected closing date (ISO format)' },
          status: {
            type: 'string',
            enum: ['announced', 'pending', 'completed', 'terminated'],
            description: 'Transaction status',
          },
        },
        required: ['type', 'structure', 'announcementDate', 'expectedClosingDate', 'status'],
      },
      acquirer: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Acquirer company name' },
          ticker: { type: 'string', description: 'Stock ticker' },
          marketCap: { type: 'number', minimum: 0, description: 'Market capitalization' },
          enterpriseValue: { type: 'number', minimum: 0, description: 'Enterprise value' },
          sharesOutstanding: { type: 'number', minimum: 0, description: 'Shares outstanding' },
          currentPrice: { type: 'number', minimum: 0, description: 'Current stock price' },
          revenue: { type: 'number', minimum: 0, description: 'Revenue' },
          ebitda: { type: 'number', description: 'EBITDA' },
          netIncome: { type: 'number', description: 'Net income' },
          totalDebt: { type: 'number', minimum: 0, description: 'Total debt' },
          cashAndEquivalents: { type: 'number', minimum: 0, description: 'Cash and equivalents' },
          beta: { type: 'number', minimum: 0, maximum: 3, default: 1.0, description: 'Beta' },
          creditRating: { type: 'string', description: 'Credit rating' },
        },
        required: ['name', 'ticker', 'marketCap', 'revenue'],
      },
      target: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Target company name' },
          ticker: { type: 'string', description: 'Stock ticker' },
          marketCap: { type: 'number', minimum: 0, description: 'Market capitalization' },
          enterpriseValue: { type: 'number', minimum: 0, description: 'Enterprise value' },
          sharesOutstanding: { type: 'number', minimum: 0, description: 'Shares outstanding' },
          currentPrice: { type: 'number', minimum: 0, description: 'Current stock price' },
          revenue: { type: 'number', minimum: 0, description: 'Revenue' },
          ebitda: { type: 'number', description: 'EBITDA' },
          netIncome: { type: 'number', description: 'Net income' },
          totalDebt: { type: 'number', minimum: 0, description: 'Total debt' },
          cashAndEquivalents: { type: 'number', minimum: 0, description: 'Cash and equivalents' },
          beta: { type: 'number', minimum: 0, maximum: 3, default: 1.0, description: 'Beta' },
          creditRating: { type: 'string', description: 'Credit rating' },
        },
        required: ['name', 'marketCap', 'revenue'],
      },
      transactionTerms: {
        type: 'object',
        properties: {
          purchasePrice: { type: 'number', minimum: 0, description: 'Purchase price' },
          cashConsideration: { type: 'number', minimum: 0, description: 'Cash consideration' },
          stockConsideration: { type: 'number', minimum: 0, description: 'Stock consideration' },
          exchangeRatio: { type: 'number', minimum: 0, description: 'Exchange ratio' },
          premium: { type: 'number', minimum: 0, maximum: 2, description: 'Premium as multiple' },
          financing: {
            type: 'object',
            properties: {
              newDebt: { type: 'number', minimum: 0, description: 'New debt' },
              cashOnHand: { type: 'number', minimum: 0, description: 'Cash on hand' },
              equityIssuance: { type: 'number', minimum: 0, description: 'Equity issuance' },
              otherSources: { type: 'number', minimum: 0, description: 'Other financing' },
            },
            required: ['newDebt', 'cashOnHand', 'equityIssuance', 'otherSources'],
          },
        },
        required: ['purchasePrice', 'financing'],
      },
      synergies: {
        type: 'object',
        properties: {
          costSynergies: {
            type: 'object',
            properties: {
              annualAmount: { type: 'number', minimum: 0, description: 'Annual cost synergies' },
              realizationPeriod: { type: 'number', minimum: 1, maximum: 5, default: 3, description: 'Years to realize' },
              probability: { type: 'number', minimum: 0, maximum: 1, default: 0.8, description: 'Probability' },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Category name' },
                    amount: { type: 'number', minimum: 0, description: 'Annual amount' },
                    timing: { type: 'number', minimum: 1, maximum: 5, description: 'Years' },
                  },
                },
              },
            },
            required: ['annualAmount', 'realizationPeriod', 'probability'],
          },
          revenueSynergies: {
            type: 'object',
            properties: {
              annualAmount: { type: 'number', minimum: 0, description: 'Annual revenue synergies' },
              realizationPeriod: { type: 'number', minimum: 1, maximum: 5, default: 3, description: 'Years to realize' },
              probability: { type: 'number', minimum: 0, maximum: 1, default: 0.6, description: 'Probability' },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Category name' },
                    amount: { type: 'number', minimum: 0, description: 'Annual amount' },
                    timing: { type: 'number', minimum: 1, maximum: 5, description: 'Years' },
                  },
                },
              },
            },
            required: ['annualAmount', 'realizationPeriod', 'probability'],
          },
          taxSynergies: {
            type: 'object',
            properties: {
              annualAmount: { type: 'number', minimum: 0, description: 'Annual tax synergies' },
              realizationPeriod: { type: 'number', minimum: 1, maximum: 5, default: 2, description: 'Years to realize' },
              probability: { type: 'number', minimum: 0, maximum: 1, default: 0.7, description: 'Probability' },
            },
            required: ['annualAmount', 'realizationPeriod', 'probability'],
          },
        },
        required: ['costSynergies', 'revenueSynergies', 'taxSynergies'],
      },
      integration: {
        type: 'object',
        properties: {
          timeline: { type: 'number', minimum: 1, maximum: 10, default: 2, description: 'Integration timeline (years)' },
          costs: {
            type: 'object',
            properties: {
              oneTimeCosts: { type: 'number', minimum: 0, description: 'One-time integration costs' },
              annualCosts: { type: 'number', minimum: 0, description: 'Annual integration costs' },
              duration: { type: 'number', minimum: 1, maximum: 5, default: 2, description: 'Cost duration (years)' },
            },
            required: ['oneTimeCosts', 'annualCosts', 'duration'],
          },
          risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', description: 'Risk category' },
                description: { type: 'string', description: 'Risk description' },
                probability: { type: 'number', minimum: 0, maximum: 1, description: 'Probability' },
                impact: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Impact level' },
                mitigation: { type: 'string', description: 'Mitigation strategy' },
              },
              required: ['category', 'description', 'probability', 'impact', 'mitigation'],
            },
          },
        },
        required: ['timeline', 'costs', 'risks'],
      },
      analysis: {
        type: 'object',
        properties: {
          discountRate: { type: 'number', minimum: 0, maximum: 1, default: 0.1, description: 'Discount rate' },
          taxRate: { type: 'number', minimum: 0, maximum: 1, default: 0.25, description: 'Tax rate' },
          terminalGrowthRate: { type: 'number', minimum: 0, maximum: 0.1, default: 0.025, description: 'Terminal growth rate' },
          includeAccretionDilution: { type: 'boolean', default: true, description: 'Include accretion/dilution analysis' },
          includeSensitivity: { type: 'boolean', default: true, description: 'Include sensitivity analysis' },
          includeScenarios: { type: 'boolean', default: true, description: 'Include scenario analysis' },
          forecastPeriod: { type: 'number', minimum: 3, maximum: 10, default: 5, description: 'Forecast period (years)' },
        },
        required: ['discountRate', 'taxRate', 'terminalGrowthRate'],
      },
    },
    required: ['transaction', 'acquirer', 'target', 'transactionTerms', 'synergies', 'integration', 'analysis'],
  };

  static async execute(input: unknown) {
    const validated = MAAnalysisInputSchema.parse(input);
    return MAAnalysisEngine.analyze(validated);
  }
}




