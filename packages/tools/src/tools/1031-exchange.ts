/**
 * 1031 Exchange MCP Tool
 */

import { OneZeroThreeOneExchangeInputSchema, OneZeroThreeOneExchangeAnalyzer } from '@financial-analysis/analysis';

export class OneZeroThreeOneExchangeTool {
  static readonly toolName = 'analyze_1031_exchange';
  static readonly description =
    'Analyze 1031 like-kind exchange opportunities with tax deferral calculations, identification rules, and replacement property analysis';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      relinquishedProperty: {
        type: 'object',
        properties: {
          propertyType: {
            type: 'string',
            enum: ['real-estate', 'equipment', 'business-assets'],
            default: 'real-estate',
            description: 'Property type',
          },
          purchasePrice: { type: 'number', minimum: 0, description: 'Purchase price' },
          adjustedBasis: { type: 'number', minimum: 0, description: 'Adjusted basis' },
          salePrice: { type: 'number', minimum: 0, description: 'Sale price' },
          accumulatedDepreciation: { type: 'number', minimum: 0, default: 0, description: 'Accumulated depreciation' },
          sellingExpenses: { type: 'number', minimum: 0, default: 0, description: 'Selling expenses' },
        },
        required: ['purchasePrice', 'adjustedBasis', 'salePrice'],
      },
      replacementProperty: {
        type: 'object',
        properties: {
          purchasePrice: { type: 'number', minimum: 0, description: 'Purchase price' },
          closingCosts: { type: 'number', minimum: 0, default: 0, description: 'Closing costs' },
        },
        required: ['purchasePrice'],
      },
      exchangeDetails: {
        type: 'object',
        properties: {
          exchangeType: {
            type: 'string',
            enum: ['simultaneous', 'delayed', 'reverse', 'construction'],
            default: 'delayed',
            description: 'Exchange type',
          },
          identificationDeadline: { type: 'string', description: 'Identification deadline (ISO format)' },
          closingDeadline: { type: 'string', description: 'Closing deadline (ISO format)' },
          qualifiedIntermediary: { type: 'boolean', default: true, description: 'Using qualified intermediary' },
        },
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalTaxRate: {
            type: 'object',
            properties: {
              ordinary: { type: 'number', minimum: 0, maximum: 0.5, default: 0.37, description: 'Ordinary income rate' },
              capitalGains: { type: 'number', minimum: 0, maximum: 0.3, default: 0.2, description: 'Capital gains rate' },
            },
            required: ['ordinary', 'capitalGains'],
          },
          stateTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0, description: 'State tax rate' },
          includeDepreciationRecapture: { type: 'boolean', default: true, description: 'Include depreciation recapture' },
        },
        required: ['federalTaxRate'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeTaxDeferral: { type: 'boolean', default: true, description: 'Include tax deferral' },
          includeBootAnalysis: { type: 'boolean', default: true, description: 'Include boot analysis' },
          includeComplianceCheck: { type: 'boolean', default: true, description: 'Include compliance check' },
          includeReplacementAnalysis: { type: 'boolean', default: true, description: 'Include replacement analysis' },
        },
      },
    },
    required: ['relinquishedProperty', 'replacementProperty', 'taxInfo'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = OneZeroThreeOneExchangeInputSchema.parse(args);
    return OneZeroThreeOneExchangeAnalyzer.analyze(validated);
  }
}


