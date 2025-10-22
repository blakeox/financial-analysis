import {
  SavingsGoalInputSchema,
  SavingsGoalEngine,
  type SavingsGoalResult,
} from "@financial-analysis/analysis";

export class SavingsGoalTool {
  static toolName = "analyze_savings_goal";

  static description = `Analyzes savings goals with compound interest projections and inflation adjustment.

Features:
- Time-to-goal calculations with compound interest
- Required contribution amounts for target dates
- Inflation-adjusted real value projections
- Goal-specific recommendations (emergency fund, home down payment, education, retirement)
- Alternative scenarios (reach goal faster, different contribution amounts)
- Month-by-month savings schedule
- Effective return after inflation

Goal types:
- general: Basic savings goal
- emergency_fund: 3-6 months expenses (provides specific guidance)
- home_down_payment: Down payment savings (investment recommendations)
- education: College/education savings (529 plan guidance)
- retirement: Retirement savings (tax-advantaged account recommendations)

Returns comprehensive analysis including projected balance, real purchasing power, and actionable recommendations.`;

  static inputSchema = {
    type: "object",
    properties: {
      goalAmount: {
        type: "number",
        description: "Target savings amount in dollars",
        minimum: 1,
        maximum: 100_000_000,
      },
      currentSavings: {
        type: "number",
        description: "Current saved amount in dollars",
        minimum: 0,
        maximum: 100_000_000,
      },
      monthlyContribution: {
        type: "number",
        description: "Monthly contribution amount in dollars (optional, default 0)",
        minimum: 0,
        maximum: 10_000_000,
        default: 0,
      },
      annualReturnRate: {
        type: "number",
        description: "Expected annual return rate as decimal (e.g., 0.05 for 5%, default 0.05)",
        minimum: 0,
        maximum: 1,
        default: 0.05,
      },
      inflationRate: {
        type: "number",
        description: "Annual inflation rate as decimal (e.g., 0.03 for 3%, default 0.03)",
        minimum: 0,
        maximum: 1,
        default: 0.03,
      },
      timeHorizonMonths: {
        type: "number",
        description: "Fixed time horizon in months (optional, calculates time to goal if not provided)",
        minimum: 1,
        maximum: 600,
      },
      goalType: {
        type: "string",
        enum: ["general", "emergency_fund", "home_down_payment", "education", "retirement"],
        description: "Type of savings goal for tailored recommendations",
        default: "general",
      },
    },
    required: ["goalAmount", "currentSavings"],
  };

  static async execute(input: unknown): Promise<SavingsGoalResult> {
    const validated = SavingsGoalInputSchema.parse(input);
    return SavingsGoalEngine.analyze(validated);
  }
}
