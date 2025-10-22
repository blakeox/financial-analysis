import {
  BudgetInputSchema,
  BudgetEngine,
  type BudgetResult,
} from "@financial-analysis/analysis";

export class BudgetTool {
  static toolName = "optimize_budget";

  static description = `Analyzes income, expenses, and debts to provide budget optimization recommendations.

Features:
- Comprehensive income and expense analysis (up to 20 income sources, 50 expense categories)
- Debt-to-income ratio calculation and analysis
- Financial health score (0-100) based on savings rate, housing ratio, and DTI
- 50/30/20 budget rule analysis (needs/wants/savings)
- Spending pattern identification and overspending alerts
- Optimized budget generation with actionable adjustments
- Multiple optimization goals:
  - maximize_savings: Target 20% savings rate
  - reduce_debt: Focus on debt payoff
  - balance: Follow 50/30/20 rule
  - reduce_discretionary: Cut non-essential spending
- Expense categorization (housing, food, transportation, entertainment, etc.)
- Fixed vs variable and essential vs discretionary expense analysis
- Emergency fund recommendations

Returns comprehensive analysis including budget metrics, optimized spending plan, and prioritized recommendations.`;

  static inputSchema = {
    type: "object",
    properties: {
      income: {
        type: "array",
        description: "Array of income sources",
        minItems: 1,
        maxItems: 20,
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Income source name",
              minLength: 1,
              maxLength: 100,
            },
            monthlyAmount: {
              type: "number",
              description: "Monthly income amount in dollars",
              minimum: 1,
              maximum: 10_000_000,
            },
            type: {
              type: "string",
              enum: ["salary", "business", "investment", "rental", "other"],
              description: "Type of income",
              default: "salary",
            },
            recurring: {
              type: "boolean",
              description: "Whether income is recurring",
              default: true,
            },
          },
          required: ["name", "monthlyAmount"],
        },
      },
      expenses: {
        type: "array",
        description: "Array of expense categories",
        minItems: 1,
        maxItems: 50,
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Expense category name",
              minLength: 1,
              maxLength: 100,
            },
            monthlyAmount: {
              type: "number",
              description: "Monthly expense amount in dollars",
              minimum: 1,
              maximum: 10_000_000,
            },
            type: {
              type: "string",
              enum: [
                "housing",
                "transportation",
                "food",
                "utilities",
                "insurance",
                "healthcare",
                "debt_payment",
                "entertainment",
                "personal",
                "savings",
                "other",
              ],
              description: "Type of expense",
              default: "other",
            },
            isFixed: {
              type: "boolean",
              description: "Whether expense is fixed (same each month)",
              default: false,
            },
            isEssential: {
              type: "boolean",
              description: "Whether expense is essential/necessary",
              default: true,
            },
          },
          required: ["name", "monthlyAmount"],
        },
      },
      debts: {
        type: "array",
        description: "Array of debt obligations (optional, max 20)",
        maxItems: 20,
        default: [],
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Debt name",
              minLength: 1,
              maxLength: 100,
            },
            totalBalance: {
              type: "number",
              description: "Total debt balance in dollars",
              minimum: 1,
              maximum: 10_000_000,
            },
            monthlyPayment: {
              type: "number",
              description: "Monthly payment amount in dollars",
              minimum: 1,
              maximum: 1_000_000,
            },
            interestRate: {
              type: "number",
              description: "Annual interest rate as decimal (e.g., 0.18 for 18%)",
              minimum: 0,
              maximum: 1,
            },
            type: {
              type: "string",
              enum: ["mortgage", "auto", "student", "credit_card", "personal", "other"],
              description: "Type of debt",
              default: "other",
            },
          },
          required: ["name", "totalBalance", "monthlyPayment", "interestRate"],
        },
      },
      savingsGoalMonthly: {
        type: "number",
        description: "Monthly savings goal in dollars (default 0)",
        minimum: 0,
        maximum: 10_000_000,
        default: 0,
      },
      optimizationGoal: {
        type: "string",
        enum: ["maximize_savings", "reduce_debt", "balance", "reduce_discretionary"],
        description: "Budget optimization goal (default balance)",
        default: "balance",
      },
    },
    required: ["income", "expenses"],
  };

  static async execute(input: unknown): Promise<BudgetResult> {
    const validated = BudgetInputSchema.parse(input);
    return BudgetEngine.analyze(validated);
  }
}
