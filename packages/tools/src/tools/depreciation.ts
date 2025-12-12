/**
 * Depreciation Calculator MCP Tool
 */

import { DepreciationInputSchema, DepreciationCalculator } from '@financial-analysis/analysis';

export class DepreciationTool {
  static readonly toolName = 'analyze_depreciation';
  static readonly description =
    'Calculate depreciation using multiple methods (straight-line, declining balance, MACRS, Section 179, bonus depreciation) with tax impact analysis';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      assetInfo: {
        type: 'object',
        properties: {
          purchaseDate: { type: 'string', description: 'Purchase date (ISO format)' },
          purchaseCost: { type: 'number', minimum: 0, description: 'Purchase cost' },
          salvageValue: { type: 'number', minimum: 0, default: 0, description: 'Salvage value' },
          usefulLife: { type: 'number', minimum: 1, maximum: 50, description: 'Useful life (years)' },
          assetClass: {
            type: 'string',
            enum: ['equipment', 'vehicle', 'building', 'furniture', 'computer', 'other'],
            default: 'equipment',
            description: 'Asset class',
          },
          businessUsePercentage: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'Business use percentage' },
        },
        required: ['purchaseDate', 'purchaseCost', 'usefulLife'],
      },
      depreciationMethod: {
        type: 'string',
        enum: [
          'straight-line',
          'declining-balance',
          'double-declining-balance',
          'sum-of-years-digits',
          'macrs',
          'section-179',
          'bonus-depreciation',
        ],
        default: 'straight-line',
        description: 'Depreciation method',
      },
      taxInfo: {
        type: 'object',
        properties: {
          taxYear: { type: 'number', minimum: 2000, maximum: 2100, default: 2024, description: 'Tax year' },
          federalTaxRate: { type: 'number', minimum: 0, maximum: 0.5, default: 0.21, description: 'Federal tax rate' },
          stateTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0, description: 'State tax rate' },
          section179Limit: { type: 'number', minimum: 0, default: 1080000, description: 'Section 179 limit' },
          bonusDepreciationPercentage: { type: 'number', minimum: 0, maximum: 1, default: 0.6, description: 'Bonus depreciation percentage' },
        },
        required: ['taxYear', 'federalTaxRate'],
      },
      macrsDetails: {
        type: 'object',
        properties: {
          propertyClass: {
            type: 'string',
            enum: ['3-year', '5-year', '7-year', '10-year', '15-year', '20-year', '27.5-year', '39-year'],
            default: '5-year',
            description: 'MACRS property class',
          },
          convention: {
            type: 'string',
            enum: ['half-year', 'mid-month', 'mid-quarter'],
            default: 'half-year',
            description: 'MACRS convention',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeSchedule: { type: 'boolean', default: true, description: 'Include depreciation schedule' },
          includeTaxSavings: { type: 'boolean', default: true, description: 'Include tax savings' },
          includeMethodComparison: { type: 'boolean', default: false, description: 'Include method comparison' },
          projectionYears: { type: 'number', minimum: 1, maximum: 50, description: 'Projection years' },
        },
        required: ['projectionYears'],
      },
    },
    required: ['assetInfo', 'depreciationMethod', 'taxInfo', 'analysis'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = DepreciationInputSchema.parse(args);
    return DepreciationCalculator.analyze(validated);
  }
}

