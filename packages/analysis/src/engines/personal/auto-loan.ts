import Decimal from 'decimal.js';
import type { AutoLoanInput } from '../../schemas/auto-loan.js';
import type {
  AutoLoanResult,
  AutoLoanPayment,
  AutoLoanCostBreakdown,
  AutoLoanSummary,
  AutoLoanEarlyPayoff,
} from '../../types/auto-loan-result.js';

/**
 * Auto Loan Analysis Engine
 *
 * Calculates comprehensive auto loan metrics including:
 * - Monthly payment schedules with principal/interest breakdown
 * - Total cost analysis including all fees and taxes
 * - Trade-in value consideration
 * - Early payoff scenarios
 * - Cost per mile estimates
 */
export function analyze(input: AutoLoanInput): AutoLoanResult {
  // Set precision for financial calculations
  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

  // Calculate cost breakdown
  const costBreakdown = calculateCostBreakdown(input);

  // Calculate monthly payment
  const monthlyPayment = calculateMonthlyPayment(
    new Decimal(costBreakdown.amountFinanced),
    new Decimal(input.interestRate),
    input.loanTermMonths
  );

  // Generate payment schedule
  const paymentSchedule = generatePaymentSchedule(
    new Decimal(costBreakdown.amountFinanced),
    monthlyPayment,
    new Decimal(input.interestRate),
    input.loanTermMonths
  );

  // Calculate summary metrics
  const summary = calculateSummary(monthlyPayment, paymentSchedule, costBreakdown, input);

  // Generate early payoff scenarios
  const earlyPayoffScenarios = generateEarlyPayoffScenarios(paymentSchedule, input.loanTermMonths);

  return {
    summary,
    costBreakdown,
    paymentSchedule,
    earlyPayoffScenarios,
    metadata: {
      vehiclePrice: input.vehiclePrice,
      interestRate: input.interestRate,
      loanTermMonths: input.loanTermMonths,
      calculatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Calculate detailed cost breakdown including all fees and trade-in
 */
function calculateCostBreakdown(input: AutoLoanInput): AutoLoanCostBreakdown {
  const vehiclePrice = new Decimal(input.vehiclePrice);
  const downPayment = new Decimal(input.downPayment);
  const tradeInValue = new Decimal(input.tradeInValue);
  const tradeInOwed = new Decimal(input.tradeInOwed);
  const manufacturerRebate = new Decimal(input.manufacturerRebate);

  // Calculate net trade-in equity
  const netTradeIn = tradeInValue.minus(tradeInOwed);

  // Calculate sales tax (on vehicle price minus trade-in)
  const taxableAmount = vehiclePrice.minus(tradeInValue);
  const salesTax = taxableAmount.times(input.salesTaxRate);

  // Additional costs
  const registrationFees = new Decimal(input.registrationFees);
  const dealerFees = new Decimal(input.dealerFees);
  const gapInsurance = input.includeGapInsurance
    ? new Decimal(input.gapInsuranceCost)
    : new Decimal(0);
  const extendedWarranty = input.includeExtendedWarranty
    ? new Decimal(input.extendedWarrantyCost)
    : new Decimal(0);

  // Calculate total upfront cost
  const totalUpfrontCost = downPayment;

  // Calculate amount to be financed
  const amountFinanced = vehiclePrice
    .plus(salesTax)
    .plus(registrationFees)
    .plus(dealerFees)
    .plus(gapInsurance)
    .plus(extendedWarranty)
    .minus(downPayment)
    .minus(netTradeIn)
    .minus(manufacturerRebate);

  return {
    vehiclePrice: vehiclePrice.toFixed(2),
    downPayment: downPayment.toFixed(2),
    tradeInValue: tradeInValue.toFixed(2),
    tradeInOwed: tradeInOwed.toFixed(2),
    netTradeIn: netTradeIn.toFixed(2),
    manufacturerRebate: manufacturerRebate.toFixed(2),
    salesTax: salesTax.toFixed(2),
    registrationFees: registrationFees.toFixed(2),
    dealerFees: dealerFees.toFixed(2),
    gapInsurance: gapInsurance.toFixed(2),
    extendedWarranty: extendedWarranty.toFixed(2),
    totalUpfrontCost: totalUpfrontCost.toFixed(2),
    amountFinanced: amountFinanced.toFixed(2),
  };
}

/**
 * Calculate monthly payment using standard loan formula
 */
function calculateMonthlyPayment(principal: Decimal, annualRate: Decimal, months: number): Decimal {
  if (annualRate.isZero()) {
    return principal.dividedBy(months);
  }

  const monthlyRate = annualRate.dividedBy(12);
  const numerator = principal.times(monthlyRate);
  const denominator = new Decimal(1).minus(new Decimal(1).plus(monthlyRate).pow(-months));

  return numerator.dividedBy(denominator);
}

/**
 * Generate complete amortization schedule
 */
function generatePaymentSchedule(
  principal: Decimal,
  monthlyPayment: Decimal,
  annualRate: Decimal,
  months: number
): AutoLoanPayment[] {
  const schedule: AutoLoanPayment[] = [];
  let balance = principal;
  let cumulativeInterest = new Decimal(0);
  let cumulativePrincipal = new Decimal(0);
  const monthlyRate = annualRate.dividedBy(12);

  for (let month = 1; month <= months; month++) {
    const interestPayment = balance.times(monthlyRate);
    const principalPayment = monthlyPayment.minus(interestPayment);

    balance = balance.minus(principalPayment);
    cumulativeInterest = cumulativeInterest.plus(interestPayment);
    cumulativePrincipal = cumulativePrincipal.plus(principalPayment);

    // Ensure balance doesn't go negative due to rounding
    if (balance.lessThan(0)) {
      balance = new Decimal(0);
    }

    schedule.push({
      month,
      payment: monthlyPayment.toFixed(2),
      principal: principalPayment.toFixed(2),
      interest: interestPayment.toFixed(2),
      balance: balance.toFixed(2),
      cumulativeInterest: cumulativeInterest.toFixed(2),
      cumulativePrincipal: cumulativePrincipal.toFixed(2),
    });
  }

  return schedule;
}

/**
 * Calculate summary metrics
 */
function calculateSummary(
  monthlyPayment: Decimal,
  schedule: AutoLoanPayment[],
  costBreakdown: AutoLoanCostBreakdown,
  input: AutoLoanInput
): AutoLoanSummary {
  const totalPayments = monthlyPayment.times(input.loanTermMonths);
  const lastPayment = schedule[schedule.length - 1];
  if (!lastPayment) {
    throw new Error('Payment schedule is empty');
  }
  const totalInterest = new Decimal(lastPayment.cumulativeInterest);

  // Total cost includes upfront costs and all loan payments
  const totalCost = new Decimal(costBreakdown.totalUpfrontCost)
    .plus(totalPayments)
    .plus(costBreakdown.netTradeIn);

  // Calculate effective APR (includes all fees)
  const amountFinanced = new Decimal(costBreakdown.amountFinanced);
  const effectiveRate = calculateEffectiveAPR(amountFinanced, monthlyPayment, input.loanTermMonths);

  // Estimate cost per mile (assuming 12,000 miles/year)
  const yearsOwned = new Decimal(input.loanTermMonths).dividedBy(12);
  const estimatedMiles = yearsOwned.times(12000);
  const costPerMile = totalCost.dividedBy(estimatedMiles);

  // Loan to value ratio
  const vehiclePrice = new Decimal(input.vehiclePrice);
  const loanToValue = amountFinanced.dividedBy(vehiclePrice).times(100);

  return {
    monthlyPayment: monthlyPayment.toFixed(2),
    totalPayments: totalPayments.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    totalCost: totalCost.toFixed(2),
    aprEffective: effectiveRate.toFixed(4),
    costPerMile: costPerMile.toFixed(2),
    loanToValue: loanToValue.toFixed(2),
  };
}

/**
 * Calculate effective APR including all fees
 */
function calculateEffectiveAPR(
  amountFinanced: Decimal,
  monthlyPayment: Decimal,
  months: number
): Decimal {
  // Simple approximation - could be refined with Newton's method
  const totalPaid = monthlyPayment.times(months);
  const totalInterest = totalPaid.minus(amountFinanced);
  const avgBalance = amountFinanced.dividedBy(2);
  const years = new Decimal(months).dividedBy(12);

  return totalInterest.dividedBy(avgBalance).dividedBy(years);
}

/**
 * Generate early payoff scenarios at key milestones
 */
function generateEarlyPayoffScenarios(
  schedule: AutoLoanPayment[],
  totalMonths: number
): AutoLoanEarlyPayoff[] {
  const scenarios: AutoLoanEarlyPayoff[] = [];
  const milestones = [12, 24, 36, 48, 60]; // 1, 2, 3, 4, 5 years

  for (const months of milestones) {
    if (months >= totalMonths) continue;

    const payment = schedule[months - 1];
    if (!payment) continue;

    const remainingBalance = new Decimal(payment.balance);
    const paidInterest = new Decimal(payment.cumulativeInterest);

    // Calculate remaining interest if loan continued
    const lastPayment = schedule[schedule.length - 1];
    if (!lastPayment) continue;

    const totalInterest = new Decimal(lastPayment.cumulativeInterest);
    const interestSaved = totalInterest.minus(paidInterest);

    // Total paid so far
    const totalPaid = new Decimal(payment.cumulativePrincipal).plus(paidInterest);

    scenarios.push({
      monthsPaid: months,
      remainingBalance: remainingBalance.toFixed(2),
      interestSaved: interestSaved.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
    });
  }

  return scenarios;
}
