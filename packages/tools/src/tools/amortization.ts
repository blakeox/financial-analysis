import {
  AmortizationAnalyzer,
  AmortizationInputSchema,
  computeAmortizationInsights,
  type AmortizationAnalysisResult,
  type AmortizationInsights,
  type AmortizationInput,
} from '@financial-analysis/analysis';

export type AmortizationToolResponse = AmortizationAnalysisResult & {
  insights: AmortizationInsights;
};

export class AmortizationTool {
  static readonly toolName = 'analyze_amortization';
  static readonly description = 'Analyze loan amortization schedule';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      principal: { type: 'number', description: 'Principal amount' },
      annualRate: { type: 'number', description: 'Annual interest rate (0-1)' },
      termMonths: { type: 'number', description: 'Term in months' },
      startDate: {
        type: 'string',
        description: 'Optional ISO start date for the schedule',
      },
      extraMonthlyPayment: {
        type: 'number',
        description: 'Additional principal paid each month',
        default: 0,
      },
      oneTimePayments: {
        type: 'array',
        description: 'Extra payments applied in specific months',
        items: {
          type: 'object',
          properties: {
            month: { type: 'number', description: 'Month index (1-based)' },
            amount: { type: 'number', description: 'Extra payment amount' },
          },
          required: ['month', 'amount'],
        },
        default: [],
      },
      paymentFrequency: {
        type: 'string',
        enum: ['monthly', 'biweekly', 'weekly'],
        description: 'Payment cadence',
        default: 'monthly',
      },
      interestOnlyMonths: {
        type: 'number',
        description: 'Number of initial months with interest-only payments',
        default: 0,
      },
      balloonPayment: {
        type: 'number',
        description: 'Balloon payment applied at the end of the term',
        default: 0,
      },
      origination_fee: {
        type: 'number',
        description: 'Up-front origination fee added to principal',
        default: 0,
      },
      points: {
        type: 'number',
        description: 'Discount points as a percent of principal',
        default: 0,
      },
      pmi: {
        type: 'object',
        description: 'Private mortgage insurance configuration',
        properties: {
          enabled: { type: 'boolean', default: false },
          rate: { type: 'number', description: 'Annual PMI rate', default: 0 },
          dropOffLTV: {
            type: 'number',
            description: 'Loan-to-value threshold to drop PMI',
            default: 0.8,
          },
          homeValue: {
            type: 'number',
            description: 'Current home value used for LTV calculations',
          },
        },
        default: { enabled: false, rate: 0, dropOffLTV: 0.8 },
      },
      propertyTaxAnnual: {
        type: 'number',
        description: 'Annual property tax amount',
        default: 0,
      },
      homeInsuranceAnnual: {
        type: 'number',
        description: 'Annual homeowners insurance premium',
        default: 0,
      },
      hoaMonthly: {
        type: 'number',
        description: 'Monthly HOA fees',
        default: 0,
      },
      downPayment: {
        type: 'number',
        description: 'Down payment amount (for total cost calculation)',
        default: 0,
      },
      closingCosts: {
        type: 'number',
        description: 'Total closing costs (for APR calculation)',
        default: 0,
      },
    },
    required: ['principal', 'annualRate', 'termMonths'],
  };

  static execute(input: unknown): Promise<AmortizationToolResponse> {
    const validated = AmortizationInputSchema.parse(input) as AmortizationInput;
    const result = AmortizationAnalyzer.analyze(validated);
    const insights = computeAmortizationInsights(result);
    return Promise.resolve({ ...result, insights });
  }
}
