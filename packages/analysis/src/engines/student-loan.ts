import Decimal from "decimal.js";
import type { StudentLoanInput } from "../schemas/student-loan.js";
import type {
  StudentLoanResult,
  StudentLoanMonth,
  LoanPayment,
  LoanSummary,
  StandardPayoffSummary,
  IncomeDrivenAnalysis,
  RefinancingAnalysis,
} from "../types/student-loan-result.js";

const MAX_MONTHS = 360; // 30 years safety limit
const POVERTY_GUIDELINE_SINGLE = 15060; // 2024 federal poverty guideline (will be used for IDR calculations)

interface LoanState {
  name: string;
  loanType: string;
  balance: Decimal;
  rate: Decimal;
  minimum: Decimal;
  originalBalance: Decimal;
  totalPaid: Decimal;
  totalInterest: Decimal;
}

/**
 * Analyzes student loan payoff strategies including standard, IDR, and refinancing.
 */
export function analyze(input: StudentLoanInput): StudentLoanResult {
  // Calculate standard repayment
  const standardResult = calculateStandardPayoff(input);

  // Calculate income-driven repayment if provided
  let idrAnalysis: IncomeDrivenAnalysis | undefined;
  if (input.incomeDrivenPlan) {
    idrAnalysis = calculateIncomeDrivenRepayment(input, standardResult.summary);
  }

  // Calculate refinancing analysis if provided
  let refinancingAnalysis: RefinancingAnalysis | undefined;
  if (input.refinancingOption) {
    refinancingAnalysis = calculateRefinancing(input, standardResult.summary);
  }

  // Generate recommendations
  const recommendations = generateRecommendations(input, standardResult, idrAnalysis, refinancingAnalysis);

  const totalBalance = input.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const weightedRate =
    input.loans.reduce((sum, loan) => sum + loan.balance * loan.interestRate, 0) / totalBalance;

  return {
    input: {
      totalLoans: input.loans.length,
      totalBalance: new Decimal(totalBalance).toFixed(2),
      weightedAverageRate: new Decimal(weightedRate).times(100).toFixed(2),
      extraMonthlyPayment: new Decimal(input.extraMonthlyPayment).toFixed(2),
      paymentStrategy: input.paymentStrategy,
    },
    payoffSchedule: standardResult.schedule,
    summary: standardResult.summary,
    incomeDrivenAnalysis: idrAnalysis,
    refinancingAnalysis,
    recommendations,
    metadata: {
      calculatedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

function calculateStandardPayoff(
  input: StudentLoanInput
): { schedule: StudentLoanMonth[]; summary: StandardPayoffSummary } {
  const loans: LoanState[] = input.loans.map((loan) => ({
    name: loan.name,
    loanType: loan.loanType,
    balance: new Decimal(loan.balance),
    rate: new Decimal(loan.interestRate),
    minimum: new Decimal(loan.minimumPayment),
    originalBalance: new Decimal(loan.balance),
    totalPaid: new Decimal(0),
    totalInterest: new Decimal(0),
  }));

  const extraPayment = new Decimal(input.extraMonthlyPayment);

  // Sort loans by strategy
  if (input.paymentStrategy === "avalanche") {
    loans.sort((a, b) => b.rate.minus(a.rate).toNumber());
  } else if (input.paymentStrategy === "snowball") {
    loans.sort((a, b) => a.balance.minus(b.balance).toNumber());
  }

  const schedule: StudentLoanMonth[] = [];
  let month = 0;

  while (loans.some((loan) => loan.balance.gt(0)) && month < MAX_MONTHS) {
    month++;
    const monthPayments: LoanPayment[] = [];
    let totalMonthPayment = new Decimal(0);
    let totalMonthInterest = new Decimal(0);

    // Apply minimum payments and interest
    for (const loan of loans) {
      if (loan.balance.lte(0)) {
        monthPayments.push({
          loanName: loan.name,
          payment: "0.00",
          principal: "0.00",
          interest: "0.00",
          balance: "0.00",
        });
        continue;
      }

      // Calculate interest
      const monthlyRate = loan.rate.div(12);
      const interest = loan.balance.times(monthlyRate);
      loan.totalInterest = loan.totalInterest.plus(interest);

      // Apply minimum payment
      const payment = Decimal.min(loan.minimum, loan.balance.plus(interest));
      const principal = payment.minus(interest);

      loan.balance = loan.balance.plus(interest).minus(payment);
      loan.totalPaid = loan.totalPaid.plus(payment);

      totalMonthPayment = totalMonthPayment.plus(payment);
      totalMonthInterest = totalMonthInterest.plus(interest);

      monthPayments.push({
        loanName: loan.name,
        payment: payment.toFixed(2),
        principal: principal.toFixed(2),
        interest: interest.toFixed(2),
        balance: loan.balance.toFixed(2),
      });
    }

    // Apply extra payment to first loan with balance
    let remainingExtra = extraPayment;
    for (const loan of loans) {
      if (loan.balance.gt(0) && remainingExtra.gt(0)) {
        const extraApplied = Decimal.min(remainingExtra, loan.balance);
        loan.balance = loan.balance.minus(extraApplied);
        loan.totalPaid = loan.totalPaid.plus(extraApplied);
        totalMonthPayment = totalMonthPayment.plus(extraApplied);

        // Update payment in monthPayments
        const paymentIndex = monthPayments.findIndex((p) => p.loanName === loan.name);
        if (paymentIndex >= 0 && monthPayments[paymentIndex]) {
          const existingPayment = monthPayments[paymentIndex];
          const currentPayment = new Decimal(existingPayment.payment);
          const currentPrincipal = new Decimal(existingPayment.principal);
          monthPayments[paymentIndex] = {
            loanName: existingPayment.loanName,
            payment: currentPayment.plus(extraApplied).toFixed(2),
            principal: currentPrincipal.plus(extraApplied).toFixed(2),
            interest: existingPayment.interest,
            balance: loan.balance.toFixed(2),
          };
        }

        remainingExtra = remainingExtra.minus(extraApplied);
      }
    }

    const remainingBalance = loans.reduce((sum, loan) => sum.plus(loan.balance), new Decimal(0));

    schedule.push({
      month,
      payments: monthPayments,
      totalPayment: totalMonthPayment.toFixed(2),
      totalInterest: totalMonthInterest.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
    });

    if (remainingBalance.lte(0)) break;
  }

  // Build summary
  const loanSummaries: LoanSummary[] = loans.map((loan) => ({
    name: loan.name,
    loanType: loan.loanType,
    originalBalance: loan.originalBalance.toFixed(2),
    totalPaid: loan.totalPaid.toFixed(2),
    totalInterest: loan.totalInterest.toFixed(2),
    monthsToPayoff: month,
  }));

  const totalInterest = loans.reduce((sum, loan) => sum.plus(loan.totalInterest), new Decimal(0));
  const totalPaid = loans.reduce((sum, loan) => sum.plus(loan.totalPaid), new Decimal(0));
  const totalMinimum = input.loans.reduce((sum, loan) => sum + loan.minimumPayment, 0);
  const avgMonthlyPayment = new Decimal(totalMinimum).plus(input.extraMonthlyPayment);

  const summary: StandardPayoffSummary = {
    strategy: input.paymentStrategy,
    totalMonthsToPayoff: month,
    totalInterestPaid: totalInterest.toFixed(2),
    totalAmountPaid: totalPaid.toFixed(2),
    averageMonthlyPayment: avgMonthlyPayment.toFixed(2),
    loanSummaries,
  };

  return { schedule, summary };
}

function calculateIncomeDrivenRepayment(
  input: StudentLoanInput,
  standardSummary: StandardPayoffSummary
): IncomeDrivenAnalysis {
  const plan = input.incomeDrivenPlan!;
  const planType = plan.planType;
  const annualIncome = new Decimal(plan.annualIncome);
  const familySize = plan.familySize;
  const incomeIncreaseRate = new Decimal(plan.expectedAnnualIncreaseRate);

  // Calculate discretionary income (income above 150% of poverty line)
  const povertyLine = new Decimal(POVERTY_GUIDELINE_SINGLE).plus(
    new Decimal(5140).times(familySize - 1)
  );
  const discretionaryIncome = Decimal.max(0, annualIncome.minus(povertyLine.times(1.5)));

  // Calculate percentage of discretionary income (varies by plan)
  let paymentPercent: Decimal;
  if (planType === "IBR" || planType === "PAYE") {
    paymentPercent = new Decimal(0.1); // 10%
  } else if (planType === "REPAYE") {
    paymentPercent = new Decimal(0.1); // 10%
  } else {
    // ICR
    paymentPercent = new Decimal(0.2); // 20%
  }

  const monthlyPaymentYear1 = discretionaryIncome.times(paymentPercent).div(12);

  // Simulate payoff with income growth
  const totalBalance = input.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const weightedRate =
    input.loans.reduce((sum, loan) => sum + loan.balance * loan.interestRate, 0) / totalBalance;
  
  let balance = new Decimal(totalBalance);
  let totalPaid = new Decimal(0);
  let totalInterest = new Decimal(0);
  let monthlyPayment = monthlyPaymentYear1;
  let currentIncome = annualIncome;
  let month = 0;

  const forgivenessMonths = input.forgivenessEligible ? (input.forgivenessMonths || 240) : MAX_MONTHS;

  while (balance.gt(0) && month < forgivenessMonths) {
    month++;

    // Recalculate payment each year based on income growth
    if (month % 12 === 0) {
      currentIncome = currentIncome.times(new Decimal(1).plus(incomeIncreaseRate));
      const newDiscretionaryIncome = Decimal.max(
        0,
        currentIncome.minus(povertyLine.times(1.5))
      );
      monthlyPayment = newDiscretionaryIncome.times(paymentPercent).div(12);
    }

    const interest = balance.times(new Decimal(weightedRate)).div(12);
    totalInterest = totalInterest.plus(interest);

    const payment = Decimal.min(monthlyPayment, balance.plus(interest));

    balance = balance.plus(interest).minus(payment);
    totalPaid = totalPaid.plus(payment);

    if (balance.lte(0)) break;
  }

  const finalMonthlyPayment = monthlyPayment;
  const potentialForgiveness = Decimal.max(0, balance);

  // Comparison to standard
  const standardInterest = new Decimal(standardSummary.totalInterestPaid);
  const standardPaid = new Decimal(standardSummary.totalAmountPaid);
  const standardMonths = standardSummary.totalMonthsToPayoff;

  const paymentDiff = totalPaid.minus(standardPaid);
  const interestDiff = totalInterest.minus(standardInterest);
  const timeDiff = month - standardMonths;

  let recommended = false;
  let reason = "";

  if (potentialForgiveness.gt(0)) {
    recommended = true;
    reason = `IDR offers potential forgiveness of $${potentialForgiveness.toFixed(0)} after ${(forgivenessMonths / 12).toFixed(0)} years`;
  } else if (totalPaid.lt(standardPaid)) {
    recommended = true;
    reason = `IDR saves $${standardPaid.minus(totalPaid).toFixed(0)} compared to standard repayment`;
  } else {
    recommended = false;
    reason = `Standard repayment is more cost-effective, saving $${paymentDiff.toFixed(0)} and ${-timeDiff} months`;
  }

  return {
    planType,
    monthlyPaymentYear1: monthlyPaymentYear1.toFixed(2),
    monthlyPaymentFinal: finalMonthlyPayment.toFixed(2),
    totalMonthsToPayoff: month,
    totalAmountPaid: totalPaid.toFixed(2),
    totalInterestPaid: totalInterest.toFixed(2),
    potentialForgiveness: potentialForgiveness.toFixed(2),
    comparisonToStandard: {
      paymentDifference: paymentDiff.toFixed(2),
      interestDifference: interestDiff.toFixed(2),
      timeDifference: timeDiff,
      recommended,
      reason,
    },
  };
}

function calculateRefinancing(
  input: StudentLoanInput,
  standardSummary: StandardPayoffSummary
): RefinancingAnalysis {
  const refinancing = input.refinancingOption!;
  const newRate = new Decimal(refinancing.newInterestRate);
  const newTermMonths = refinancing.newTermMonths;
  const closingCosts = new Decimal(refinancing.closingCosts);

  const totalBalance = input.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const principal = new Decimal(totalBalance).plus(closingCosts);

  // Calculate new monthly payment using amortization formula
  const monthlyRate = newRate.div(12);
  const numerator = principal.times(monthlyRate).times(new Decimal(1).plus(monthlyRate).pow(newTermMonths));
  const denominator = new Decimal(1).plus(monthlyRate).pow(newTermMonths).minus(1);
  const newMonthlyPayment = numerator.div(denominator);

  const totalPaid = newMonthlyPayment.times(newTermMonths);
  const totalInterest = totalPaid.minus(principal);

  // Compare to standard
  const standardPaid = new Decimal(standardSummary.totalAmountPaid);
  const totalSavings = standardPaid.minus(totalPaid);

  const warnings: string[] = [];
  let recommended = false;
  let reason = "";

  // Check if refinancing federal loans (loses benefits)
  const hasFederalLoans = input.loans.some(
    (loan) => loan.loanType === "federal_subsidized" || loan.loanType === "federal_unsubsidized"
  );

  if (hasFederalLoans) {
    warnings.push(
      "Refinancing federal loans means losing federal protections (IDR, forgiveness, forbearance)"
    );
  }

  if (totalSavings.gt(0)) {
    recommended = true;
    reason = `Refinancing saves $${totalSavings.toFixed(0)} over the life of the loan`;
  } else {
    recommended = false;
    reason = `Current loan terms are better. Refinancing would cost an additional $${totalSavings.abs().toFixed(0)}`;
  }

  const oldRate = input.loans.reduce((sum, loan) => sum + loan.balance * loan.interestRate, 0) / totalBalance;
  if (newRate.gte(oldRate)) {
    warnings.push(
      `New rate (${newRate.times(100).toFixed(2)}%) is not lower than weighted average current rate (${new Decimal(oldRate).times(100).toFixed(2)}%)`
    );
  }

  return {
    newInterestRate: newRate.times(100).toFixed(2),
    newTermMonths,
    closingCosts: closingCosts.toFixed(2),
    newMonthlyPayment: newMonthlyPayment.toFixed(2),
    totalAmountPaid: totalPaid.toFixed(2),
    totalInterestPaid: totalInterest.toFixed(2),
    totalSavings: totalSavings.toFixed(2),
    recommended,
    reason,
    warnings,
  };
}

function generateRecommendations(
  input: StudentLoanInput,
  standardResult: { summary: StandardPayoffSummary },
  idrAnalysis?: IncomeDrivenAnalysis,
  refinancingAnalysis?: RefinancingAnalysis
): string[] {
  const recommendations: string[] = [];

  // Strategy-specific recommendations
  if (input.paymentStrategy === "avalanche") {
    recommendations.push(
      "Avalanche method targets highest interest loans first, minimizing total interest paid"
    );
  } else if (input.paymentStrategy === "snowball") {
    recommendations.push(
      "Snowball method targets smallest balances first for psychological wins, but may cost more in interest"
    );
  }

  // Extra payment recommendations
  const extraPayment = new Decimal(input.extraMonthlyPayment);
  if (extraPayment.eq(0)) {
    recommendations.push(
      "Consider making extra payments to reduce interest and pay off loans faster"
    );
  }

  // IDR recommendations
  if (idrAnalysis && idrAnalysis.comparisonToStandard.recommended) {
    recommendations.push(idrAnalysis.comparisonToStandard.reason);
  }

  // Refinancing recommendations
  if (refinancingAnalysis) {
    if (refinancingAnalysis.recommended) {
      recommendations.push(refinancingAnalysis.reason);
    }
    refinancingAnalysis.warnings.forEach((warning) => recommendations.push(warning));
  }

  // Federal loan specific
  const hasFederalLoans = input.loans.some(
    (loan) => loan.loanType === "federal_subsidized" || loan.loanType === "federal_unsubsidized"
  );
  if (hasFederalLoans && !idrAnalysis) {
    recommendations.push(
      "Explore income-driven repayment plans (IBR, PAYE, REPAYE) for potential lower payments and forgiveness"
    );
  }

  // Payoff timeline
  const years = new Decimal(standardResult.summary.totalMonthsToPayoff).div(12);
  if (years.gt(10)) {
    recommendations.push(
      `Current payoff timeline is ${years.toFixed(1)} years. Consider increasing payments to reduce interest.`
    );
  }

  return recommendations;
}
