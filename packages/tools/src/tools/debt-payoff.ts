import { DebtPayoffInputSchema, DebtPayoffEngine } from '@financial-analysis/analysis';
import type { DebtPayoffInput, DebtPayoffResult } from '@financial-analysis/analysis';

/**
 * MCP tool for debt payoff optimization
 */
export class DebtPayoffTool {
  static readonly toolName = 'analyze_debt_payoff';
  
  static readonly description = `Analyze debt payoff strategies and compare avalanche vs snowball methods.

Features:
- Avalanche strategy: Pay highest interest rate debts first (mathematically optimal)
- Snowball strategy: Pay lowest balance debts first (psychological wins)
- Month-by-month payment schedule showing progress
- Comparison of both strategies with interest savings
- Balance transfer analysis with intro rate calculations
- Support for up to 20 different debts
- Handles credit cards, personal loans, any consumer debt

Input parameters:
- debts: Array of debts with name, balance, interest rate, minimum payment
- extraMonthlyPayment: Additional amount beyond minimums (default: 0)
- strategy: 'avalanche' or 'snowball' (default: 'avalanche')
- balanceTransferOffer: Optional offer with credit limit, fees, intro rate

Returns:
- Complete payoff schedule month-by-month
- Total months to payoff, interest paid, amount paid
- Individual debt summaries
- Alternative strategy comparison showing potential savings
- Balance transfer recommendation if applicable`;

  static readonly inputSchema = {
    type: 'object',
    required: ['debts'],
    properties: {
      debts: {
        type: 'array',
        description: 'List of debts to pay off',
        minItems: 1,
        maxItems: 20,
        items: {
          type: 'object',
          required: ['name', 'balance', 'interestRate', 'minimumPayment'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the debt (e.g., "Visa Credit Card")',
              minLength: 1,
              maxLength: 100,
            },
            balance: {
              type: 'number',
              description: 'Current balance owed',
              minimum: 0.01,
            },
            interestRate: {
              type: 'number',
              description: 'Annual interest rate as decimal (e.g., 0.18 for 18% APR)',
              minimum: 0,
              maximum: 1,
            },
            minimumPayment: {
              type: 'number',
              description: 'Minimum monthly payment required',
              minimum: 0.01,
            },
          },
        },
      },
      extraMonthlyPayment: {
        type: 'number',
        description: 'Extra amount to pay each month beyond all minimums',
        minimum: 0,
        default: 0,
      },
      strategy: {
        type: 'string',
        enum: ['avalanche', 'snowball'],
        description: 'Payoff strategy: avalanche (highest rate first) or snowball (lowest balance first)',
        default: 'avalanche',
      },
      balanceTransferOffer: {
        type: 'object',
        description: 'Optional balance transfer credit card offer to evaluate',
        properties: {
          creditLimit: {
            type: 'number',
            description: 'Credit limit on balance transfer card',
            minimum: 0.01,
          },
          transferFeeRate: {
            type: 'number',
            description: 'Transfer fee as decimal (e.g., 0.03 for 3%)',
            minimum: 0,
            maximum: 0.1,
          },
          introRate: {
            type: 'number',
            description: 'Introductory APR as decimal (e.g., 0 for 0%)',
            minimum: 0,
            maximum: 1,
          },
          introMonths: {
            type: 'number',
            description: 'Number of months at intro rate',
            minimum: 0,
            maximum: 36,
          },
          regularRate: {
            type: 'number',
            description: 'Regular APR after intro period as decimal',
            minimum: 0,
            maximum: 1,
          },
        },
        required: ['creditLimit', 'transferFeeRate', 'introRate', 'introMonths', 'regularRate'],
      },
    },
  };

  static async execute(args: unknown): Promise<DebtPayoffResult> {
    const input = DebtPayoffInputSchema.parse(args) as DebtPayoffInput;
    const result = DebtPayoffEngine.analyze(input);
    return result;
  }
}
