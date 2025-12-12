/**
 * Accounts Receivable Aging MCP Tool
 */

import { AccountsReceivableAgingAnalyzer, AccountsReceivableAgingInputSchema } from '@financial-analysis/analysis';

export class AccountsReceivableAgingTool {
  static readonly toolName = 'analyze_accounts_receivable_aging';
  static readonly description =
    'Analyze accounts receivable aging, calculate DSO, forecast bad debt, optimize collection strategies, and improve credit policy';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      receivables: {
        type: 'object',
        properties: {
          totalReceivables: { type: 'number', minimum: 0, description: 'Total receivables' },
          invoices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                invoiceNumber: { type: 'string', description: 'Invoice number' },
                invoiceDate: { type: 'string', description: 'Invoice date (ISO format)' },
                dueDate: { type: 'string', description: 'Due date (ISO format)' },
                invoiceAmount: { type: 'number', minimum: 0, description: 'Invoice amount' },
                amountOutstanding: { type: 'number', minimum: 0, description: 'Amount outstanding' },
                daysOutstanding: { type: 'number', minimum: 0, description: 'Days outstanding' },
                agingBucket: {
                  type: 'string',
                  enum: ['current', '1-30', '31-60', '61-90', 'over-90'],
                  description: 'Aging bucket',
                },
              },
              required: ['invoiceNumber', 'invoiceDate', 'dueDate', 'invoiceAmount', 'amountOutstanding', 'daysOutstanding', 'agingBucket'],
            },
          },
        },
        required: ['totalReceivables', 'invoices'],
      },
      creditPolicy: {
        type: 'object',
        properties: {
          paymentTerms: { type: 'number', minimum: 0, default: 30, description: 'Payment terms (days)' },
          creditLimit: { type: 'number', minimum: 0, default: 0, description: 'Credit limit' },
        },
      },
      historicalData: {
        type: 'object',
        properties: {
          averageCollectionPeriod: { type: 'number', minimum: 0, default: 0, description: 'Average collection period (days)' },
          badDebtPercentage: { type: 'number', minimum: 0, maximum: 1, default: 0.02, description: 'Bad debt percentage' },
          annualSales: { type: 'number', minimum: 0, description: 'Annual sales' },
          annualCreditSales: { type: 'number', minimum: 0, description: 'Annual credit sales' },
        },
        required: ['annualSales', 'annualCreditSales'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeDSO: { type: 'boolean', default: true, description: 'Include DSO calculation' },
          includeAgingAnalysis: { type: 'boolean', default: true, description: 'Include aging analysis' },
          includeBadDebtForecast: { type: 'boolean', default: true, description: 'Include bad debt forecast' },
          includeCollectionRecommendations: { type: 'boolean', default: true, description: 'Include collection recommendations' },
          includeCreditPolicyOptimization: { type: 'boolean', default: true, description: 'Include credit policy optimization' },
        },
      },
    },
    required: ['receivables'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = AccountsReceivableAgingInputSchema.parse(args);
    return AccountsReceivableAgingAnalyzer.analyze(validated);
  }
}

