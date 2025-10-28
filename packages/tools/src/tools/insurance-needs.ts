/**
 * Insurance Needs Calculator MCP Tool
 * Provides comprehensive insurance needs analysis through MCP protocol
 */

import { InsuranceNeedsCalculator, InsuranceNeedsInputSchema } from '@financial-analysis/analysis';

export class InsuranceNeedsTool {
  static readonly toolName = 'analyze_insurance_needs';
  static readonly description =
    'Comprehensive insurance needs analysis including life, disability, and long-term care insurance planning, coverage gap analysis, premium optimization, and risk assessment';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      personalInfo: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18, maximum: 100, description: 'Current age' },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed'],
            description: 'Marital status',
          },
          dependents: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            default: 0,
            description: 'Number of dependents',
          },
          employmentStatus: {
            type: 'string',
            enum: ['employed', 'self-employed', 'unemployed', 'retired'],
            description: 'Employment status',
          },
          healthStatus: {
            type: 'string',
            enum: ['excellent', 'good', 'fair', 'poor'],
            default: 'good',
            description: 'Health status',
          },
          occupation: { type: 'string', description: 'Occupation' },
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          monthlyExpenses: { type: 'number', minimum: 0, description: 'Monthly expenses' },
        },
        required: ['age', 'maritalStatus', 'employmentStatus', 'annualIncome', 'monthlyExpenses'],
      },
      currentInsurance: {
        type: 'object',
        properties: {
          lifeInsurance: {
            type: 'object',
            properties: {
              termLife: {
                type: 'object',
                properties: {
                  coverage: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Term life coverage amount',
                  },
                  termYears: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Term length in years',
                  },
                  monthlyPremium: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Monthly premium',
                  },
                  beneficiary: { type: 'string', description: 'Beneficiary name' },
                },
              },
              wholeLife: {
                type: 'object',
                properties: {
                  coverage: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Whole life coverage amount',
                  },
                  cashValue: { type: 'number', minimum: 0, default: 0, description: 'Cash value' },
                  monthlyPremium: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Monthly premium',
                  },
                  beneficiary: { type: 'string', description: 'Beneficiary name' },
                },
              },
            },
          },
          disabilityInsurance: {
            type: 'object',
            properties: {
              shortTerm: {
                type: 'object',
                properties: {
                  coverage: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Short-term disability coverage',
                  },
                  waitingPeriod: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Waiting period in days',
                  },
                  benefitPeriod: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Benefit period in months',
                  },
                  monthlyPremium: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Monthly premium',
                  },
                },
              },
              longTerm: {
                type: 'object',
                properties: {
                  coverage: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Long-term disability coverage',
                  },
                  waitingPeriod: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Waiting period in days',
                  },
                  benefitPeriod: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Benefit period in years',
                  },
                  monthlyPremium: {
                    type: 'number',
                    minimum: 0,
                    default: 0,
                    description: 'Monthly premium',
                  },
                },
              },
            },
          },
          longTermCare: {
            type: 'object',
            properties: {
              coverage: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Long-term care coverage amount',
              },
              dailyBenefit: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Daily benefit amount',
              },
              benefitPeriod: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Benefit period in years',
              },
              eliminationPeriod: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Elimination period in days',
              },
              monthlyPremium: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Monthly premium',
              },
            },
          },
          healthInsurance: {
            type: 'object',
            properties: {
              coverage: { type: 'string', description: 'Health insurance coverage type' },
              monthlyPremium: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Monthly premium',
              },
              deductible: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Annual deductible',
              },
              outOfPocketMax: {
                type: 'number',
                minimum: 0,
                default: 0,
                description: 'Out-of-pocket maximum',
              },
            },
          },
        },
      },
      financialSituation: {
        type: 'object',
        properties: {
          totalAssets: { type: 'number', minimum: 0, description: 'Total assets' },
          totalDebts: { type: 'number', minimum: 0, default: 0, description: 'Total debts' },
          emergencyFund: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Emergency fund amount',
          },
          retirementSavings: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Retirement savings',
          },
          otherIncome: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Other income sources',
          },
          socialSecurityBenefit: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Expected Social Security benefit',
          },
        },
        required: ['totalAssets'],
      },
      goals: {
        type: 'object',
        properties: {
          incomeReplacementRatio: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.7,
            description: 'Income replacement ratio (0-1)',
          },
          debtPayoffGoal: {
            type: 'boolean',
            default: true,
            description: 'Include debt payoff in coverage',
          },
          educationFunding: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Education funding goal',
          },
          retirementGoal: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Retirement savings goal',
          },
          legacyGoal: { type: 'number', minimum: 0, default: 0, description: 'Legacy/estate goal' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeLifeInsurance: {
            type: 'boolean',
            default: true,
            description: 'Include life insurance analysis',
          },
          includeDisabilityInsurance: {
            type: 'boolean',
            default: true,
            description: 'Include disability insurance analysis',
          },
          includeLongTermCare: {
            type: 'boolean',
            default: true,
            description: 'Include long-term care analysis',
          },
          includeHealthInsurance: {
            type: 'boolean',
            default: false,
            description: 'Include health insurance analysis',
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
          lifeExpectancy: {
            type: 'number',
            minimum: 70,
            maximum: 100,
            default: 85,
            description: 'Expected life expectancy',
          },
        },
      },
    },
    required: ['personalInfo', 'financialSituation'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input
      const validatedInput = InsuranceNeedsInputSchema.parse(input);

      // Perform analysis
      const result = InsuranceNeedsCalculator.analyze(validatedInput);

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
