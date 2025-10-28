import type { AutoLoanResult } from '@financial-analysis/analysis';
import { AutoLoanEngine, AutoLoanInputSchema } from '@financial-analysis/analysis';

/**
 * MCP Tool for Auto Loan Analysis
 *
 * Provides comprehensive auto loan calculations including payment schedules,
 * cost breakdowns, trade-in values, and early payoff scenarios.
 */
export class AutoLoanTool {
  static readonly toolName = 'analyze_auto_loan';

  static readonly description =
    'Analyze auto loan with payment schedule, total cost breakdown including trade-in value, sales tax, fees, and early payoff scenarios. Supports down payments, manufacturer rebates, GAP insurance, and extended warranties.';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      vehiclePrice: {
        type: 'number',
        description: 'Total vehicle purchase price before any deductions or fees',
        minimum: 1,
        maximum: 10000000,
      },
      downPayment: {
        type: 'number',
        description: 'Cash down payment amount',
        minimum: 0,
        default: 0,
      },
      tradeInValue: {
        type: 'number',
        description: 'Market value of trade-in vehicle',
        minimum: 0,
        default: 0,
      },
      tradeInOwed: {
        type: 'number',
        description: 'Amount still owed on trade-in vehicle',
        minimum: 0,
        default: 0,
      },
      salesTaxRate: {
        type: 'number',
        description: 'Sales tax rate as decimal (e.g., 0.0825 for 8.25%)',
        minimum: 0,
        maximum: 0.25,
        default: 0,
      },
      registrationFees: {
        type: 'number',
        description: 'Vehicle registration and title fees',
        minimum: 0,
        default: 0,
      },
      dealerFees: {
        type: 'number',
        description: 'Dealer documentation and processing fees',
        minimum: 0,
        default: 0,
      },
      interestRate: {
        type: 'number',
        description: 'Annual interest rate as decimal (e.g., 0.0549 for 5.49% APR)',
        minimum: 0,
        maximum: 0.5,
      },
      loanTermMonths: {
        type: 'integer',
        description: 'Loan term in months (12-96)',
        minimum: 12,
        maximum: 96,
      },
      manufacturerRebate: {
        type: 'number',
        description: 'Manufacturer rebate or incentive amount',
        minimum: 0,
        default: 0,
      },
      includeGapInsurance: {
        type: 'boolean',
        description: 'Whether to include GAP insurance in financing',
        default: false,
      },
      gapInsuranceCost: {
        type: 'number',
        description: 'GAP insurance cost if included',
        minimum: 0,
        default: 0,
      },
      includeExtendedWarranty: {
        type: 'boolean',
        description: 'Whether to include extended warranty in financing',
        default: false,
      },
      extendedWarrantyCost: {
        type: 'number',
        description: 'Extended warranty cost if included',
        minimum: 0,
        default: 0,
      },
    },
    required: ['vehiclePrice', 'interestRate', 'loanTermMonths'],
  };

  /**
   * Execute auto loan analysis
   */
  static async execute(args: unknown): Promise<AutoLoanResult> {
    // Validate input
    const validatedInput = AutoLoanInputSchema.parse(args);

    // Run analysis
    const result = AutoLoanEngine.analyze(validatedInput);

    return result;
  }
}
