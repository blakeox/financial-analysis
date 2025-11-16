/**
 * CCA (Comparable Company Analysis) Valuation MCP Tool
 * Wrapper for CCAValuationEngine to provide MCP integration
 */

import { CCAValuationEngine, CCAValuationInputSchema } from '@financial-analysis/analysis';

export class CCAAnalysisTool {
  static readonly toolName = 'analyze_cca_valuation';
  static readonly description =
    'Comprehensive CCA (Comparable Company Analysis) valuation including trading multiples calculation, peer group analysis, premium/discount analysis, and valuation range determination';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      targetCompany: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Target company name' },
          industry: { type: 'string', description: 'Industry' },
          size: { type: 'string', enum: ['small', 'medium', 'large', 'enterprise'], description: 'Company size' },
          country: { type: 'string', default: 'US', description: 'Country' },
          currency: { type: 'string', default: 'USD', description: 'Currency' },
        },
        required: ['name', 'industry', 'size'],
      },
      targetFinancials: {
        type: 'object',
        properties: {
          marketCap: { type: 'number', minimum: 0, description: 'Market capitalization' },
          enterpriseValue: { type: 'number', minimum: 0, description: 'Enterprise value' },
          revenue: { type: 'number', minimum: 0, description: 'Revenue' },
          ebitda: { type: 'number', description: 'EBITDA' },
          ebit: { type: 'number', description: 'EBIT' },
          netIncome: { type: 'number', description: 'Net income' },
          totalDebt: { type: 'number', minimum: 0, description: 'Total debt' },
          cashAndEquivalents: { type: 'number', minimum: 0, description: 'Cash and equivalents' },
          sharesOutstanding: { type: 'number', minimum: 0, description: 'Shares outstanding' },
          bookValue: { type: 'number', minimum: 0, description: 'Book value' },
          freeCashFlow: { type: 'number', description: 'Free cash flow' },
          capex: { type: 'number', minimum: 0, description: 'Capital expenditures' },
          depreciation: { type: 'number', minimum: 0, description: 'Depreciation' },
        },
        required: ['marketCap', 'revenue', 'ebitda', 'netIncome', 'sharesOutstanding'],
      },
      peerGroupCriteria: {
        type: 'object',
        properties: {
          industry: {
            type: 'array',
            items: { type: 'string' },
            description: 'Industry filters',
          },
          sizeRange: {
            type: 'object',
            properties: {
              minRevenue: { type: 'number', minimum: 0, description: 'Minimum revenue' },
              maxRevenue: { type: 'number', minimum: 0, description: 'Maximum revenue' },
            },
            required: ['minRevenue', 'maxRevenue'],
          },
          geography: {
            type: 'array',
            items: { type: 'string' },
            default: ['US'],
            description: 'Geographic filters',
          },
        },
        required: ['industry', 'sizeRange'],
      },
      peerCompanies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Company name' },
            ticker: { type: 'string', description: 'Stock ticker' },
            revenue: { type: 'number', minimum: 0, description: 'Revenue' },
            ebitda: { type: 'number', description: 'EBITDA' },
            marketCap: { type: 'number', minimum: 0, description: 'Market cap' },
            enterpriseValue: { type: 'number', minimum: 0, description: 'Enterprise value' },
            netIncome: { type: 'number', description: 'Net income' },
            sharesOutstanding: { type: 'number', minimum: 0, description: 'Shares outstanding' },
          },
          required: ['name', 'ticker', 'revenue', 'ebitda', 'marketCap', 'enterpriseValue'],
        },
        description: 'Peer companies data',
      },
      analysis: {
        type: 'object',
        properties: {
          multiplesToCalculate: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['ev-revenue', 'ev-ebitda', 'ev-ebit', 'ev-fcf', 'pe', 'pb', 'ps'],
            },
            default: ['ev-revenue', 'ev-ebitda', 'ev-ebit', 'pe', 'pb'],
            description: 'Multiples to calculate',
          },
          excludeOutliers: { type: 'boolean', default: true, description: 'Exclude outliers' },
          includeMedian: { type: 'boolean', default: true, description: 'Include median' },
          includeMean: { type: 'boolean', default: true, description: 'Include mean' },
        },
      },
      valuation: {
        type: 'object',
        properties: {
          applyPremiumsDiscounts: { type: 'boolean', default: true, description: 'Apply premiums/discounts' },
          controlPremium: { type: 'number', minimum: 0, maximum: 1, default: 0.2, description: 'Control premium' },
          liquidityDiscount: { type: 'number', minimum: 0, maximum: 1, default: 0.15, description: 'Liquidity discount' },
        },
      },
    },
    required: ['targetCompany', 'targetFinancials', 'peerGroupCriteria', 'peerCompanies'],
  };

  static async execute(input: unknown) {
    const validated = CCAValuationInputSchema.parse(input);
    return CCAValuationEngine.analyze(validated);
  }
}




