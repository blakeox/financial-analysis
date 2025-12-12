/**
 * Business Succession Planning MCP Tool
 */

import { BusinessSuccessionPlanningInputSchema, BusinessSuccessionPlanningCalculator } from '@financial-analysis/analysis';

export class BusinessSuccessionPlanningTool {
  static readonly toolName = 'analyze_business_succession_planning';
  static readonly description =
    'Business succession planning with valuation, buy-sell agreements, estate tax planning, gifting strategies, and transition scenarios';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      businessInfo: {
        type: 'object',
        properties: {
          businessName: { type: 'string', description: 'Business name' },
          businessType: {
            type: 'string',
            enum: ['sole-proprietorship', 'partnership', 'llc', 's-corp', 'c-corp'],
            default: 'llc',
            description: 'Business type',
          },
          annualRevenue: { type: 'number', minimum: 0, description: 'Annual revenue' },
          businessValue: { type: 'number', minimum: 0, description: 'Business value' },
        },
        required: ['businessName', 'businessType', 'annualRevenue', 'businessValue'],
      },
      ownerInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Owner age' },
          ownershipPercentage: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'Ownership percentage' },
          expectedRetirementAge: { type: 'number', minimum: 50, maximum: 100, default: 65, description: 'Expected retirement age' },
        },
        required: ['age', 'expectedRetirementAge'],
      },
      successionOptions: {
        type: 'object',
        properties: {
          successionType: {
            type: 'string',
            enum: ['family-transfer', 'key-employee', 'third-party-sale', 'esop', 'liquidation'],
            default: 'family-transfer',
            description: 'Succession type',
          },
          hasBuySellAgreement: { type: 'boolean', default: false, description: 'Has buy-sell agreement' },
          buySellFunding: {
            type: 'string',
            enum: ['life-insurance', 'sinking-fund', 'installment-sale', 'other'],
            default: 'life-insurance',
            description: 'Buy-sell funding method',
          },
        },
      },
      estatePlanning: {
        type: 'object',
        properties: {
          estateTaxExemption: { type: 'number', minimum: 0, default: 12920000, description: 'Estate tax exemption' },
          includeGiftingStrategy: { type: 'boolean', default: true, description: 'Include gifting strategy' },
          annualGiftExclusion: { type: 'number', minimum: 0, default: 18000, description: 'Annual gift exclusion' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeValuation: { type: 'boolean', default: true, description: 'Include valuation' },
          includeTaxAnalysis: { type: 'boolean', default: true, description: 'Include tax analysis' },
          includeTransitionPlan: { type: 'boolean', default: true, description: 'Include transition plan' },
          includeFundingAnalysis: { type: 'boolean', default: true, description: 'Include funding analysis' },
          projectionYears: { type: 'number', minimum: 1, maximum: 30, default: 10, description: 'Projection years' },
        },
        required: ['projectionYears'],
      },
    },
    required: ['businessInfo', 'ownerInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = BusinessSuccessionPlanningInputSchema.parse(args);
    return BusinessSuccessionPlanningCalculator.analyze(validated);
  }
}


