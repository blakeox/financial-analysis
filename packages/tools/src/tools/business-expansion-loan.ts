/**
 * Business Expansion Loan Journey MCP Tool
 * Provides comprehensive business expansion loan analysis through MCP protocol
 */

import {
  BusinessExpansionLoanInputSchema,
  BusinessExpansionLoanJourney,
} from '@financial-analysis/analysis';

export class BusinessExpansionLoanTool {
  static readonly toolName = 'analyze_business_expansion_loan';
  static readonly description =
    'Comprehensive business expansion loan analysis including debt capacity assessment, cash flow projections with loan payments, DSCR analysis, risk assessment, loan term optimization, and scenario analysis for businesses seeking growth financing';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      businessInfo: {
        type: 'object',
        properties: {
          businessName: { type: 'string', description: 'Business name' },
          industry: { type: 'string', description: 'Business industry' },
          yearsInBusiness: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Years in business',
          },
          businessType: {
            type: 'string',
            enum: ['sole-proprietorship', 'partnership', 'llc', 'corporation', 's-corp'],
            description: 'Business legal structure',
          },
          employeeCount: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
            description: 'Number of employees',
          },
        },
        required: ['businessName', 'industry', 'yearsInBusiness', 'businessType', 'employeeCount'],
      },
      currentFinancials: {
        type: 'object',
        properties: {
          annualRevenue: { type: 'number', minimum: 0, description: 'Annual revenue' },
          annualEBITDA: { type: 'number', description: 'Annual EBITDA' },
          currentDebt: { type: 'number', minimum: 0, description: 'Current total debt' },
          monthlyDebtPayments: {
            type: 'number',
            minimum: 0,
            description: 'Monthly debt payments',
          },
          cashOnHand: { type: 'number', minimum: 0, description: 'Cash on hand' },
          accountsReceivable: {
            type: 'number',
            minimum: 0,
            description: 'Accounts receivable',
          },
          accountsPayable: {
            type: 'number',
            minimum: 0,
            description: 'Accounts payable',
          },
          creditScore: {
            type: 'number',
            minimum: 300,
            maximum: 850,
            description: 'Business credit score',
          },
        },
        required: [
          'annualRevenue',
          'annualEBITDA',
          'currentDebt',
          'monthlyDebtPayments',
          'cashOnHand',
          'accountsReceivable',
          'accountsPayable',
        ],
      },
      expansionPlan: {
        type: 'object',
        properties: {
          loanAmount: { type: 'number', minimum: 0, description: 'Requested loan amount' },
          loanPurpose: {
            type: 'string',
            enum: [
              'equipment',
              'real-estate',
              'working-capital',
              'inventory',
              'expansion',
              'acquisition',
              'refinancing',
              'other',
            ],
            description: 'Purpose of the loan',
          },
          expectedRevenueIncrease: {
            type: 'number',
            minimum: 0,
            description: 'Expected annual revenue increase from expansion',
          },
          expectedEBITDAIncrease: {
            type: 'number',
            description: 'Expected annual EBITDA increase from expansion',
          },
          timeline: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'Expansion timeline in years',
          },
          description: { type: 'string', description: 'Description of expansion plan' },
        },
        required: [
          'loanAmount',
          'loanPurpose',
          'expectedRevenueIncrease',
          'expectedEBITDAIncrease',
          'timeline',
        ],
      },
      loanPreferences: {
        type: 'object',
        properties: {
          preferredTerm: {
            type: 'number',
            minimum: 1,
            maximum: 30,
            description: 'Preferred loan term in years',
          },
          preferredRate: {
            type: 'number',
            minimum: 0,
            maximum: 0.2,
            description: 'Expected interest rate (annual)',
          },
          loanType: {
            type: 'string',
            enum: [
              'term-loan',
              'line-of-credit',
              'sba',
              'equipment-financing',
              'commercial-mortgage',
            ],
            description: 'Type of loan',
          },
          collateralAvailable: {
            type: 'boolean',
            description: 'Whether collateral is available',
          },
          collateralValue: {
            type: 'number',
            minimum: 0,
            description: 'Value of available collateral',
          },
        },
        required: ['preferredTerm', 'loanType'],
      },
      goals: {
        type: 'object',
        properties: {
          riskTolerance: {
            type: 'string',
            enum: ['conservative', 'moderate', 'aggressive'],
            description: 'Risk tolerance',
          },
          priority: {
            type: 'string',
            enum: ['lowest-cost', 'fastest-approval', 'flexible-terms', 'maximum-amount'],
            description: 'Loan priority',
          },
          includeScenarioAnalysis: {
            type: 'boolean',
            description: 'Include scenario analysis',
          },
        },
        required: ['riskTolerance', 'priority'],
      },
    },
    required: ['businessInfo', 'currentFinancials', 'expansionPlan', 'loanPreferences', 'goals'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = BusinessExpansionLoanInputSchema.parse(args);
    const result = BusinessExpansionLoanJourney.analyze(validated);
    return result;
  }
}
