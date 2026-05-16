import { CashFlowAnalyzer, type CashFlowAnalysisInput } from '@financial-analysis/analysis';

export class CashFlowAnalysisTool {
  static readonly toolName = 'analyze_cash_flow';
  static readonly description =
    'Performs comprehensive cash flow analysis and projection. Generates detailed monthly cash flow projections including operating, investing, and financing activities. Calculates key metrics like free cash flow, burn rate, runway, liquidity ratios, and NPV/IRR. Provides financial health insights and strategic recommendations. Supports both direct and indirect cash flow methods.';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      companyName: {
        type: 'string',
        description: 'Name of the company or entity being analyzed',
      },
      analysisPeriodMonths: {
        type: 'number',
        description: 'Number of months to project (typically 12-36 months)',
        minimum: 1,
        maximum: 60,
        default: 12,
      },
      analysisMethod: {
        type: 'string',
        enum: ['direct', 'indirect'],
        description:
          'Method of cash flow analysis (direct = cash transactions, indirect = accrual-based)',
        default: 'direct',
      },
      operatingItems: {
        type: 'array',
        description: 'Operating cash flow items (revenue, expenses)',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['operating', 'investing', 'financing'],
            },
            category: {
              type: 'string',
              description: 'Category (e.g., "revenue", "salaries", "rent")',
            },
            amount: {
              type: 'number',
              description: 'Monthly amount (positive for inflows, negative for outflows)',
            },
            description: {
              type: 'string',
              description: 'Description of the cash flow item',
            },
            isRecurring: {
              type: 'boolean',
              description: 'Whether this is a recurring monthly item',
              default: true,
            },
            startDate: {
              type: 'string',
              description: 'Start date for this item (ISO 8601 format)',
            },
            endDate: {
              type: 'string',
              description: 'End date for this item (ISO 8601 format)',
            },
          },
          required: ['type', 'category', 'amount'],
        },
      },
      investingItems: {
        type: 'array',
        description: 'Investing cash flow items (CapEx, asset sales)',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['operating', 'investing', 'financing'],
            },
            category: {
              type: 'string',
              description: 'Category (e.g., "equipment-purchase", "asset-sale")',
            },
            amount: {
              type: 'number',
              description: 'Amount (negative for purchases, positive for sales)',
            },
            description: {
              type: 'string',
            },
            startDate: {
              type: 'string',
            },
          },
          required: ['type', 'category', 'amount'],
        },
      },
      financingItems: {
        type: 'array',
        description: 'Financing cash flow items (loans, equity, dividends)',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['operating', 'investing', 'financing'],
            },
            category: {
              type: 'string',
              description: 'Category (e.g., "loan-proceeds", "equity-investment", "dividends")',
            },
            amount: {
              type: 'number',
              description: 'Amount (positive for inflows, negative for outflows)',
            },
            description: {
              type: 'string',
            },
            startDate: {
              type: 'string',
            },
          },
          required: ['type', 'category', 'amount'],
        },
      },
      debtObligations: {
        type: 'array',
        description: 'Existing debt obligations requiring payment',
        items: {
          type: 'object',
          properties: {
            principal: {
              type: 'number',
              description: 'Principal amount of debt',
              minimum: 0,
            },
            interestRate: {
              type: 'number',
              description: 'Annual interest rate as decimal (e.g., 0.06 for 6%)',
              minimum: 0,
              maximum: 1,
            },
            termMonths: {
              type: 'number',
              description: 'Loan term in months',
              minimum: 1,
            },
            paymentFrequency: {
              type: 'string',
              enum: ['monthly', 'quarterly', 'annual'],
              default: 'monthly',
            },
            description: {
              type: 'string',
            },
          },
          required: ['principal', 'interestRate', 'termMonths'],
        },
      },
      capitalExpenditures: {
        type: 'array',
        description: 'Planned capital expenditures',
        items: {
          type: 'object',
          properties: {
            assetName: {
              type: 'string',
              description: 'Name of the asset',
            },
            cost: {
              type: 'number',
              description: 'Total cost of the asset',
              minimum: 0,
            },
            purchaseDate: {
              type: 'string',
              description: 'Purchase date (ISO 8601 format)',
            },
            usefulLifeMonths: {
              type: 'number',
              description: 'Useful life in months for depreciation',
              minimum: 1,
            },
            depreciationMethod: {
              type: 'string',
              enum: ['straight-line', 'declining-balance'],
              default: 'straight-line',
            },
          },
          required: ['assetName', 'cost', 'usefulLifeMonths'],
        },
      },
      workingCapitalChanges: {
        type: 'object',
        description: 'Changes in working capital components',
        properties: {
          accountsReceivableDays: {
            type: 'number',
            description: 'Days sales outstanding (DSO)',
            minimum: 0,
          },
          inventoryDays: {
            type: 'number',
            description: 'Days inventory outstanding (DIO)',
            minimum: 0,
          },
          accountsPayableDays: {
            type: 'number',
            description: 'Days payable outstanding (DPO)',
            minimum: 0,
          },
        },
      },
      discountRate: {
        type: 'number',
        description: 'Discount rate for NPV calculation as decimal (e.g., 0.10 for 10%)',
        minimum: 0,
        maximum: 1,
        default: 0.1,
      },
      taxRate: {
        type: 'number',
        description: 'Corporate tax rate as decimal (e.g., 0.21 for 21%)',
        minimum: 0,
        maximum: 1,
        default: 0,
      },
      initialCashBalance: {
        type: 'number',
        description: 'Starting cash balance',
        minimum: 0,
        default: 0,
      },
      seasonalityFactors: {
        type: 'array',
        description:
          'Monthly seasonality factors (12 numbers, where 1.0 = average, 1.2 = 20% above average)',
        items: {
          type: 'number',
          minimum: 0,
        },
        minItems: 12,
        maxItems: 12,
      },
      growthAssumptions: {
        type: 'object',
        description: 'Growth rate assumptions',
        properties: {
          revenueGrowthRate: {
            type: 'number',
            description: 'Monthly revenue growth rate as decimal',
          },
          expenseGrowthRate: {
            type: 'number',
            description: 'Monthly expense growth rate as decimal',
          },
        },
      },
    },
    required: ['analysisPeriodMonths'],
  };

  static async execute(args: unknown): Promise<string> {
    try {
      const result = await CashFlowAnalyzer.analyze(args as CashFlowAnalysisInput);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      if (error instanceof Error) {
        return JSON.stringify({ error: error.message }, null, 2);
      }
      return JSON.stringify({ error: 'Unknown error occurred' }, null, 2);
    }
  }
}
