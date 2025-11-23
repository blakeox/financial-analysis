/**
 * DCF (Discounted Cash Flow) Valuation MCP Tool
 * Wrapper for DCFValuationEngine to provide MCP integration
 */

import { DCFValuationEngine, DCFValuationInputSchema } from '@financial-analysis/analysis';

export class DCFAnalysisTool {
  static readonly toolName = 'analyze_dcf_valuation';
  static readonly description =
    'Comprehensive DCF valuation analysis including WACC calculation, cash flow projections, terminal value estimation, sensitivity analysis, and Monte Carlo simulation';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      companyData: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company name' },
          industry: { type: 'string', description: 'Industry' },
          size: { type: 'string', enum: ['small', 'medium', 'large', 'enterprise'], description: 'Company size' },
          country: { type: 'string', default: 'US', description: 'Country' },
          currency: { type: 'string', default: 'USD', description: 'Currency' },
        },
        required: ['name', 'industry', 'size'],
      },
      historicalFinancials: {
        type: 'object',
        properties: {
          revenue: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: { type: 'number', description: 'Year' },
                amount: { type: 'number', minimum: 0, description: 'Revenue amount' },
                growthRate: { type: 'number', description: 'Growth rate' },
              },
              required: ['year', 'amount', 'growthRate'],
            },
          },
          ebitda: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: { type: 'number', description: 'Year' },
                amount: { type: 'number', description: 'EBITDA amount' },
                margin: { type: 'number', minimum: 0, maximum: 1, description: 'EBITDA margin' },
              },
              required: ['year', 'amount', 'margin'],
            },
          },
        },
        required: ['revenue', 'ebitda'],
      },
      forecastAssumptions: {
        type: 'object',
        properties: {
          forecastPeriod: { type: 'number', minimum: 1, maximum: 10, default: 5, description: 'Forecast period (years)' },
          revenueGrowth: {
            type: 'object',
            properties: {
              year1: { type: 'number', description: 'Year 1 revenue growth' },
              year2: { type: 'number', description: 'Year 2 revenue growth' },
              year3: { type: 'number', description: 'Year 3 revenue growth' },
              year4: { type: 'number', description: 'Year 4 revenue growth' },
              year5: { type: 'number', description: 'Year 5 revenue growth' },
              terminalGrowth: { type: 'number', minimum: 0, maximum: 0.1, default: 0.025, description: 'Terminal growth rate' },
            },
            required: ['year1'],
          },
        },
        required: ['revenueGrowth'],
      },
      waccInput: {
        type: 'object',
        properties: {
          riskFreeRate: { type: 'number', minimum: 0, maximum: 1, default: 0.03, description: 'Risk-free rate' },
          marketRiskPremium: { type: 'number', minimum: 0, maximum: 1, default: 0.06, description: 'Market risk premium' },
          beta: { type: 'number', minimum: 0, maximum: 3, default: 1.0, description: 'Beta' },
          costOfDebt: { type: 'number', minimum: 0, maximum: 1, default: 0.05, description: 'Cost of debt' },
          debtToEquityRatio: { type: 'number', minimum: 0, maximum: 5, default: 0.3, description: 'Debt to equity ratio' },
          taxRate: { type: 'number', minimum: 0, maximum: 1, default: 0.25, description: 'Tax rate' },
        },
      },
      terminalValue: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['gordon-growth', 'exit-multiple'], default: 'gordon-growth', description: 'Terminal value method' },
          terminalGrowthRate: { type: 'number', minimum: 0, maximum: 0.1, default: 0.025, description: 'Terminal growth rate' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeSensitivity: { type: 'boolean', default: true, description: 'Include sensitivity analysis' },
          includeScenarios: { type: 'boolean', default: true, description: 'Include scenario analysis' },
          includeMonteCarlo: { type: 'boolean', default: false, description: 'Include Monte Carlo simulation' },
        },
      },
    },
    required: ['companyData', 'historicalFinancials', 'forecastAssumptions', 'waccInput'],
  };

  static async execute(input: unknown) {
    const validated = DCFValuationInputSchema.parse(input);
    return DCFValuationEngine.analyze(validated);
  }
}





