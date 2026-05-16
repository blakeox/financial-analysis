import type { AutoLoanAnalysisResult } from '@financial-analysis/analysis';
import { AutoLoanAnalysisEngine, AutoLoanAnalysisInputSchema } from '@financial-analysis/analysis';

/**
 * MCP Tool for Auto Loan Analysis (comprehensive)
 *
 * Provides professional-grade auto loan analysis including:
 * - Loan amortization schedule
 * - Optional lease comparison
 * - Optional refinancing scenarios
 * - Optional total-cost-of-ownership (TCO)
 */
export class AutoLoanAnalysisTool {
  static readonly toolName = 'analyze_auto_loan_analysis';

  static readonly description =
    'Run a comprehensive auto loan analysis with optional lease comparison, refinancing scenarios, total cost of ownership (TCO), and a detailed payment schedule.';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      vehicle: {
        type: 'object' as const,
        properties: {
          make: { type: 'string', description: 'Vehicle make (e.g., Toyota)' },
          model: { type: 'string', description: 'Vehicle model (e.g., Camry)' },
          year: {
            type: 'number',
            description: 'Vehicle year',
            minimum: 1990,
          },
          msrp: { type: 'number', description: 'MSRP', minimum: 0 },
          negotiatedPrice: { type: 'number', description: 'Negotiated purchase price', minimum: 0 },
          tradeInValue: { type: 'number', description: 'Trade-in value', minimum: 0, default: 0 },
          downPayment: { type: 'number', description: 'Down payment', minimum: 0, default: 0 },
        },
        required: ['make', 'model', 'year', 'msrp', 'negotiatedPrice'],
      },
      loanTerms: {
        type: 'object' as const,
        properties: {
          loanAmount: { type: 'number', description: 'Loan amount (principal)', minimum: 0 },
          interestRate: {
            type: 'number',
            description: 'Annual interest rate as decimal (e.g., 0.0549 for 5.49% APR)',
            minimum: 0,
            maximum: 0.5,
          },
          termMonths: {
            type: 'number',
            description: 'Loan term in months',
            minimum: 12,
            maximum: 84,
          },
          salesTaxRate: {
            type: 'number',
            description: 'Sales tax rate as decimal (e.g., 0.0825 for 8.25%)',
            minimum: 0,
            maximum: 0.2,
            default: 0.08,
          },
          fees: {
            type: 'object' as const,
            properties: {
              documentationFee: { type: 'number', minimum: 0, default: 500 },
              titleFee: { type: 'number', minimum: 0, default: 100 },
              registrationFee: { type: 'number', minimum: 0, default: 200 },
              otherFees: { type: 'number', minimum: 0, default: 0 },
            },
            required: [],
          },
        },
        required: ['loanAmount', 'interestRate', 'termMonths', 'fees'],
      },
      leaseTerms: {
        type: 'object' as const,
        description: 'Optional lease terms for loan vs lease comparison',
        properties: {
          leaseAmount: { type: 'number', minimum: 0 },
          moneyFactor: { type: 'number', minimum: 0, maximum: 0.01 },
          termMonths: { type: 'number', minimum: 24, maximum: 48 },
          residualValue: { type: 'number', minimum: 0 },
          securityDeposit: { type: 'number', minimum: 0, default: 0 },
          acquisitionFee: { type: 'number', minimum: 0, default: 1000 },
          dispositionFee: { type: 'number', minimum: 0, default: 400 },
        },
        required: ['leaseAmount', 'moneyFactor', 'termMonths', 'residualValue'],
      },
      analysis: {
        type: 'object' as const,
        properties: {
          includeLeaseComparison: { type: 'boolean', default: true },
          includeRefinancingAnalysis: { type: 'boolean', default: true },
          includeTCOAnalysis: { type: 'boolean', default: true },
          includePaymentSchedule: { type: 'boolean', default: true },
          refinancingRates: {
            type: 'array',
            items: { type: 'number' },
            default: [0.03, 0.04, 0.05, 0.06],
          },
          ownershipYears: { type: 'number', minimum: 1, maximum: 10, default: 5 },
        },
        required: [],
      },
      tcoParameters: {
        type: 'object' as const,
        properties: {
          annualMileage: { type: 'number', minimum: 0, default: 12000 },
          fuelCostPerGallon: { type: 'number', minimum: 0, default: 3.5 },
          mpg: { type: 'number', minimum: 0, default: 25 },
          maintenanceCostPerYear: { type: 'number', minimum: 0, default: 1000 },
          insuranceCostPerYear: { type: 'number', minimum: 0, default: 1200 },
          registrationCostPerYear: { type: 'number', minimum: 0, default: 100 },
          depreciationRate: { type: 'number', minimum: 0, maximum: 1, default: 0.15 },
        },
        required: [],
      },
    },
    required: ['vehicle', 'loanTerms', 'analysis', 'tcoParameters'],
  };

  static async execute(args: unknown): Promise<AutoLoanAnalysisResult> {
    const validatedInput = AutoLoanAnalysisInputSchema.parse(args);
    return AutoLoanAnalysisEngine.analyze(validatedInput);
  }
}
