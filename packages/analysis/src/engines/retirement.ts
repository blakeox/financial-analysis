import Decimal from 'decimal.js';
import type { RetirementInput } from '../schemas/retirement.js';
import type {
  RetirementResult,
  RetirementYear,
  AccountYearBalance,
  EmployerMatchAnalysis,
  TaxAdvantageAnalysis,
  WithdrawalAnalysis,
  RetirementSummary,
} from '../types/retirement-result.js';

const MAX_YEARS = 50; // Maximum projection years

/**
 * Analyzes retirement savings projections with employer match and tax advantages.
 */
export function analyze(input: RetirementInput): RetirementResult {
  const yearsToRetirement = input.retirementAge - input.currentAge;

  if (yearsToRetirement <= 0) {
    throw new Error('Retirement age must be greater than current age');
  }

  // Build year-by-year projection
  const projectionSchedule = buildProjectionSchedule(input, yearsToRetirement);

  // Analyze employer match optimization
  const employerMatchAnalysis = analyzeEmployerMatch(input);

  // Analyze tax advantages
  const taxAdvantageAnalysis = analyzeTaxAdvantages(input);

  // Analyze withdrawal strategy
  const withdrawalAnalysis = analyzeWithdrawalStrategy(input, projectionSchedule);

  // Build summary
  const summary = buildSummary(input, projectionSchedule, withdrawalAnalysis);

  // Generate recommendations
  const recommendations = generateRecommendations(
    input,
    summary,
    employerMatchAnalysis,
    taxAdvantageAnalysis,
    withdrawalAnalysis
  );

  const totalCurrentBalance = input.accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalAnnualContribution = input.accounts.reduce(
    (sum, acc) => sum + acc.annualContribution,
    0
  );

  return {
    input: {
      currentAge: input.currentAge,
      retirementAge: input.retirementAge,
      currentIncome: new Decimal(input.currentIncome).toFixed(2),
      totalAccounts: input.accounts.length,
      totalCurrentBalance: new Decimal(totalCurrentBalance).toFixed(2),
      totalAnnualContribution: new Decimal(totalAnnualContribution).toFixed(2),
      expectedAnnualReturn: new Decimal(input.expectedAnnualReturn).times(100).toFixed(2),
    },
    projectionSchedule,
    summary,
    employerMatchAnalysis,
    taxAdvantageAnalysis,
    withdrawalAnalysis,
    recommendations,
    metadata: {
      calculatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

function buildProjectionSchedule(
  input: RetirementInput,
  yearsToRetirement: number
): RetirementYear[] {
  const schedule: RetirementYear[] = [];
  const inflationRate = new Decimal(input.inflationRate);
  const returnRate = new Decimal(input.expectedAnnualReturn);
  const incomeIncreaseRate = new Decimal(input.incomeIncreaseRate);

  // Initialize account balances
  const accountBalances = input.accounts.map((acc) => ({
    accountType: acc.accountType,
    balance: new Decimal(acc.currentBalance),
    contribution: new Decimal(acc.annualContribution),
    employerMatch: new Decimal(acc.employerMatch ?? 0),
    employerMatchLimit: new Decimal(acc.employerMatchLimit ?? 0.06),
  }));

  let currentIncome = new Decimal(input.currentIncome);

  for (let year = 1; year <= Math.min(yearsToRetirement, MAX_YEARS); year++) {
    const age = input.currentAge + year;
    const accountYearBalances: AccountYearBalance[] = [];

    let totalContribution = new Decimal(0);
    let totalEmployerMatch = new Decimal(0);
    let totalGrowth = new Decimal(0);
    let totalBalance = new Decimal(0);

    // Update income for the year
    if (year > 1) {
      currentIncome = currentIncome.times(new Decimal(1).plus(incomeIncreaseRate));
    }

    for (const account of accountBalances) {
      // Calculate employer match (for 401k accounts)
      let employerMatchAmount = new Decimal(0);
      if (account.accountType === '401k' || account.accountType === 'roth_401k') {
        const contributionPercent = account.contribution.div(currentIncome);
        const matchPercent = Decimal.min(contributionPercent, account.employerMatchLimit);
        employerMatchAmount = currentIncome.times(matchPercent).times(account.employerMatch);
      }

      // Add contributions
      account.balance = account.balance.plus(account.contribution).plus(employerMatchAmount);
      totalContribution = totalContribution.plus(account.contribution);
      totalEmployerMatch = totalEmployerMatch.plus(employerMatchAmount);

      // Apply growth
      const growth = account.balance.times(returnRate);
      account.balance = account.balance.plus(growth);
      totalGrowth = totalGrowth.plus(growth);
      totalBalance = totalBalance.plus(account.balance);

      accountYearBalances.push({
        accountType: account.accountType,
        contribution: account.contribution.toFixed(2),
        employerMatch: employerMatchAmount.toFixed(2),
        growthThisYear: growth.toFixed(2),
        balance: account.balance.toFixed(2),
      });
    }

    // Calculate real value (inflation-adjusted)
    const inflationFactor = new Decimal(1).plus(inflationRate).pow(year);
    const realValue = totalBalance.div(inflationFactor);

    schedule.push({
      year,
      age,
      totalContribution: totalContribution.toFixed(2),
      totalEmployerMatch: totalEmployerMatch.toFixed(2),
      totalGrowth: totalGrowth.toFixed(2),
      totalBalance: totalBalance.toFixed(2),
      realValue: realValue.toFixed(2),
      accounts: accountYearBalances,
    });
  }

  return schedule;
}

function analyzeEmployerMatch(input: RetirementInput): EmployerMatchAnalysis {
  let currentMatchAmount = new Decimal(0);
  let maxPossibleMatch = new Decimal(0);
  let contributionNeededForFullMatch = new Decimal(0);

  const currentIncome = new Decimal(input.currentIncome);

  for (const account of input.accounts) {
    if (account.accountType === '401k' || account.accountType === 'roth_401k') {
      const employerMatch = new Decimal(account.employerMatch ?? 0);
      const employerMatchLimit = new Decimal(account.employerMatchLimit ?? 0.06);
      const contribution = new Decimal(account.annualContribution);

      const contributionPercent = contribution.div(currentIncome);
      const matchPercent = Decimal.min(contributionPercent, employerMatchLimit);
      const accountMatchAmount = currentIncome.times(matchPercent).times(employerMatch);

      currentMatchAmount = currentMatchAmount.plus(accountMatchAmount);

      const maxMatchAmount = currentIncome.times(employerMatchLimit).times(employerMatch);
      maxPossibleMatch = maxPossibleMatch.plus(maxMatchAmount);

      const neededContribution = currentIncome.times(employerMatchLimit);
      if (contribution.lt(neededContribution)) {
        contributionNeededForFullMatch = contributionNeededForFullMatch.plus(
          neededContribution.minus(contribution)
        );
      }
    }
  }

  const unmatchedAmount = maxPossibleMatch.minus(currentMatchAmount);
  const isOptimized = unmatchedAmount.eq(0);

  const recommendations: string[] = [];
  if (!isOptimized) {
    recommendations.push(
      `You're leaving $${unmatchedAmount.toFixed(0)}/year in employer match on the table`
    );
    recommendations.push(
      `Increase contributions by $${contributionNeededForFullMatch.toFixed(0)}/year to maximize employer match`
    );
  } else {
    recommendations.push("You're maximizing your employer match! Great job!");
  }

  return {
    currentMatchAmount: currentMatchAmount.toFixed(2),
    maxPossibleMatch: maxPossibleMatch.toFixed(2),
    unmatchedAmount: unmatchedAmount.toFixed(2),
    contributionNeededForFullMatch: contributionNeededForFullMatch.toFixed(2),
    isOptimized,
    recommendations,
  };
}

function analyzeTaxAdvantages(input: RetirementInput): TaxAdvantageAnalysis {
  let totalPreTax = new Decimal(0);
  let totalRoth = new Decimal(0);

  for (const account of input.accounts) {
    const contribution = new Decimal(account.annualContribution);
    if (
      account.accountType === '401k' ||
      account.accountType === 'traditional_ira' ||
      account.accountType === 'sep_ira'
    ) {
      totalPreTax = totalPreTax.plus(contribution);
    } else if (account.accountType === 'roth_401k' || account.accountType === 'roth_ira') {
      totalRoth = totalRoth.plus(contribution);
    }
  }

  // Assume 22% tax bracket for estimation
  const assumedTaxRate = new Decimal(0.22);
  const estimatedTaxSavings = totalPreTax.times(assumedTaxRate);

  const totalContributions = totalPreTax.plus(totalRoth);
  const preTaxPercent = totalContributions.gt(0)
    ? totalPreTax.div(totalContributions).times(100)
    : new Decimal(0);

  const recommendations: string[] = [];

  if (totalPreTax.eq(0)) {
    recommendations.push(
      'Consider traditional IRA/401(k) contributions for immediate tax deductions'
    );
  } else if (totalRoth.eq(0)) {
    recommendations.push(
      'Consider Roth IRA/401(k) for tax-free growth and withdrawals in retirement'
    );
  }

  if (preTaxPercent.gt(80) || preTaxPercent.lt(20)) {
    recommendations.push(
      'Consider diversifying between pre-tax and Roth accounts for tax flexibility in retirement'
    );
  }

  return {
    totalPreTaxContributions: totalPreTax.toFixed(2),
    totalRothContributions: totalRoth.toFixed(2),
    estimatedTaxSavings: estimatedTaxSavings.toFixed(2),
    taxDiversificationScore: preTaxPercent.toFixed(1),
    recommendations,
  };
}

function analyzeWithdrawalStrategy(
  input: RetirementInput,
  projectionSchedule: RetirementYear[]
): WithdrawalAnalysis {
  const finalYear = projectionSchedule[projectionSchedule.length - 1];
  if (!finalYear) {
    throw new Error('No projection data available');
  }

  const portfolioBalance = new Decimal(finalYear.totalBalance);
  const strategy = input.withdrawalStrategy;

  let firstYearWithdrawal = new Decimal(0);
  let monthlyIncome = new Decimal(0);
  let portfolioLastsUntilAge = 100;
  let probabilityOfSuccess = '75';

  if (strategy === '4_percent_rule') {
    firstYearWithdrawal = portfolioBalance.times(0.04);
    monthlyIncome = firstYearWithdrawal.div(12);
    portfolioLastsUntilAge = input.retirementAge + 30; // Typically lasts 30+ years
    probabilityOfSuccess = '95'; // Historical success rate
  } else if (strategy === 'fixed_amount') {
    const desiredIncome = input.desiredRetirementIncome
      ? new Decimal(input.desiredRetirementIncome)
      : portfolioBalance.times(0.04);
    firstYearWithdrawal = desiredIncome;
    monthlyIncome = desiredIncome.div(12);

    // Calculate how long portfolio lasts
    const yearsLasts = portfolioBalance.div(desiredIncome);
    portfolioLastsUntilAge = input.retirementAge + Math.floor(yearsLasts.toNumber());
    probabilityOfSuccess = yearsLasts.gte(30) ? '90' : '60';
  } else {
    // required_minimum (RMD starts at age 73)
    const rmdAge = 73;
    const yearsUntilRMD = rmdAge - input.retirementAge;

    if (yearsUntilRMD > 0) {
      firstYearWithdrawal = portfolioBalance.times(0.04); // Use 4% until RMD
    } else {
      // Simplified RMD calculation (actual uses IRS tables)
      const distributionPeriod = new Decimal(100 - input.retirementAge);
      firstYearWithdrawal = portfolioBalance.div(distributionPeriod);
    }

    monthlyIncome = firstYearWithdrawal.div(12);
    portfolioLastsUntilAge = 100;
    probabilityOfSuccess = '85';
  }

  const recommendations: string[] = [];

  const replacementRatio = firstYearWithdrawal.div(input.currentIncome).times(100);
  if (replacementRatio.lt(70)) {
    recommendations.push(
      `Projected retirement income is ${replacementRatio.toFixed(0)}% of pre-retirement income. Target 70-90% for comfortable retirement.`
    );
  }

  if (strategy === '4_percent_rule') {
    recommendations.push('The 4% rule has a 95% historical success rate for 30-year retirements');
  }

  recommendations.push('Adjust withdrawals for inflation each year to maintain purchasing power');

  recommendations.push(
    'Consider tax-efficient withdrawal sequencing: taxable accounts first, then tax-deferred, then Roth'
  );

  return {
    strategy,
    firstYearWithdrawal: firstYearWithdrawal.toFixed(2),
    projectedMonthlyIncome: monthlyIncome.toFixed(2),
    portfolioLastsUntilAge,
    probabilityOfSuccess,
    recommendations,
  };
}

function buildSummary(
  input: RetirementInput,
  projectionSchedule: RetirementYear[],
  withdrawalAnalysis: WithdrawalAnalysis
): RetirementSummary {
  const currentTotalBalance = input.accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  const finalYear = projectionSchedule[projectionSchedule.length - 1];
  if (!finalYear) {
    throw new Error('No projection data available');
  }

  const projectedBalance = new Decimal(finalYear.totalBalance);
  const realValue = new Decimal(finalYear.realValue);

  const totalContributions = projectionSchedule.reduce(
    (sum, year) => sum.plus(new Decimal(year.totalContribution)),
    new Decimal(currentTotalBalance)
  );

  const totalEmployerMatch = projectionSchedule.reduce(
    (sum, year) => sum.plus(new Decimal(year.totalEmployerMatch)),
    new Decimal(0)
  );

  const totalGrowth = projectedBalance.minus(totalContributions).minus(totalEmployerMatch);

  const firstYearWithdrawal = new Decimal(withdrawalAnalysis.firstYearWithdrawal);
  const replacementRatio = firstYearWithdrawal.div(input.currentIncome).times(100);

  const targetReplacementRatio = 80; // 80% is common target
  const targetIncome = new Decimal(input.currentIncome).times(targetReplacementRatio / 100);
  const onTrack = firstYearWithdrawal.gte(targetIncome);
  const shortfall = onTrack ? undefined : targetIncome.minus(firstYearWithdrawal);

  return {
    currentTotalBalance: new Decimal(currentTotalBalance).toFixed(2),
    projectedBalanceAtRetirement: projectedBalance.toFixed(2),
    realValueAtRetirement: realValue.toFixed(2),
    totalContributions: totalContributions.toFixed(2),
    totalEmployerMatch: totalEmployerMatch.toFixed(2),
    totalGrowth: totalGrowth.toFixed(2),
    yearsToRetirement: input.retirementAge - input.currentAge,
    replacementRatio: replacementRatio.toFixed(1),
    onTrack,
    shortfall: shortfall ? shortfall.toFixed(2) : undefined,
  };
}

function generateRecommendations(
  input: RetirementInput,
  summary: RetirementSummary,
  employerMatchAnalysis: EmployerMatchAnalysis,
  taxAdvantageAnalysis: TaxAdvantageAnalysis,
  withdrawalAnalysis: WithdrawalAnalysis
): string[] {
  const recommendations: string[] = [];

  // Track status
  if (!summary.onTrack && summary.shortfall) {
    recommendations.push(
      `You're projected to have a shortfall of $${new Decimal(summary.shortfall).toFixed(0)}/year in retirement income`
    );

    const additionalNeeded = new Decimal(summary.shortfall).div(0.04); // Rough estimate
    const additionalContribution = additionalNeeded.div(input.retirementAge - input.currentAge);

    recommendations.push(
      `Consider increasing annual contributions by $${additionalContribution.toFixed(0)} to close the gap`
    );
  } else {
    recommendations.push("You're on track for retirement! Keep up the great work.");
  }

  // Employer match
  employerMatchAnalysis.recommendations.forEach((rec) => recommendations.push(rec));

  // Tax advantages
  taxAdvantageAnalysis.recommendations.forEach((rec) => recommendations.push(rec));

  // Withdrawal strategy
  withdrawalAnalysis.recommendations.forEach((rec) => recommendations.push(rec));

  // Age-specific recommendations
  const yearsToRetirement = input.retirementAge - input.currentAge;
  if (yearsToRetirement > 20) {
    recommendations.push(
      'With 20+ years until retirement, prioritize growth investments (stocks, equity funds)'
    );
  } else if (yearsToRetirement <= 10) {
    recommendations.push(
      'With 10 or fewer years until retirement, gradually shift toward more conservative investments'
    );
  }

  // Contribution limits
  const limit401k = 23000; // 2024 limit
  const catchUpAge = 50;

  if (input.currentAge >= catchUpAge) {
    recommendations.push(
      `You're eligible for catch-up contributions! 401(k) limit is $${limit401k + 7500}/year, IRA limit is $8,000/year`
    );
  }

  return recommendations;
}
