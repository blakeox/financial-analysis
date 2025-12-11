/**
 * Estate Planning Calculator MCP Tool
 */

import { EstatePlanningCalculator, EstatePlanningInputSchema } from '@financial-analysis/analysis';

export class EstatePlanningTool {
  static readonly toolName = 'analyze_estate_planning';
  static readonly description =
    'Estate tax planning, inheritance projections, trust analysis, and gift tax optimization';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100 },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed'],
          },
          stateOfResidence: { type: 'string' },
        },
        required: ['age', 'maritalStatus', 'stateOfResidence'],
      },
      assets: {
        type: 'object',
        properties: {
          totalAssets: { type: 'number', minimum: 0 },
          realEstate: { type: 'number', minimum: 0 },
          investments: { type: 'number', minimum: 0 },
          retirementAccounts: { type: 'number', minimum: 0 },
          businessInterests: { type: 'number', minimum: 0, default: 0 },
          otherAssets: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['totalAssets', 'realEstate', 'investments', 'retirementAccounts'],
      },
      estatePlan: {
        type: 'object',
        properties: {
          hasWill: { type: 'boolean', default: false },
          hasTrust: { type: 'boolean', default: false },
          beneficiaries: { type: 'number', minimum: 0, maximum: 20, default: 1 },
          charitableGiving: { type: 'number', minimum: 0, default: 0 },
        },
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalEstateTaxExemption: { type: 'number', minimum: 0, default: 12920000 },
          stateEstateTaxExemption: { type: 'number', minimum: 0, default: 0 },
          expectedGrowthRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.05 },
          yearsToProject: { type: 'number', minimum: 1, maximum: 50, default: 20 },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeEstateTaxProjection: { type: 'boolean', default: true },
          includeInheritanceProjection: { type: 'boolean', default: true },
          includeTrustAnalysis: { type: 'boolean', default: false },
        },
      },
    },
    required: ['personalInfo', 'assets', 'estatePlan', 'taxInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = EstatePlanningInputSchema.parse(args);
    return EstatePlanningCalculator.analyze(validated);
  }
}
