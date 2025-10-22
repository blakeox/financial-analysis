import {
  StudentLoanInputSchema,
  StudentLoanEngine,
  type StudentLoanResult,
} from "@financial-analysis/analysis";

export class StudentLoanTool {
  static toolName = "analyze_student_loans";

  static description = `Analyzes student loan payoff strategies including standard repayment, income-driven plans, and refinancing.

Features:
- Multiple payoff strategies: avalanche (highest rate first), snowball (lowest balance first), standard
- Income-Driven Repayment (IDR) plan analysis: IBR, PAYE, REPAYE, ICR
- Refinancing analysis with closing costs and rate comparison
- Forgiveness eligibility modeling (PSLF, IDR forgiveness)
- Federal vs private loan handling
- Month-by-month payment schedule
- Automatic strategy comparison showing interest savings
- Warnings about losing federal loan benefits when refinancing

Supports up to 20 loans with different rates, balances, and loan types.

Returns comprehensive analysis including total interest paid, payoff timeline, and recommendations for optimal strategy.`;

  static inputSchema = {
    type: "object",
    properties: {
      loans: {
        type: "array",
        description: "Array of student loans to analyze",
        minItems: 1,
        maxItems: 20,
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Loan name or identifier",
              minLength: 1,
              maxLength: 100,
            },
            balance: {
              type: "number",
              description: "Current loan balance in dollars",
              minimum: 1,
              maximum: 1_000_000,
            },
            interestRate: {
              type: "number",
              description: "Annual interest rate as decimal (e.g., 0.065 for 6.5%)",
              minimum: 0,
              maximum: 1,
            },
            minimumPayment: {
              type: "number",
              description: "Minimum monthly payment in dollars",
              minimum: 1,
              maximum: 100_000,
            },
            loanType: {
              type: "string",
              enum: ["federal_subsidized", "federal_unsubsidized", "private"],
              description: "Type of student loan",
              default: "federal_unsubsidized",
            },
            remainingMonths: {
              type: "number",
              description: "Remaining months on loan term (optional)",
              minimum: 1,
              maximum: 360,
            },
          },
          required: ["name", "balance", "interestRate", "minimumPayment"],
        },
      },
      extraMonthlyPayment: {
        type: "number",
        description: "Extra monthly payment amount in dollars (default 0)",
        minimum: 0,
        maximum: 1_000_000,
        default: 0,
      },
      paymentStrategy: {
        type: "string",
        enum: ["avalanche", "snowball", "standard"],
        description: "Payment strategy: avalanche (highest rate first), snowball (lowest balance first), or standard",
        default: "avalanche",
      },
      incomeDrivenPlan: {
        type: "object",
        description: "Optional income-driven repayment plan parameters",
        properties: {
          planType: {
            type: "string",
            enum: ["IBR", "PAYE", "REPAYE", "ICR"],
            description: "Income-driven repayment plan type",
          },
          annualIncome: {
            type: "number",
            description: "Current annual income in dollars",
            minimum: 1,
            maximum: 10_000_000,
          },
          familySize: {
            type: "number",
            description: "Family size for discretionary income calculation",
            minimum: 1,
            maximum: 20,
            default: 1,
          },
          expectedAnnualIncreaseRate: {
            type: "number",
            description: "Expected annual income increase rate as decimal (default 0.03)",
            minimum: 0,
            maximum: 1,
            default: 0.03,
          },
        },
        required: ["planType", "annualIncome"],
      },
      refinancingOption: {
        type: "object",
        description: "Optional refinancing parameters",
        properties: {
          newInterestRate: {
            type: "number",
            description: "New interest rate as decimal",
            minimum: 0,
            maximum: 1,
          },
          newTermMonths: {
            type: "number",
            description: "New loan term in months",
            minimum: 1,
            maximum: 360,
          },
          closingCosts: {
            type: "number",
            description: "Refinancing closing costs in dollars (default 0)",
            minimum: 0,
            maximum: 100_000,
            default: 0,
          },
        },
        required: ["newInterestRate", "newTermMonths"],
      },
      forgivenessEligible: {
        type: "boolean",
        description: "Whether eligible for loan forgiveness (PSLF, IDR forgiveness, default false)",
        default: false,
      },
      forgivenessMonths: {
        type: "number",
        description: "Months until forgiveness (120 for PSLF, 240 for IDR, optional)",
        minimum: 1,
        maximum: 360,
      },
    },
    required: ["loans"],
  };

  static async execute(input: unknown): Promise<StudentLoanResult> {
    const validated = StudentLoanInputSchema.parse(input);
    return StudentLoanEngine.analyze(validated);
  }
}
