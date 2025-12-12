/**
 * Franchise ROI MCP Tool
 */

import { FranchiseROIInputSchema, FranchiseROICalculator } from '@financial-analysis/analysis';

export class FranchiseROITool {
  static readonly toolName = 'analyze_franchise_roi';
  static readonly description =
    'Analyze franchise investment ROI with initial costs, ongoing fees, revenue projections, break-even analysis, and profitability scenarios';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      franchiseInfo: {
        type: 'object',
        properties: {
          franchiseName: { type: 'string', description: 'Franchise name' },
          industry: { type: 'string', description: 'Industry' },
          location: { type: 'string', description: 'Location' },
        },
        required: ['franchiseName', 'industry'],
      },
      initialInvestment: {
        type: 'object',
        properties: {
          franchiseFee: { type: 'number', minimum: 0, description: 'Franchise fee' },
          initialInvestment: { type: 'number', minimum: 0, description: 'Total initial investment' },
          workingCapital: { type: 'number', minimum: 0, default: 0, description: 'Working capital' },
          realEstateCost: { type: 'number', minimum: 0, default: 0, description: 'Real estate cost' },
          equipmentCost: { type: 'number', minimum: 0, default: 0, description: 'Equipment cost' },
        },
        required: ['franchiseFee', 'initialInvestment'],
      },
      ongoingCosts: {
        type: 'object',
        properties: {
          royaltyFee: { type: 'number', minimum: 0, maximum: 0.2, default: 0.05, description: 'Royalty fee percentage' },
          marketingFee: { type: 'number', minimum: 0, maximum: 0.1, default: 0.02, description: 'Marketing fee percentage' },
          annualOperatingCosts: { type: 'number', minimum: 0, description: 'Annual operating costs' },
        },
        required: ['royaltyFee', 'marketingFee', 'annualOperatingCosts'],
      },
      revenueProjections: {
        type: 'object',
        properties: {
          firstYearRevenue: { type: 'number', minimum: 0, description: 'First year revenue' },
          revenueGrowthRate: { type: 'number', minimum: 0, maximum: 0.5, default: 0.1, description: 'Revenue growth rate' },
          grossMargin: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Gross margin' },
        },
        required: ['firstYearRevenue', 'grossMargin'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeROI: { type: 'boolean', default: true, description: 'Include ROI' },
          includeBreakEven: { type: 'boolean', default: true, description: 'Include break-even analysis' },
          includePaybackPeriod: { type: 'boolean', default: true, description: 'Include payback period' },
          includeScenarioAnalysis: { type: 'boolean', default: true, description: 'Include scenario analysis' },
          projectionYears: { type: 'number', minimum: 1, maximum: 20, default: 10, description: 'Projection years' },
        },
        required: ['projectionYears'],
      },
    },
    required: ['franchiseInfo', 'initialInvestment', 'ongoingCosts', 'revenueProjections'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = FranchiseROIInputSchema.parse(args);
    return FranchiseROICalculator.analyze(validated);
  }
}


