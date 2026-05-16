import Decimal from 'decimal.js';
import type { DebtPayoffInput } from '../../schemas/debt-payoff.js';
import type {
  DebtPayoffResult,
  PayoffMonth,
  DebtPayment,
  PayoffStrategySummary,
  DebtSummary,
  BalanceTransferAnalysis,
} from '../../types/debt-payoff-result.js';

/**
 * Internal debt tracking for calculations
 */
interface DebtState {
  name: string;
  balance: Decimal;
  interestRate: Decimal;
  minimumPayment: Decimal;
  totalPaid: Decimal;
  totalInterest: Decimal;
  monthsPaid: number;
}

/**
 * Analyze debt payoff strategies
 */
export function analyze(input: DebtPayoffInput): DebtPayoffResult {
  const totalBalance = input.debts.reduce((sum, d) => sum.plus(d.balance), new Decimal(0));
  const totalMinimum = input.debts.reduce((sum, d) => sum.plus(d.minimumPayment), new Decimal(0));
  const extraPayment = new Decimal(input.extraMonthlyPayment);

  // Calculate primary strategy
  const primaryResult = calculateStrategy(input, input.strategy);

  // Calculate alternative strategy for comparison
  const alternativeStrategy = input.strategy === 'avalanche' ? 'snowball' : 'avalanche';
  const alternativeResult = calculateStrategy(input, alternativeStrategy);

  const savings = new Decimal(alternativeResult.summary.totalInterestPaid).minus(
    primaryResult.summary.totalInterestPaid
  );

  // Calculate balance transfer scenario if provided
  let balanceTransfer: BalanceTransferAnalysis | undefined;
  if (input.balanceTransferOffer) {
    balanceTransfer = calculateBalanceTransfer(input);
  }

  return {
    input: {
      totalDebtBalance: totalBalance.toFixed(2),
      numberOfDebts: input.debts.length,
      totalMinimumPayment: totalMinimum.toFixed(2),
      extraMonthlyPayment: extraPayment.toFixed(2),
      strategy: input.strategy,
    },
    payoffSchedule: primaryResult.schedule,
    summary: primaryResult.summary,
    alternativeStrategy: alternativeResult.summary,
    comparisonSavings: savings.toFixed(2),
    balanceTransfer,
    metadata: {
      timestamp: new Date().toISOString(),
      calculationMethod: 'debt-payoff-optimizer-v1',
    },
  };
}

/**
 * Calculate payoff using a specific strategy
 */
function calculateStrategy(
  input: DebtPayoffInput,
  strategy: 'avalanche' | 'snowball'
): { schedule: PayoffMonth[]; summary: PayoffStrategySummary } {
  // Initialize debt states
  const debts: DebtState[] = input.debts.map((d) => ({
    name: d.name,
    balance: new Decimal(d.balance),
    interestRate: new Decimal(d.interestRate),
    minimumPayment: new Decimal(d.minimumPayment),
    totalPaid: new Decimal(0),
    totalInterest: new Decimal(0),
    monthsPaid: 0,
  }));

  // Sort debts by strategy
  if (strategy === 'avalanche') {
    // Highest interest rate first
    debts.sort((a, b) => b.interestRate.minus(a.interestRate).toNumber());
  } else {
    // Lowest balance first
    debts.sort((a, b) => a.balance.minus(b.balance).toNumber());
  }

  const extraPayment = new Decimal(input.extraMonthlyPayment);
  const schedule: PayoffMonth[] = [];
  let month = 0;
  const MAX_MONTHS = 600; // 50 years safety limit

  while (debts.some((d) => d.balance.greaterThan(0)) && month < MAX_MONTHS) {
    month++;
    const monthPayments: DebtPayment[] = [];
    let totalPayment = new Decimal(0);
    let totalInterest = new Decimal(0);
    let availableExtra = extraPayment;

    // Pay all debts
    for (const debt of debts) {
      if (debt.balance.lessThanOrEqualTo(0)) {
        continue;
      }

      // Calculate interest for this month
      const monthlyRate = debt.interestRate.dividedBy(12);
      const interest = debt.balance.times(monthlyRate);

      // Start with minimum payment
      let payment = debt.minimumPayment;

      // Find first debt with balance and allocate extra payment
      const firstDebtWithBalance = debts.find((d) => d.balance.greaterThan(0));
      if (debt === firstDebtWithBalance && availableExtra.greaterThan(0)) {
        payment = payment.plus(availableExtra);
        availableExtra = new Decimal(0);
      }

      // Ensure payment doesn't exceed balance + interest
      const maxPayment = debt.balance.plus(interest);
      if (payment.greaterThan(maxPayment)) {
        // Return excess to extra pool for next debt
        availableExtra = availableExtra.plus(payment.minus(maxPayment));
        payment = maxPayment;
      }

      const principal = payment.minus(interest);

      // Update debt state
      debt.balance = debt.balance.minus(principal);
      if (debt.balance.lessThan(0)) {
        debt.balance = new Decimal(0);
      }
      debt.totalPaid = debt.totalPaid.plus(payment);
      debt.totalInterest = debt.totalInterest.plus(interest);
      debt.monthsPaid++;

      totalPayment = totalPayment.plus(payment);
      totalInterest = totalInterest.plus(interest);

      monthPayments.push({
        debtName: debt.name,
        payment: payment.toFixed(2),
        principal: principal.toFixed(2),
        interest: interest.toFixed(2),
        balance: debt.balance.toFixed(2),
      });
    }

    const remainingBalance = debts.reduce((sum, d) => sum.plus(d.balance), new Decimal(0));

    schedule.push({
      month,
      payments: monthPayments,
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
    });

    // Stop if all debts paid off
    if (remainingBalance.lessThanOrEqualTo(0)) {
      break;
    }
  }

  // Build summary
  const debtSummaries: DebtSummary[] = input.debts.map((original) => {
    const debt = debts.find((d) => d.name === original.name);
    if (!debt) {
      throw new Error(`Debt ${original.name} not found`);
    }
    return {
      name: debt.name,
      originalBalance: new Decimal(original.balance).toFixed(2),
      totalPaid: debt.totalPaid.toFixed(2),
      totalInterest: debt.totalInterest.toFixed(2),
      monthsToPayoff: debt.monthsPaid,
    };
  });

  const totalInterestPaid = debts.reduce((sum, d) => sum.plus(d.totalInterest), new Decimal(0));
  const totalAmountPaid = debts.reduce((sum, d) => sum.plus(d.totalPaid), new Decimal(0));
  const avgMonthlyPayment = month > 0 ? totalAmountPaid.dividedBy(month) : new Decimal(0);

  const summary: PayoffStrategySummary = {
    strategy,
    totalMonthsToPayoff: month,
    totalInterestPaid: totalInterestPaid.toFixed(2),
    totalAmountPaid: totalAmountPaid.toFixed(2),
    monthlyPayment: avgMonthlyPayment.toFixed(2),
    debtSummaries,
  };

  return { schedule, summary };
}

