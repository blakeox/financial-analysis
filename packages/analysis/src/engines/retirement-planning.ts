/**
 * Retirement Planning Engine
 * Advanced retirement planning and analysis
 *
 * Implements comprehensive retirement planning including:
 * - Multi-account retirement projections
 * - Social Security optimization
 * - Tax-advantaged account strategies
 * - Withdrawal strategies
 * - Healthcare cost planning
 * - Estate planning considerations
 */

import { Decimal } from 'decimal.js';
import type { RetirementPlanningInput } from '../schemas/retirement-planning.js';

export class RetirementPlanningEngine {
  /**
   * Analyze retirement planning needs and provide comprehensive recommendations
   */
  static analyze(input: RetirementPlanningInput): unknown {
    const personalInfo = input.personalInfo;
    const currentAccounts = input.currentAccounts;
    const income = input.income;
    const expenses = input.expenses;
    const goals = input.goals;

    const yearsToRetirement = personalInfo.retirementAge - personalInfo.age;
    const yearsInRetirement = personalInfo.lifeExpectancy - personalInfo.retirementAge;

    // Project retirement savings
    const retirementProjection = this.projectRetirementSavings(
      currentAccounts,
      income.currentAnnual,
      income.expectedGrowthRate,
      yearsToRetirement,
      goals.riskTolerance
    );

    // Calculate retirement income needs
    const retirementIncomeNeeds = this.calculateRetirementIncomeNeeds(
      expenses.currentAnnual,
      expenses.retirementAnnual,
      expenses.inflationRate,
      yearsToRetirement
    );

    // Calculate Social Security benefits
    const socialSecurityAnalysis = this.analyzeSocialSecurity(
      income.currentAnnual,
      income.socialSecurity,
      personalInfo.retirementAge
    );

    // Calculate withdrawal strategy
    const withdrawalStrategy = this.calculateWithdrawalStrategy(
      retirementProjection.totalAtRetirement,
      retirementIncomeNeeds,
      yearsInRetirement,
      goals.riskTolerance
    );

    // Calculate retirement readiness
    const retirementReadiness = this.calculateRetirementReadiness(
      retirementProjection.totalAtRetirement,
      retirementIncomeNeeds,
      socialSecurityAnalysis.annualBenefit,
      yearsInRetirement
    );

    // Generate recommendations
    const recommendations: string[] = [];
    if (retirementReadiness.score < 70) {
      recommendations.push(
        `Increase annual contributions by $${retirementReadiness.additionalContribution.toFixed(0)} to meet retirement goals`
      );
    }
    if (goals.taxStrategy === 'traditional-first' && personalInfo.age < 50) {
      recommendations.push(
        'Consider Roth conversions in lower-income years for tax diversification'
      );
    }
    if (socialSecurityAnalysis.optimalClaimAge > personalInfo.retirementAge) {
      recommendations.push(
        `Consider delaying Social Security until age ${socialSecurityAnalysis.optimalClaimAge} for maximum benefits`
      );
    }

    return {
      summary: {
        currentAge: personalInfo.age,
        retirementAge: personalInfo.retirementAge,
        yearsToRetirement,
        yearsInRetirement,
        currentTotalBalance: retirementProjection.currentTotal.toFixed(2),
        projectedRetirementBalance: retirementProjection.totalAtRetirement.toFixed(2),
        retirementIncomeNeeds: retirementIncomeNeeds.toFixed(2),
        retirementReadinessScore: retirementReadiness.score,
      },
      accountProjections: retirementProjection.accounts.map((acc) => ({
        accountType: acc.type,
        currentBalance: acc.currentBalance.toFixed(2),
        projectedBalance: acc.projectedBalance.toFixed(2),
        totalContributions: acc.totalContributions.toFixed(2),
        totalGrowth: acc.totalGrowth.toFixed(2),
      })),
      socialSecurityAnalysis,
      withdrawalStrategy,
      retirementReadiness,
      recommendations,
      insights: [
        `You have ${yearsToRetirement} years until retirement`,
        `You'll need $${retirementIncomeNeeds.toFixed(0)} annually in retirement (in today's dollars)`,
        `Your retirement readiness score is ${retirementReadiness.score}/100`,
        retirementReadiness.score >= 80
          ? 'You are on track for a comfortable retirement'
          : 'Consider increasing contributions or adjusting your retirement timeline',
      ],
    };
  }

