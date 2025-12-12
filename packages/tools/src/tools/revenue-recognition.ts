/**
 * Revenue Recognition MCP Tool
 */

import { RevenueRecognitionInputSchema, RevenueRecognitionCalculator } from '@financial-analysis/analysis';

export class RevenueRecognitionTool {
  static readonly toolName = 'analyze_revenue_recognition';
  static readonly description =
    'ASC 606 compliant revenue recognition analysis with performance obligation allocation, deferred revenue, and contract asset calculations';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      companyInfo: {
        type: 'object',
        properties: {
          industry: { type: 'string', description: 'Industry' },
          revenueModel: {
            type: 'string',
            enum: ['product', 'service', 'subscription', 'licensing', 'mixed'],
            default: 'service',
            description: 'Revenue model',
          },
          accountingStandard: {
            type: 'string',
            enum: ['asc-606', 'ifrs-15', 'other'],
            default: 'asc-606',
            description: 'Accounting standard',
          },
        },
      },
      contracts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            contractId: { type: 'string', description: 'Contract ID' },
            contractValue: { type: 'number', minimum: 0, description: 'Contract value' },
            contractStartDate: { type: 'string', description: 'Contract start date (ISO format)' },
            contractEndDate: { type: 'string', description: 'Contract end date (ISO format)' },
            performanceObligations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  obligationId: { type: 'string', description: 'Obligation ID' },
                  standaloneSellingPrice: { type: 'number', minimum: 0, description: 'Standalone selling price' },
                  fulfillmentMethod: {
                    type: 'string',
                    enum: ['over-time', 'point-in-time'],
                    description: 'Fulfillment method',
                  },
                },
                required: ['obligationId', 'standaloneSellingPrice', 'fulfillmentMethod'],
              },
            },
            paymentTerms: {
              type: 'object',
              properties: {
                upfrontPayment: { type: 'number', minimum: 0, default: 0, description: 'Upfront payment' },
              },
            },
          },
          required: ['contractId', 'contractValue', 'contractStartDate', 'contractEndDate', 'performanceObligations'],
        },
        minItems: 1,
      },
      analysis: {
        type: 'object',
        properties: {
          includeRevenueSchedule: { type: 'boolean', default: true, description: 'Include revenue schedule' },
          includeDeferredRevenue: { type: 'boolean', default: true, description: 'Include deferred revenue' },
          includeContractAssetAnalysis: { type: 'boolean', default: true, description: 'Include contract asset analysis' },
          includeComplianceCheck: { type: 'boolean', default: true, description: 'Include compliance check' },
          projectionPeriod: { type: 'number', minimum: 1, maximum: 10, default: 5, description: 'Projection period (years)' },
        },
        required: ['projectionPeriod'],
      },
    },
    required: ['contracts'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = RevenueRecognitionInputSchema.parse(args);
    return RevenueRecognitionCalculator.analyze(validated);
  }
}

