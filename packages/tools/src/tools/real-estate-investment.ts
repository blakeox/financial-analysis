/**
 * Real Estate Investment Analyzer MCP Tool
 */

import {
  RealEstateInvestmentAnalyzer,
  RealEstateInvestmentInputSchema,
} from '@financial-analysis/analysis';

export class RealEstateInvestmentTool {
  static readonly toolName = 'analyze_real_estate_investment';
  static readonly description =
    'Real estate investment analysis with cap rate, cash-on-cash return, NOI, IRR, and projected returns';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      propertyInfo: {
        type: 'object',
        properties: {
          purchasePrice: { type: 'number', minimum: 0 },
          propertyType: {
            type: 'string',
            enum: ['residential', 'commercial', 'multifamily', 'industrial', 'retail', 'office'],
          },
          squareFeet: { type: 'number', minimum: 0 },
          units: { type: 'number', minimum: 0 },
        },
        required: ['purchasePrice', 'propertyType'],
      },
      financing: {
        type: 'object',
        properties: {
          downPayment: { type: 'number', minimum: 0 },
          loanAmount: { type: 'number', minimum: 0 },
          interestRate: { type: 'number', minimum: 0, maximum: 0.2 },
          loanTerm: { type: 'number', minimum: 5, maximum: 30 },
          loanType: {
            type: 'string',
            enum: ['conventional', 'commercial', 'hard-money', 'cash'],
            default: 'conventional',
          },
        },
        required: ['downPayment', 'loanAmount', 'interestRate', 'loanTerm'],
      },
      income: {
        type: 'object',
        properties: {
          monthlyRent: { type: 'number', minimum: 0 },
          annualRentIncrease: { type: 'number', minimum: 0, maximum: 0.1, default: 0.03 },
          occupancyRate: { type: 'number', minimum: 0, maximum: 1, default: 0.95 },
          otherIncome: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['monthlyRent'],
      },
      expenses: {
        type: 'object',
        properties: {
          propertyTaxes: { type: 'number', minimum: 0 },
          insurance: { type: 'number', minimum: 0 },
          maintenance: { type: 'number', minimum: 0 },
          propertyManagement: { type: 'number', minimum: 0, default: 0 },
          utilities: { type: 'number', minimum: 0, default: 0 },
          otherExpenses: { type: 'number', minimum: 0, default: 0 },
          vacancyRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.05 },
        },
        required: ['propertyTaxes', 'insurance', 'maintenance'],
      },
      projections: {
        type: 'object',
        properties: {
          holdingPeriod: { type: 'number', minimum: 1, maximum: 30, default: 10 },
          appreciationRate: { type: 'number', minimum: -0.1, maximum: 0.1, default: 0.03 },
          saleCosts: { type: 'number', minimum: 0, maximum: 0.1, default: 0.06 },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeCapRate: { type: 'boolean', default: true },
          includeCashOnCash: { type: 'boolean', default: true },
          includeIRR: { type: 'boolean', default: true },
          includeNOI: { type: 'boolean', default: true },
        },
      },
    },
    required: ['propertyInfo', 'financing', 'income', 'expenses'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = RealEstateInvestmentInputSchema.parse(args);
    return RealEstateInvestmentAnalyzer.analyze(validated);
  }
}
