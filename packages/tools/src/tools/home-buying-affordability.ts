/**
 * Home Buying Affordability Calculator MCP Tool
 * Provides comprehensive home buying analysis through MCP protocol
 */

import {
  HomeBuyingAffordabilityCalculator,
  HomeBuyingAffordabilityInputSchema,
} from '@financial-analysis/analysis';

export class HomeBuyingAffordabilityTool {
  static readonly toolName = 'analyze_home_buying_affordability';
  static readonly description =
    'Comprehensive home buying affordability analysis including affordability assessment, down payment strategies, closing cost estimation, moving cost planning, first-time buyer programs, and mortgage comparison';

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
          yearsEmployed: { type: 'number', minimum: 0, default: 1, description: 'Years employed' },
          creditScore: { type: 'number', minimum: 300, maximum: 850, description: 'Credit score' },
        },
        required: ['age', 'maritalStatus', 'employmentStatus', 'creditScore'],
      },
      financialSituation: {
        type: 'object',
        properties: {
          annualIncome: { type: 'number', minimum: 0, description: 'Annual income' },
          monthlyIncome: { type: 'number', minimum: 0, description: 'Monthly income' },
          monthlyExpenses: { type: 'number', minimum: 0, description: 'Monthly expenses' },
          totalDebts: { type: 'number', minimum: 0, default: 0, description: 'Total debts' },
          monthlyDebtPayments: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Monthly debt payments',
          },
          totalAssets: { type: 'number', minimum: 0, description: 'Total assets' },
          liquidAssets: { type: 'number', minimum: 0, description: 'Liquid assets' },
          emergencyFund: { type: 'number', minimum: 0, default: 0, description: 'Emergency fund' },
          retirementSavings: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Retirement savings',
          },
          otherAssets: { type: 'number', minimum: 0, default: 0, description: 'Other assets' },
        },
        required: [
          'annualIncome',
          'monthlyIncome',
          'monthlyExpenses',
          'totalAssets',
          'liquidAssets',
        ],
      },
      homePreferences: {
        type: 'object',
        properties: {
          homePrice: { type: 'number', minimum: 0, description: 'Target home price' },
          homeType: {
            type: 'string',
            enum: ['single-family', 'condo', 'townhouse', 'multi-family', 'mobile'],
            default: 'single-family',
            description: 'Home type',
          },
          location: { type: 'string', description: 'Location' },
          bedrooms: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 3,
            description: 'Number of bedrooms',
          },
          bathrooms: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 2,
            description: 'Number of bathrooms',
          },
          squareFootage: { type: 'number', minimum: 0, description: 'Square footage' },
          lotSize: { type: 'number', minimum: 0, description: 'Lot size in acres' },
          yearBuilt: { type: 'number', minimum: 1800, maximum: 2024, description: 'Year built' },
          condition: {
            type: 'string',
            enum: ['excellent', 'good', 'fair', 'poor'],
            default: 'good',
            description: 'Home condition',
          },
        },
      },
      downPaymentStrategy: {
        type: 'object',
        properties: {
          downPaymentAmount: { type: 'number', minimum: 0, description: 'Down payment amount' },
          downPaymentPercentage: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.2,
            description: 'Down payment percentage',
          },
          downPaymentSource: {
            type: 'string',
            enum: ['savings', 'gift', 'loan', 'mixed'],
            default: 'savings',
            description: 'Down payment source',
          },
          giftAmount: { type: 'number', minimum: 0, default: 0, description: 'Gift amount' },
          giftSource: { type: 'string', description: 'Gift source' },
          downPaymentAssistance: {
            type: 'boolean',
            default: false,
            description: 'Down payment assistance available',
          },
          firstTimeBuyer: { type: 'boolean', default: true, description: 'First-time buyer' },
        },
      },
      mortgageTerms: {
        type: 'object',
        properties: {
          loanAmount: { type: 'number', minimum: 0, description: 'Loan amount' },
          interestRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            default: 0.065,
            description: 'Interest rate',
          },
          termYears: {
            type: 'number',
            minimum: 10,
            maximum: 50,
            default: 30,
            description: 'Loan term in years',
          },
          loanType: {
            type: 'string',
            enum: ['conventional', 'fha', 'va', 'usda', 'jumbo'],
            default: 'conventional',
            description: 'Loan type',
          },
          points: { type: 'number', minimum: 0, maximum: 5, default: 0, description: 'Points' },
          privateMortgageInsurance: {
            type: 'boolean',
            default: false,
            description: 'Private mortgage insurance required',
          },
          pmiRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.05,
            default: 0.005,
            description: 'PMI rate',
          },
        },
      },
      closingCosts: {
        type: 'object',
        properties: {
          originationFee: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Origination fee',
          },
          appraisalFee: { type: 'number', minimum: 0, default: 500, description: 'Appraisal fee' },
          inspectionFee: {
            type: 'number',
            minimum: 0,
            default: 400,
            description: 'Inspection fee',
          },
          titleInsurance: {
            type: 'number',
            minimum: 0,
            default: 1000,
            description: 'Title insurance',
          },
          escrowFee: { type: 'number', minimum: 0, default: 500, description: 'Escrow fee' },
          recordingFee: { type: 'number', minimum: 0, default: 200, description: 'Recording fee' },
          transferTax: { type: 'number', minimum: 0, default: 0, description: 'Transfer tax' },
          otherFees: { type: 'number', minimum: 0, default: 500, description: 'Other fees' },
          prepaidExpenses: {
            type: 'number',
            minimum: 0,
            default: 2000,
            description: 'Prepaid expenses',
          },
        },
      },
      movingCosts: {
        type: 'object',
        properties: {
          movingCompany: {
            type: 'number',
            minimum: 0,
            default: 2000,
            description: 'Moving company cost',
          },
          movingSupplies: {
            type: 'number',
            minimum: 0,
            default: 300,
            description: 'Moving supplies cost',
          },
          utilitySetup: {
            type: 'number',
            minimum: 0,
            default: 500,
            description: 'Utility setup cost',
          },
          furnitureAppliances: {
            type: 'number',
            minimum: 0,
            default: 5000,
            description: 'Furniture and appliances cost',
          },
          homeImprovements: {
            type: 'number',
            minimum: 0,
            default: 3000,
            description: 'Home improvements cost',
          },
          landscaping: {
            type: 'number',
            minimum: 0,
            default: 1000,
            description: 'Landscaping cost',
          },
          otherMovingCosts: {
            type: 'number',
            minimum: 0,
            default: 1000,
            description: 'Other moving costs',
          },
        },
      },
      ongoingCosts: {
        type: 'object',
        properties: {
          propertyTaxes: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Annual property taxes',
          },
          homeownersInsurance: {
            type: 'number',
            minimum: 0,
            default: 1200,
            description: 'Annual homeowners insurance',
          },
          hoaFees: { type: 'number', minimum: 0, default: 0, description: 'Annual HOA fees' },
          maintenance: {
            type: 'number',
            minimum: 0,
            default: 2000,
            description: 'Annual maintenance cost',
          },
          utilities: {
            type: 'number',
            minimum: 0,
            default: 3000,
            description: 'Annual utilities cost',
          },
          otherOngoingCosts: {
            type: 'number',
            minimum: 0,
            default: 1000,
            description: 'Other ongoing costs',
          },
        },
      },
      goals: {
        type: 'object',
        properties: {
          targetMoveInDate: { type: 'string', description: 'Target move-in date' },
          maxMonthlyPayment: { type: 'number', minimum: 0, description: 'Maximum monthly payment' },
          maxTotalCost: { type: 'number', minimum: 0, description: 'Maximum total cost' },
          priorityFeatures: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Priority features',
          },
          mustHaveFeatures: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Must-have features',
          },
          niceToHaveFeatures: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Nice-to-have features',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeAffordabilityAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include affordability analysis',
          },
          includeDownPaymentStrategies: {
            type: 'boolean',
            default: true,
            description: 'Include down payment strategies',
          },
          includeClosingCostEstimation: {
            type: 'boolean',
            default: true,
            description: 'Include closing cost estimation',
          },
          includeMovingCostPlanning: {
            type: 'boolean',
            default: true,
            description: 'Include moving cost planning',
          },
          includeFirstTimeBuyerPrograms: {
            type: 'boolean',
            default: true,
            description: 'Include first-time buyer programs',
          },
          includeMortgageComparison: {
            type: 'boolean',
            default: true,
            description: 'Include mortgage comparison',
          },
          includeOngoingCostAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include ongoing cost analysis',
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
    required: ['personalInfo', 'financialSituation'],
  };

  static async execute(input: unknown): Promise<unknown> {
    try {
      // Validate input
      const validatedInput = HomeBuyingAffordabilityInputSchema.parse(input);

      // Perform analysis
      const result = HomeBuyingAffordabilityCalculator.analyze(validatedInput);

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
