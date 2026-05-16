/**
 * HSA Optimization MCP Tool
 */

import { HSAOptimizationInputSchema, HSAOptimizer } from '@financial-analysis/analysis';

export class HSAOptimizationTool {
  static readonly toolName = 'analyze_hsa_optimization';
  static readonly description =
    'Maximize Health Savings Account tax benefits with triple tax advantage analysis, contribution limits, retirement healthcare planning, and tax savings projections';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          filingStatus: {
            type: 'string',
            enum: ['single', 'married-joint', 'married-separate', 'head-of-household'],
            description: 'Tax filing status',
          },
          currentHSABalance: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Current HSA balance',
          },
        },
        required: ['age', 'filingStatus'],
      },
      contributionLimits: {
        type: 'object',
        properties: {
          individualLimit: {
            type: 'number',
            minimum: 0,
            default: 4150,
            description: 'Individual contribution limit',
          },
          familyLimit: {
            type: 'number',
            minimum: 0,
            default: 8300,
            description: 'Family contribution limit',
          },
          catchUpContribution: {
            type: 'number',
            minimum: 0,
            default: 1000,
            description: 'Catch-up contribution (age 55+)',
          },
        },
      },
      hsaDetails: {
        type: 'object',
        properties: {
          annualContribution: {
            type: 'number',
            minimum: 0,
            description: 'Annual HSA contribution',
          },
          employerContribution: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Employer contribution',
          },
          investmentReturn: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0.07,
            description: 'Expected investment return',
          },
        },
        required: ['annualContribution'],
      },
      medicalExpenses: {
        type: 'object',
        properties: {
          annualMedicalExpenses: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Annual medical expenses',
          },
          expectedRetirementMedicalCosts: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Expected retirement medical costs',
          },
          yearsUntilRetirement: {
            type: 'number',
            minimum: 0,
            default: 30,
            description: 'Years until retirement',
          },
        },
      },
      strategy: {
        type: 'object',
        properties: {
          optimizeFor: {
            type: 'string',
            enum: ['max-tax-benefit', 'retirement-healthcare', 'current-expenses', 'hybrid'],
            default: 'hybrid',
            description: 'Optimization strategy',
          },
          useForCurrentExpenses: {
            type: 'boolean',
            default: false,
            description: 'Use HSA for current expenses',
          },
          saveReceipts: {
            type: 'boolean',
            default: true,
            description: 'Save receipts for future reimbursement',
          },
        },
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.5,
            default: 0.22,
            description: 'Federal tax rate',
          },
          stateTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0,
            description: 'State tax rate',
          },
          ficaTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0.0765,
            description: 'FICA tax rate',
          },
        },
      },
    },
    required: ['personalInfo', 'hsaDetails'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = HSAOptimizationInputSchema.parse(args);
    return HSAOptimizer.analyze(validated);
  }
}
