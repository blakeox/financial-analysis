/**
 * International Tax Planning MCP Tool
 */

import {
  InternationalTaxPlanningInputSchema,
  InternationalTaxPlanningOptimizer,
} from '@financial-analysis/analysis';

export class InternationalTaxPlanningTool {
  static readonly toolName = 'analyze_international_tax_planning';
  static readonly description =
    'International tax planning with foreign tax credits, tax treaties, transfer pricing, controlled foreign corporations, and BEPS compliance';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          citizenship: { type: 'string', description: 'Citizenship' },
          residency: { type: 'string', description: 'Country of residence' },
          filingStatus: {
            type: 'string',
            enum: ['single', 'married-joint', 'married-separate', 'head-of-household'],
            description: 'Filing status',
          },
        },
        required: ['citizenship', 'residency', 'filingStatus'],
      },
      income: {
        type: 'object',
        properties: {
          domesticIncome: { type: 'number', minimum: 0, description: 'Domestic income' },
          foreignIncome: { type: 'number', minimum: 0, default: 0, description: 'Foreign income' },
          foreignTaxPaid: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Foreign tax paid',
          },
        },
        required: ['domesticIncome'],
      },
      taxTreaties: {
        type: 'object',
        properties: {
          hasTaxTreaty: { type: 'boolean', default: false, description: 'Has tax treaty' },
          treatyCountry: { type: 'string', default: '', description: 'Treaty country' },
          treatyBenefits: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Treaty benefits',
          },
        },
      },
      businessStructure: {
        type: 'object',
        properties: {
          hasForeignEntity: { type: 'boolean', default: false, description: 'Has foreign entity' },
          entityType: {
            type: 'string',
            enum: ['corporation', 'partnership', 'branch', 'other'],
            default: 'corporation',
            description: 'Entity type',
          },
          transferPricing: {
            type: 'boolean',
            default: false,
            description: 'Transfer pricing applicable',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeForeignTaxCredit: {
            type: 'boolean',
            default: true,
            description: 'Include foreign tax credit',
          },
          includeTaxTreatyAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include tax treaty analysis',
          },
          includeTransferPricing: {
            type: 'boolean',
            default: true,
            description: 'Include transfer pricing',
          },
          includeCFCAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include CFC analysis',
          },
          includeBEPSCompliance: {
            type: 'boolean',
            default: true,
            description: 'Include BEPS compliance',
          },
        },
      },
    },
    required: ['personalInfo', 'income'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = InternationalTaxPlanningInputSchema.parse(args);
    return InternationalTaxPlanningOptimizer.analyze(validated);
  }
}
