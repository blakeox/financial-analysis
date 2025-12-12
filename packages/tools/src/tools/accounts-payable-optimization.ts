/**
 * Accounts Payable Optimization MCP Tool
 */

import { AccountsPayableOptimizationInputSchema, AccountsPayableOptimizer } from '@financial-analysis/analysis';

export class AccountsPayableOptimizationTool {
  static readonly toolName = 'analyze_accounts_payable_optimization';
  static readonly description =
    'Optimize accounts payable with early payment discounts, payment term analysis, cash flow optimization, and vendor relationship management';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      payables: {
        type: 'object',
        properties: {
          totalPayables: { type: 'number', minimum: 0, description: 'Total payables' },
          invoices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                invoiceNumber: { type: 'string', description: 'Invoice number' },
                vendorName: { type: 'string', description: 'Vendor name' },
                invoiceDate: { type: 'string', description: 'Invoice date (ISO format)' },
                dueDate: { type: 'string', description: 'Due date (ISO format)' },
                invoiceAmount: { type: 'number', minimum: 0, description: 'Invoice amount' },
                paymentTerms: { type: 'string', description: 'Payment terms' },
                earlyPaymentDiscount: {
                  type: 'object',
                  properties: {
                    discountPercentage: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Discount percentage' },
                    discountDays: { type: 'number', minimum: 0, default: 0, description: 'Discount days' },
                  },
                },
              },
              required: ['invoiceNumber', 'vendorName', 'invoiceDate', 'dueDate', 'invoiceAmount', 'paymentTerms'],
            },
          },
        },
        required: ['totalPayables', 'invoices'],
      },
      cashFlow: {
        type: 'object',
        properties: {
          currentCash: { type: 'number', minimum: 0, description: 'Current cash' },
          monthlyCashFlow: { type: 'number', description: 'Monthly cash flow' },
          costOfCapital: { type: 'number', minimum: 0, maximum: 0.5, default: 0.1, description: 'Cost of capital' },
        },
        required: ['currentCash', 'monthlyCashFlow', 'costOfCapital'],
      },
      strategy: {
        type: 'object',
        properties: {
          optimizeFor: {
            type: 'string',
            enum: ['max-discounts', 'cash-flow', 'vendor-relationships', 'balanced'],
            default: 'balanced',
            description: 'Optimization goal',
          },
          includeEarlyPaymentAnalysis: { type: 'boolean', default: true, description: 'Include early payment analysis' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeDiscountAnalysis: { type: 'boolean', default: true, description: 'Include discount analysis' },
          includeCashFlowImpact: { type: 'boolean', default: true, description: 'Include cash flow impact' },
          includePaymentSchedule: { type: 'boolean', default: true, description: 'Include payment schedule' },
          includeVendorAnalysis: { type: 'boolean', default: true, description: 'Include vendor analysis' },
        },
      },
    },
    required: ['payables', 'cashFlow'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = AccountsPayableOptimizationInputSchema.parse(args);
    return AccountsPayableOptimizer.analyze(validated);
  }
}