/**
 * Calculate balance transfer scenario
 */
function calculateBalanceTransfer(input: DebtPayoffInput): BalanceTransferAnalysis {
  if (!input.balanceTransferOffer) {
    throw new Error('Balance transfer offer required');
  }

  const offer = input.balanceTransferOffer;
  const creditLimit = new Decimal(offer.creditLimit);
  const transferFeeRate = new Decimal(offer.transferFeeRate);

  // Sort debts by highest interest rate
  const sortedDebts = [...input.debts].sort((a, b) => b.interestRate - a.interestRate);

  // Determine how much to transfer (up to credit limit)
  let transferAmount = new Decimal(0);
  const debtsToTransfer: typeof input.debts = [];

  for (const debt of sortedDebts) {
    const debtBalance = new Decimal(debt.balance);
    if (transferAmount.plus(debtBalance).lessThanOrEqualTo(creditLimit)) {
      transferAmount = transferAmount.plus(debtBalance);
      debtsToTransfer.push(debt);
    } else {
      // Partial transfer of this debt
      const remaining = creditLimit.minus(transferAmount);
      if (remaining.greaterThan(0)) {
        transferAmount = creditLimit;
        debtsToTransfer.push({
          ...debt,
          balance: remaining.toNumber(),
        });
      }
      break;
    }
  }

  const transferFee = transferAmount.times(transferFeeRate);
  const totalTransferred = transferAmount.plus(transferFee);

  // Calculate interest on original debts
  const originalInterest = debtsToTransfer.reduce((sum, debt) => {
    return sum.plus(new Decimal(debt.balance).times(debt.interestRate).dividedBy(12).times(12)); // Rough annual
  }, new Decimal(0));

  // Calculate interest on balance transfer
  const introRate = new Decimal(offer.introRate);
  const regularRate = new Decimal(offer.regularRate);
  const introMonths = offer.introMonths;

  // Simple calculation: assume minimum payment during intro, rest after
  const monthlyPayment = new Decimal(input.extraMonthlyPayment).plus(
    input.debts.reduce((sum, d) => sum + d.minimumPayment, 0)
  );

  let btBalance = totalTransferred;
  let btInterest = new Decimal(0);
  let month = 0;

  while (btBalance.greaterThan(0) && month < 600) {
    month++;
    const rate = month <= introMonths ? introRate : regularRate;
    const monthlyRate = rate.dividedBy(12);
    const interest = btBalance.times(monthlyRate);
    btInterest = btInterest.plus(interest);

    const principal = monthlyPayment.minus(interest);
    btBalance = btBalance.minus(principal);
    if (btBalance.lessThan(0)) btBalance = new Decimal(0);
  }

  const totalInterestWithTransfer = btInterest;
  const totalSavings = originalInterest.minus(totalInterestWithTransfer);
  const netSavings = totalSavings.minus(transferFee);

  return {
    transferredAmount: transferAmount.toFixed(2),
    transferFee: transferFee.toFixed(2),
    totalSavings: totalSavings.toFixed(2),
    monthsToPayoff: month,
    totalInterestPaid: btInterest.toFixed(2),
    recommended: netSavings.greaterThan(0),
    savings: netSavings.toFixed(2),
  };
}

export const DebtPayoffEngine = {
  analyze,
};
