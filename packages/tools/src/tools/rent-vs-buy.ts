/**
 * Rent vs Buy Calculator MCP Tool
 * Provides rent vs buy comparison analysis through MCP protocol
 */

import { RentVsBuyCalculator, RentVsBuyInputSchema } from '@financial-analysis/analysis';

export class RentVsBuyTool {
  static readonly toolName = 'analyze_rent_vs_buy';
  static readonly description =
    'Compare the financial impact of renting versus buying a home over a specified timeframe. Includes property appreciation, PMI calculations, tax benefits with SALT cap, capital gains exclusion, opportunity costs, and year-by-year breakdown.';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      // Home purchase parameters
      homePrice: {
        type: 'number',
        minimum: 0,
        description: 'Purchase price of the home',
      },
      downPayment: {
        type: 'number',
        minimum: 0,
        description: 'Down payment amount',
      },
      interestRate: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        default: 6.5,
        description: 'Annual mortgage interest rate as percentage (e.g., 6.5 for 6.5%)',
      },
      loanTermYears: {
        type: 'number',
        minimum: 1,
        maximum: 50,
        default: 30,
        description: 'Mortgage term in years',
      },

      // Home ownership costs
      propertyTaxRate: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        default: 1.2,
        description: 'Annual property tax rate as percentage of home value',
      },
      propertyTaxIncreaseRate: {
        type: 'number',
        minimum: 0,
        maximum: 20,
        default: 2,
        description: 'Annual property tax increase rate as percentage',
      },
      homeInsurance: {
        type: 'number',
        minimum: 0,
        default: 150,
        description: 'Monthly home insurance cost',
      },
      hoaFees: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Monthly HOA fees',
      },
      maintenanceRate: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        default: 1,
        description: 'Annual maintenance cost as percentage of home value',
      },

      // Transaction costs
      closingCostRate: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        default: 3,
        description: 'Closing costs as percentage of home price',
      },
      sellingCostRate: {
        type: 'number',
        minimum: 0,
        maximum: 15,
        default: 6,
        description: 'Selling costs as percentage of home value (agent fees, etc.)',
      },

      // Rental parameters
      monthlyRent: {
        type: 'number',
        minimum: 0,
        description: 'Current monthly rent',
      },
      rentIncreaseRate: {
        type: 'number',
        minimum: 0,
        maximum: 20,
        default: 3,
        description: 'Annual rent increase rate as percentage',
      },
      rentersInsurance: {
        type: 'number',
        minimum: 0,
        default: 20,
        description: 'Monthly renters insurance cost',
      },
      securityDepositMonths: {
        type: 'number',
        minimum: 0,
        maximum: 3,
        default: 1,
        description: 'Security deposit in months of rent',
      },

      // Market assumptions
      appreciationRate: {
        type: 'number',
        minimum: -20,
        maximum: 30,
        default: 3,
        description: 'Annual home appreciation rate as percentage',
      },
      investmentReturnRate: {
        type: 'number',
        minimum: 0,
        maximum: 30,
        default: 7,
        description: 'Annual investment return rate as percentage (for opportunity cost)',
      },
      inflationRate: {
        type: 'number',
        minimum: 0,
        maximum: 20,
        default: 2.5,
        description: 'Annual inflation rate as percentage',
      },

      // Tax parameters
      marginalTaxRate: {
        type: 'number',
        minimum: 0,
        maximum: 50,
        default: 22,
        description: 'Marginal tax rate as percentage',
      },
      filingStatus: {
        type: 'string',
        enum: ['single', 'married', 'head'],
        default: 'single',
        description: 'Tax filing status (affects standard deduction and capital gains exclusion)',
      },
      otherItemizedDeductions: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Other itemized deductions (state taxes, charitable, etc.)',
      },

      // Analysis timeframe
      yearsToAnalyze: {
        type: 'number',
        minimum: 1,
        maximum: 40,
        default: 10,
        description: 'Number of years to analyze',
      },
    },
    required: ['homePrice', 'downPayment', 'monthlyRent'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input with Zod schema
      const validatedInput = RentVsBuyInputSchema.parse(input);

      // Perform analysis
      const result = RentVsBuyCalculator.analyze(validatedInput);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
