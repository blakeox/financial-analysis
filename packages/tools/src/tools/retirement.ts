import {
  RetirementEngine,
  RetirementInputSchema,
  type RetirementResult,
} from '@financial-analysis/analysis';

export class RetirementTool {
  static toolName = 'analyze_retirement_savings';

  static description = `Analyzes retirement savings projections with employer match optimization and tax advantages.

Features:
- Multi-account projections: 401(k), Roth 401(k), Traditional IRA, Roth IRA, SEP IRA
- Employer match optimization (identifies missed matching contributions)
- Tax advantage analysis (pre-tax vs Roth diversification)
- Withdrawal strategy modeling: 4% rule, fixed amount, required minimum distributions
- Inflation-adjusted real value projections
- Income replacement ratio calculations
- On-track assessment with shortfall analysis
- Catch-up contribution recommendations (age 50+)
- Year-by-year balance projections with compound growth

Supports up to 10 accounts with different contribution limits and match rules.

Returns comprehensive analysis including projected retirement balance, monthly retirement income, and optimization recommendations.`;

  static inputSchema = {
    type: 'object',
    properties: {
      currentAge: {
        type: 'number',
        description: 'Current age in years',
        minimum: 18,
        maximum: 100,
      },
      retirementAge: {
        type: 'number',
        description: 'Target retirement age in years',
        minimum: 50,
        maximum: 100,
      },
      currentIncome: {
        type: 'number',
        description: 'Current annual income in dollars',
        minimum: 1,
        maximum: 100_000_000,
      },
      accounts: {
        type: 'array',
        description: 'Array of retirement accounts',
        minItems: 1,
        maxItems: 10,
        items: {
          type: 'object',
          properties: {
            accountType: {
              type: 'string',
              enum: ['401k', 'roth_401k', 'traditional_ira', 'roth_ira', 'sep_ira'],
              description: 'Type of retirement account',
            },
            currentBalance: {
              type: 'number',
              description: 'Current account balance in dollars',
              minimum: 0,
              maximum: 100_000_000,
            },
            annualContribution: {
              type: 'number',
              description: 'Annual contribution amount in dollars',
              minimum: 0,
              maximum: 1_000_000,
            },
            employerMatch: {
              type: 'number',
              description: 'Employer match rate as decimal (e.g., 0.5 for 50% match, default 0)',
              minimum: 0,
              maximum: 1,
              default: 0,
            },
            employerMatchLimit: {
              type: 'number',
              description:
                'Max employee contribution for match as decimal (e.g., 0.06 for 6%, default 0.06)',
              minimum: 0,
              maximum: 1,
              default: 0.06,
            },
          },
          required: ['accountType', 'currentBalance', 'annualContribution'],
        },
      },
      expectedAnnualReturn: {
        type: 'number',
        description: 'Expected annual investment return as decimal (default 0.07 for 7%)',
        minimum: 0,
        maximum: 1,
        default: 0.07,
      },
      inflationRate: {
        type: 'number',
        description: 'Annual inflation rate as decimal (default 0.03 for 3%)',
        minimum: 0,
        maximum: 1,
        default: 0.03,
      },
      incomeIncreaseRate: {
        type: 'number',
        description: 'Expected annual income increase rate as decimal (default 0.03 for 3%)',
        minimum: 0,
        maximum: 1,
        default: 0.03,
      },
      desiredRetirementIncome: {
        type: 'number',
        description:
          'Desired annual retirement income in dollars (optional, calculates from 4% rule if not provided)',
        minimum: 1,
        maximum: 100_000_000,
      },
      withdrawalStrategy: {
        type: 'string',
        enum: ['4_percent_rule', 'fixed_amount', 'required_minimum'],
        description: 'Retirement withdrawal strategy (default 4_percent_rule)',
        default: '4_percent_rule',
      },
    },
    required: ['currentAge', 'retirementAge', 'currentIncome', 'accounts'],
  };

  static async execute(input: unknown): Promise<RetirementResult> {
    const validated = RetirementInputSchema.parse(input);
    return RetirementEngine.analyze(validated);
  }
}
