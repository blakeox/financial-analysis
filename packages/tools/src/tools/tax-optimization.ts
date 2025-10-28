/**
 * Tax Optimization Planner MCP Tool
 * Provides comprehensive tax optimization analysis through MCP protocol
 */

import { TaxOptimizationInputSchema, TaxOptimizationPlanner } from '@financial-analysis/analysis';

export class TaxOptimizationTool {
  static readonly toolName = 'analyze_tax_optimization';
  static readonly description =
    'Comprehensive tax optimization analysis including tax-loss harvesting, Roth vs Traditional IRA analysis, capital gains optimization, charitable giving strategies, estimated tax planning, and tax bracket optimization';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          maritalStatus: {
            type: 'string',
            enum: [
              'single',
              'married-filing-jointly',
              'married-filing-separately',
              'head-of-household',
              'qualifying-widow',
            ],
            description: 'Marital status for tax purposes',
          },
          dependents: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            default: 0,
            description: 'Number of dependents',
          },
          state: { type: 'string', description: 'State of residence' },
          filingStatus: {
            type: 'string',
            enum: ['single', 'married-joint', 'married-separate', 'head-of-household', 'widow'],
            description: 'Tax filing status',
          },
        },
        required: ['age', 'maritalStatus', 'filingStatus'],
      },
      currentTaxSituation: {
        type: 'object',
        properties: {
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          adjustedGrossIncome: { type: 'number', minimum: 0, description: 'Adjusted gross income' },
          taxableIncome: { type: 'number', minimum: 0, description: 'Taxable income' },
          federalTaxOwed: { type: 'number', minimum: 0, description: 'Federal tax owed' },
          stateTaxOwed: { type: 'number', minimum: 0, default: 0, description: 'State tax owed' },
          effectiveTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Effective tax rate',
          },
          marginalTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Marginal tax rate',
          },
          totalTaxOwed: { type: 'number', minimum: 0, description: 'Total tax owed' },
        },
        required: [
          'annualIncome',
          'adjustedGrossIncome',
          'taxableIncome',
          'federalTaxOwed',
          'effectiveTaxRate',
          'marginalTaxRate',
          'totalTaxOwed',
        ],
      },
      investmentHoldings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Investment symbol' },
            name: { type: 'string', description: 'Investment name' },
            shares: { type: 'number', minimum: 0, description: 'Number of shares' },
            currentPrice: { type: 'number', minimum: 0, description: 'Current price per share' },
            costBasis: { type: 'number', minimum: 0, description: 'Cost basis per share' },
            purchaseDate: { type: 'string', description: 'Purchase date' },
            accountType: {
              type: 'string',
              enum: ['taxable', 'traditional-ira', 'roth-ira', '401k', 'hsa', '529'],
              description: 'Account type',
            },
            holdingPeriod: {
              type: 'string',
              enum: ['short-term', 'long-term'],
              description: 'Holding period',
            },
            unrealizedGainLoss: { type: 'number', description: 'Unrealized gain/loss' },
          },
          required: [
            'symbol',
            'name',
            'shares',
            'currentPrice',
            'costBasis',
            'purchaseDate',
            'accountType',
            'holdingPeriod',
            'unrealizedGainLoss',
          ],
        },
        description: 'Investment holdings',
      },
      retirementAccounts: {
        type: 'object',
        properties: {
          traditional401k: {
            type: 'object',
            properties: {
              balance: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Traditional 401(k) balance',
              },
              annualContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Annual contribution',
              },
              employerMatch: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Employer match',
              },
            },
          },
          roth401k: {
            type: 'object',
            properties: {
              balance: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Roth 401(k) balance',
              },
              annualContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Annual contribution',
              },
            },
          },
          traditionalIRA: {
            type: 'object',
            properties: {
              balance: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Traditional IRA balance',
              },
              annualContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Annual contribution',
              },
              deductibleContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Deductible contribution',
              },
            },
          },
          rothIRA: {
            type: 'object',
            properties: {
              balance: { type: 'number', minimum: 0, default: 0, description: 'Roth IRA balance' },
              annualContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Annual contribution',
              },
            },
          },
          hsa: {
            type: 'object',
            properties: {
              balance: { type: 'number', minimum: 0, default: 0, description: 'HSA balance' },
              annualContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Annual contribution',
              },
              employerContribution: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Employer contribution',
              },
            },
          },
        },
      },
      deductionsCredits: {
        type: 'object',
        properties: {
          standardDeduction: {
            type: 'number',
            minimum: 0,
            description: 'Standard deduction amount',
          },
          itemizedDeductions: {
            type: 'object',
            properties: {
              mortgageInterest: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Mortgage interest deduction',
              },
              propertyTaxes: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Property taxes',
              },
              stateIncomeTax: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'State income tax',
              },
              charitableContributions: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Charitable contributions',
              },
              medicalExpenses: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Medical expenses',
              },
              otherDeductions: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Other deductions',
              },
            },
          },
          taxCredits: {
            type: 'object',
            properties: {
              childTaxCredit: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Child tax credit',
              },
              earnedIncomeCredit: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Earned income credit',
              },
              educationCredits: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Education credits',
              },
              otherCredits: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Other tax credits',
              },
            },
          },
        },
        required: ['standardDeduction'],
      },
      goals: {
        type: 'object',
        properties: {
          retirementAge: {
            type: 'number',
            minimum: 50,
            maximum: 80,
            default: 65,
            description: 'Target retirement age',
          },
          expectedRetirementTaxRate: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.15,
            description: 'Expected retirement tax rate',
          },
          charitableGivingGoal: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Charitable giving goal',
          },
          taxLossHarvestingGoal: {
            type: 'number',
            minimum: 0,
            default: 3000,
            description: 'Tax loss harvesting goal',
          },
          capitalGainsGoal: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Capital gains goal',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeTaxLossHarvesting: {
            type: 'boolean',
            default: true,
            description: 'Include tax loss harvesting analysis',
          },
          includeRothConversion: {
            type: 'boolean',
            default: true,
            description: 'Include Roth conversion analysis',
          },
          includeCharitableGiving: {
            type: 'boolean',
            default: true,
            description: 'Include charitable giving strategies',
          },
          includeCapitalGainsOptimization: {
            type: 'boolean',
            default: true,
            description: 'Include capital gains optimization',
          },
          includeEstimatedTaxPlanning: {
            type: 'boolean',
            default: true,
            description: 'Include estimated tax planning',
          },
          includeBracketOptimization: {
            type: 'boolean',
            default: true,
            description: 'Include tax bracket optimization',
          },
          inflationRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.1,
            default: 0.03,
            description: 'Inflation rate',
          },
          discountRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.1,
            default: 0.05,
            description: 'Discount rate',
          },
        },
      },
    },
    required: ['personalInfo', 'currentTaxSituation'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input
      const validatedInput = TaxOptimizationInputSchema.parse(input);

      // Perform analysis
      const result = TaxOptimizationPlanner.analyze(validatedInput);

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
