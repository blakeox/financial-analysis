/**
 * Supply Chain Finance MCP Tool
 */

import {
  SupplyChainFinanceInputSchema,
  SupplyChainFinanceOptimizer,
} from '@financial-analysis/analysis';

export class SupplyChainFinanceTool {
  static readonly toolName = 'analyze_supply_chain_finance';
  static readonly description =
    'Optimize supply chain finance with dynamic discounting, reverse factoring, inventory financing, and working capital optimization';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      companyInfo: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Company name' },
          industry: { type: 'string', description: 'Industry' },
          annualRevenue: { type: 'number', minimum: 0, description: 'Annual revenue' },
        },
        required: ['companyName', 'industry', 'annualRevenue'],
      },
      supplyChain: {
        type: 'object',
        properties: {
          accountsPayable: { type: 'number', minimum: 0, description: 'Accounts payable' },
          accountsReceivable: { type: 'number', minimum: 0, description: 'Accounts receivable' },
          inventory: { type: 'number', minimum: 0, description: 'Inventory' },
          averagePaymentTerms: {
            type: 'number',
            minimum: 0,
            default: 30,
            description: 'Average payment terms (days)',
          },
          averageCollectionTerms: {
            type: 'number',
            minimum: 0,
            default: 30,
            description: 'Average collection terms (days)',
          },
        },
        required: ['accountsPayable', 'accountsReceivable', 'inventory'],
      },
      financingOptions: {
        type: 'object',
        properties: {
          dynamicDiscounting: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
                default: false,
                description: 'Dynamic discounting enabled',
              },
              discountRate: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                default: 0.02,
                description: 'Discount rate',
              },
            },
          },
          reverseFactoring: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
                default: false,
                description: 'Reverse factoring enabled',
              },
              financingRate: {
                type: 'number',
                minimum: 0,
                maximum: 0.2,
                default: 0.08,
                description: 'Financing rate',
              },
            },
          },
          inventoryFinancing: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
                default: false,
                description: 'Inventory financing enabled',
              },
              financingRate: {
                type: 'number',
                minimum: 0,
                maximum: 0.2,
                default: 0.1,
                description: 'Financing rate',
              },
            },
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeWorkingCapital: {
            type: 'boolean',
            default: true,
            description: 'Include working capital analysis',
          },
          includeCashFlow: {
            type: 'boolean',
            default: true,
            description: 'Include cash flow analysis',
          },
          includeCostBenefit: {
            type: 'boolean',
            default: true,
            description: 'Include cost-benefit analysis',
          },
          includeScenarioAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include scenario analysis',
          },
        },
      },
    },
    required: ['companyInfo', 'supplyChain'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = SupplyChainFinanceInputSchema.parse(args);
    return SupplyChainFinanceOptimizer.analyze(validated);
  }
}
