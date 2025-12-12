/**
 * Financial Ratio Analyzer MCP Tool
 */

import { FinancialRatioAnalyzer, FinancialRatioAnalyzerInputSchema } from '@financial-analysis/analysis';

export class FinancialRatioAnalyzerTool {
  static readonly toolName = 'analyze_financial_ratios';
  static readonly description =
    'Comprehensive financial ratio analysis with liquidity, profitability, efficiency, leverage, and market ratios with industry benchmarking';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      financialStatements: {
        type: 'object',
        properties: {
          balanceSheet: {
            type: 'object',
            properties: {
              currentAssets: { type: 'number', minimum: 0, description: 'Current assets' },
              totalAssets: { type: 'number', minimum: 0, description: 'Total assets' },
              currentLiabilities: { type: 'number', minimum: 0, description: 'Current liabilities' },
              totalLiabilities: { type: 'number', minimum: 0, description: 'Total liabilities' },
              totalEquity: { type: 'number', description: 'Total equity' },
              cash: { type: 'number', minimum: 0, description: 'Cash' },
              accountsReceivable: { type: 'number', minimum: 0, description: 'Accounts receivable' },
              inventory: { type: 'number', minimum: 0, description: 'Inventory' },
              accountsPayable: { type: 'number', minimum: 0, description: 'Accounts payable' },
              shortTermDebt: { type: 'number', minimum: 0, description: 'Short-term debt' },
              longTermDebt: { type: 'number', minimum: 0, description: 'Long-term debt' },
            },
            required: ['currentAssets', 'totalAssets', 'currentLiabilities', 'totalLiabilities', 'totalEquity'],
          },
          incomeStatement: {
            type: 'object',
            properties: {
              revenue: { type: 'number', minimum: 0, description: 'Revenue' },
              costOfGoodsSold: { type: 'number', minimum: 0, description: 'Cost of goods sold' },
              grossProfit: { type: 'number', description: 'Gross profit' },
              operatingExpenses: { type: 'number', minimum: 0, description: 'Operating expenses' },
              ebitda: { type: 'number', description: 'EBITDA' },
              ebit: { type: 'number', description: 'EBIT' },
              netIncome: { type: 'number', description: 'Net income' },
              interestExpense: { type: 'number', minimum: 0, default: 0, description: 'Interest expense' },
              taxExpense: { type: 'number', minimum: 0, default: 0, description: 'Tax expense' },
            },
            required: ['revenue', 'costOfGoodsSold', 'grossProfit', 'operatingExpenses', 'ebitda', 'ebit', 'netIncome'],
          },
          cashFlowStatement: {
            type: 'object',
            properties: {
              operatingCashFlow: { type: 'number', description: 'Operating cash flow' },
              capitalExpenditures: { type: 'number', minimum: 0, default: 0, description: 'Capital expenditures' },
              freeCashFlow: { type: 'number', description: 'Free cash flow' },
            },
            required: ['operatingCashFlow', 'freeCashFlow'],
          },
        },
        required: ['balanceSheet', 'incomeStatement', 'cashFlowStatement'],
      },
      marketData: {
        type: 'object',
        properties: {
          sharePrice: { type: 'number', minimum: 0, description: 'Share price' },
          sharesOutstanding: { type: 'number', minimum: 0, description: 'Shares outstanding' },
          industryAverages: {
            type: 'object',
            properties: {
              currentRatio: { type: 'number', minimum: 0, description: 'Industry current ratio' },
              roe: { type: 'number', description: 'Industry ROE' },
              debtToEquity: { type: 'number', minimum: 0, description: 'Industry debt-to-equity' },
            },
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeLiquidityRatios: { type: 'boolean', default: true, description: 'Include liquidity ratios' },
          includeProfitabilityRatios: { type: 'boolean', default: true, description: 'Include profitability ratios' },
          includeEfficiencyRatios: { type: 'boolean', default: true, description: 'Include efficiency ratios' },
          includeLeverageRatios: { type: 'boolean', default: true, description: 'Include leverage ratios' },
          includeMarketRatios: { type: 'boolean', default: true, description: 'Include market ratios' },
          includeBenchmarking: { type: 'boolean', default: true, description: 'Include benchmarking' },
        },
      },
    },
    required: ['financialStatements'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = FinancialRatioAnalyzerInputSchema.parse(args);
    return FinancialRatioAnalyzer.analyze(validated);
  }
}