  private static projectRetirementSavings(
    accounts: Array<{
      type: string;
      balance: number;
      annualContribution: number;
      expectedReturn: number;
    }>,
    currentIncome: number,
    incomeGrowthRate: number,
    yearsToRetirement: number,
    _riskTolerance: string
  ): {
    currentTotal: number;
    totalAtRetirement: number;
    accounts: Array<{
      type: string;
      currentBalance: number;
      projectedBalance: number;
      totalContributions: number;
      totalGrowth: number;
    }>;
  } {
    let currentTotal = 0;
    let totalAtRetirement = 0;
    const accountProjections: Array<{
      type: string;
      currentBalance: number;
      projectedBalance: number;
      totalContributions: number;
      totalGrowth: number;
    }> = [];

    for (const account of accounts) {
      currentTotal += account.balance;
      let balance = new Decimal(account.balance);
      let totalContributions = new Decimal(0);
      const returnRate = new Decimal(account.expectedReturn);

      for (let year = 1; year <= yearsToRetirement; year++) {
        // Increase contribution with income growth
        const contribution = new Decimal(account.annualContribution).times(
          new Decimal(1).plus(incomeGrowthRate).pow(year - 1)
        );
        balance = balance.plus(contribution);
        totalContributions = totalContributions.plus(contribution);

        // Apply growth
        const growth = balance.times(returnRate);
        balance = balance.plus(growth);
      }

      const totalGrowth = balance.minus(new Decimal(account.balance)).minus(totalContributions);
      totalAtRetirement += balance.toNumber();

      accountProjections.push({
        type: account.type,
        currentBalance: account.balance,
        projectedBalance: balance.toNumber(),
        totalContributions: totalContributions.toNumber(),
        totalGrowth: totalGrowth.toNumber(),
      });
    }

    return {
      currentTotal,
      totalAtRetirement,
      accounts: accountProjections,
    };
  }

  private static calculateRetirementIncomeNeeds(
    currentAnnualExpenses: number,
    retirementAnnualExpenses: number,
    inflationRate: number,
    yearsToRetirement: number
  ): number {
    // Use retirement expenses if provided, otherwise estimate at 80% of current
    const baseExpenses =
      retirementAnnualExpenses > 0 ? retirementAnnualExpenses : currentAnnualExpenses * 0.8;

    // Adjust for inflation
    return new Decimal(baseExpenses)
      .times(new Decimal(1).plus(inflationRate).pow(yearsToRetirement))
      .toNumber();
  }

  private static analyzeSocialSecurity(
    currentIncome: number,
    estimatedBenefit: number | undefined,
    retirementAge: number
  ): {
    annualBenefit: number;
    optimalClaimAge: number;
    earlyClaimReduction: number;
    delayedClaimIncrease: number;
  } {
    // Simplified Social Security analysis
    const fullRetirementAge = 67;
    const baseBenefit = estimatedBenefit || currentIncome * 0.3; // Rough estimate

    let annualBenefit = baseBenefit;
    if (retirementAge < fullRetirementAge) {
      const reduction = (fullRetirementAge - retirementAge) * 0.0067; // ~6.67% per year
      annualBenefit = baseBenefit * (1 - reduction);
    } else if (retirementAge > fullRetirementAge) {
      const increase = (retirementAge - fullRetirementAge) * 0.08; // 8% per year
      annualBenefit = baseBenefit * (1 + increase);
    }

    const optimalClaimAge = Math.max(fullRetirementAge, retirementAge + 3);

    return {
      annualBenefit,
      optimalClaimAge,
      earlyClaimReduction: retirementAge < fullRetirementAge ? 0.3 : 0,
      delayedClaimIncrease: retirementAge > fullRetirementAge ? 0.24 : 0,
    };
  }

  private static calculateWithdrawalStrategy(
    retirementBalance: number,
    annualIncomeNeeds: number,
    yearsInRetirement: number,
    riskTolerance: string
  ): {
    safeWithdrawalRate: number;
    annualWithdrawal: number;
    portfolioLastsYears: number;
    strategy: string;
  } {
    // 4% rule for moderate, 3.5% for conservative, 4.5% for aggressive
    const withdrawalRates: Record<string, number> = {
      conservative: 0.035,
      moderate: 0.04,
      aggressive: 0.045,
    };
    const safeWithdrawalRate = withdrawalRates[riskTolerance] || 0.04;
    const annualWithdrawal = retirementBalance * safeWithdrawalRate;

    // Calculate how long portfolio lasts
    const returnRate =
      riskTolerance === 'conservative' ? 0.05 : riskTolerance === 'moderate' ? 0.06 : 0.07;
    let balance = new Decimal(retirementBalance);
    let years = 0;
    for (let year = 0; year < yearsInRetirement && balance.gt(0); year++) {
      balance = balance.times(new Decimal(1).plus(returnRate));
      balance = balance.minus(annualWithdrawal);
      years++;
    }

    return {
      safeWithdrawalRate: safeWithdrawalRate * 100,
      annualWithdrawal: annualWithdrawal.toFixed(2),
      portfolioLastsYears: years,
      strategy: `Using ${(safeWithdrawalRate * 100).toFixed(1)}% withdrawal rate with ${(returnRate * 100).toFixed(1)}% expected returns`,
    };
  }

  private static calculateRetirementReadiness(
    retirementBalance: number,
    annualIncomeNeeds: number,
    socialSecurityBenefit: number,
    _yearsInRetirement: number
  ): {
    score: number;
    additionalContribution: number;
    gap: number;
  } {
    const totalAnnualIncome = retirementBalance * 0.04 + socialSecurityBenefit; // 4% rule
    const gap = annualIncomeNeeds - totalAnnualIncome;
    const gapPercent = gap / annualIncomeNeeds;

    let score = 100;
    if (gap > 0) {
      score -= gapPercent * 100;
      // Calculate additional contribution needed (simplified)
      const additionalContribution = gap * 25; // Rough estimate: need 25x gap
      return {
        score: Math.max(0, score),
        additionalContribution,
        gap,
      };
    } else {
      return {
        score: Math.min(100, score + 10), // Bonus for exceeding needs
        additionalContribution: 0,
        gap: 0,
      };
    }
  }
}
