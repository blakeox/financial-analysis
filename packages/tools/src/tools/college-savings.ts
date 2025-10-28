/**
 * College Savings Planner MCP Tool
 * Provides comprehensive college savings planning through MCP protocol
 */

import { CollegeSavingsInputSchema, CollegeSavingsPlanner } from '@financial-analysis/analysis';

export class CollegeSavingsTool {
  static readonly toolName = 'analyze_college_savings';
  static readonly description =
    'Comprehensive college savings planning including 529 plan optimization, Coverdell ESA analysis, financial aid impact analysis, tax-advantaged savings strategies, multiple children planning, and scholarship planning';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      familyInfo: {
        type: 'object',
        properties: {
          numberOfChildren: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Number of children',
          },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Child name' },
                age: { type: 'number', minimum: 0, maximum: 25, description: 'Child age' },
                expectedCollegeStartAge: {
                  type: 'number',
                  minimum: 16,
                  maximum: 25,
                  default: 18,
                  description: 'Expected college start age',
                },
                expectedGraduationAge: {
                  type: 'number',
                  minimum: 20,
                  maximum: 30,
                  default: 22,
                  description: 'Expected graduation age',
                },
                collegeType: {
                  type: 'string',
                  enum: ['public', 'private', 'community', 'ivy-league'],
                  default: 'public',
                  description: 'Expected college type',
                },
                expectedMajor: { type: 'string', description: 'Expected major' },
                specialNeeds: { type: 'boolean', default: false, description: 'Special needs' },
              },
              required: ['name', 'age'],
            },
            description: 'Children information',
          },
          stateOfResidence: { type: 'string', description: 'State of residence' },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'divorced', 'widowed'],
            description: 'Marital status',
          },
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          adjustedGrossIncome: { type: 'number', minimum: 0, description: 'Adjusted gross income' },
        },
        required: [
          'numberOfChildren',
          'children',
          'stateOfResidence',
          'maritalStatus',
          'annualIncome',
        ],
      },
      currentSavings: {
        type: 'object',
        properties: {
          total529Balance: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Total 529 plan balance',
          },
          totalCoverdellBalance: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Total Coverdell ESA balance',
          },
          totalUTMAUGMA: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Total UTMA/UGMA balance',
          },
          totalSavingsBonds: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Total savings bonds',
          },
          totalOtherSavings: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Total other savings',
          },
          monthlyContribution: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Monthly contribution amount',
          },
        },
      },
      collegeCosts: {
        type: 'object',
        properties: {
          publicInState: {
            type: 'object',
            properties: {
              tuition: {
                type: 'number',
                minimum: 0,
                default: 10000,
                description: 'Public in-state tuition',
              },
              roomBoard: {
                type: 'number',
                minimum: 0,
                default: 12000,
                description: 'Room and board',
              },
              booksSupplies: {
                type: 'number',
                minimum: 0,
                default: 2000,
                description: 'Books and supplies',
              },
              otherExpenses: {
                type: 'number',
                minimum: 0,
                default: 3000,
                description: 'Other expenses',
              },
            },
          },
          publicOutOfState: {
            type: 'object',
            properties: {
              tuition: {
                type: 'number',
                minimum: 0,
                default: 25000,
                description: 'Public out-of-state tuition',
              },
              roomBoard: {
                type: 'number',
                minimum: 0,
                default: 12000,
                description: 'Room and board',
              },
              booksSupplies: {
                type: 'number',
                minimum: 0,
                default: 2000,
                description: 'Books and supplies',
              },
              otherExpenses: {
                type: 'number',
                minimum: 0,
                default: 3000,
                description: 'Other expenses',
              },
            },
          },
          private: {
            type: 'object',
            properties: {
              tuition: {
                type: 'number',
                minimum: 0,
                default: 50000,
                description: 'Private tuition',
              },
              roomBoard: {
                type: 'number',
                minimum: 0,
                default: 15000,
                description: 'Room and board',
              },
              booksSupplies: {
                type: 'number',
                minimum: 0,
                default: 3000,
                description: 'Books and supplies',
              },
              otherExpenses: {
                type: 'number',
                minimum: 0,
                default: 5000,
                description: 'Other expenses',
              },
            },
          },
          inflationRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.1,
            default: 0.05,
            description: 'College cost inflation rate',
          },
        },
      },
      financialAid: {
        type: 'object',
        properties: {
          expectedMeritAid: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Expected merit aid',
          },
          expectedNeedBasedAid: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Expected need-based aid',
          },
          expectedLoans: { type: 'number', minimum: 0, default: 0, description: 'Expected loans' },
          expectedWorkStudy: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Expected work-study',
          },
          expectedFamilyContribution: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Expected family contribution',
          },
        },
      },
      investmentStrategy: {
        type: 'object',
        properties: {
          riskTolerance: {
            type: 'string',
            enum: ['conservative', 'moderate', 'aggressive'],
            default: 'moderate',
            description: 'Risk tolerance',
          },
          expectedReturn: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0.07,
            description: 'Expected annual return',
          },
          rebalancingFrequency: {
            type: 'string',
            enum: ['monthly', 'quarterly', 'annually'],
            default: 'annually',
            description: 'Rebalancing frequency',
          },
          glidePathStrategy: {
            type: 'string',
            enum: ['aggressive', 'moderate', 'conservative'],
            default: 'moderate',
            description: 'Glide path strategy',
          },
        },
      },
      goals: {
        type: 'object',
        properties: {
          targetCoveragePercentage: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.8,
            description: 'Target coverage percentage',
          },
          preferredSavingsVehicle: {
            type: 'string',
            enum: ['529', 'coverdell', 'utma', 'mixed'],
            default: '529',
            description: 'Preferred savings vehicle',
          },
          stateTaxBenefit: {
            type: 'boolean',
            default: true,
            description: 'State tax benefit available',
          },
          flexibilityImportance: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium',
            description: 'Flexibility importance',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeFinancialAidImpact: {
            type: 'boolean',
            default: true,
            description: 'Include financial aid impact analysis',
          },
          includeStateComparison: {
            type: 'boolean',
            default: true,
            description: 'Include state plan comparison',
          },
          includeTaxOptimization: {
            type: 'boolean',
            default: true,
            description: 'Include tax optimization',
          },
          includeMultipleChildren: {
            type: 'boolean',
            default: true,
            description: 'Include multiple children planning',
          },
          includeScholarshipPlanning: {
            type: 'boolean',
            default: true,
            description: 'Include scholarship planning',
          },
          timeHorizon: {
            type: 'number',
            minimum: 1,
            maximum: 25,
            default: 18,
            description: 'Analysis time horizon in years',
          },
        },
      },
    },
    required: ['familyInfo'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input
      const validatedInput = CollegeSavingsInputSchema.parse(input);

      // Perform analysis
      const result = CollegeSavingsPlanner.analyze(validatedInput);

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
