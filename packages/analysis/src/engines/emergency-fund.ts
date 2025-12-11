/**
 * Emergency Fund Calculator
 * Calculate target amount, build timeline, and withdrawal scenarios
 */

import type { EmergencyFundInput } from '../schemas/emergency-fund.js';

export class EmergencyFundCalculator {
  /**
   * Analyze emergency fund needs
   */
  static analyze(input: EmergencyFundInput): unknown {
    const currentSituation = input.currentSituation;
    const goals = input.goals;
    const assumptions = input.assumptions;
    const analysis = input.analysis;

    // Calculate target emergency fund
    const targetFund = this.calculateTargetFund(currentSituation, goals);

    // Calculate build timeline
    const buildTimeline = analysis.includeTimeline
      ? this.calculateBuildTimeline(currentSituation, targetFund, assumptions)
      : undefined;

    // Withdrawal scenarios
    const withdrawalScenarios = this.analyzeWithdrawals(
      currentSituation,
      targetFund,
      currentSituation.currentEmergencyFund
    );

    // Scenarios
    const scenarios = analysis.includeScenarios
      ? this.analyzeScenarios(currentSituation, goals, assumptions)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      targetFund,
      buildTimeline,
      currentSituation,
      goals
    );

    return {
      summary: {
        targetFund: targetFund.targetAmount,
        currentFund: currentSituation.currentEmergencyFund,
        shortfall: targetFund.targetAmount - currentSituation.currentEmergencyFund,
        monthsToBuild: buildTimeline?.monthsToBuild,
        onTrack: currentSituation.currentEmergencyFund >= targetFund.targetAmount,
      },
      targetFund,
      buildTimeline,
      withdrawalScenarios,
      scenarios,
      recommendations,
    };
  }

  private static calculateTargetFund(
    currentSituation: EmergencyFundInput['currentSituation'],
    goals: EmergencyFundInput['goals']
  ): {
    targetAmount: number;
    monthlyExpenses: number;
    targetMonths: number;
    interpretation: string;
  } {
    // Adjust for dependents and employment status
    let expenseMultiplier = 1;
    if (currentSituation.dependents > 0) {
      expenseMultiplier += currentSituation.dependents * 0.2; // 20% per dependent
    }

    if (currentSituation.employmentStatus === 'self-employed') {
      expenseMultiplier += 0.5; // Self-employed need more buffer
    } else if (currentSituation.employmentStatus === 'unemployed') {
      expenseMultiplier += 1.0; // Unemployed need maximum buffer
    }

    const adjustedMonthlyExpenses = currentSituation.monthlyExpenses * expenseMultiplier;
    const targetAmount = adjustedMonthlyExpenses * goals.targetMonths;

    let interpretation = '';
    if (goals.targetMonths >= 6) {
      interpretation = 'Adequate emergency fund target';
    } else if (goals.targetMonths >= 3) {
      interpretation = 'Minimum recommended emergency fund';
    } else {
      interpretation = 'Below recommended minimum - consider increasing target';
    }

    return {
      targetAmount,
      monthlyExpenses: adjustedMonthlyExpenses,
      targetMonths: goals.targetMonths,
      interpretation,
    };
  }

  private static calculateBuildTimeline(
    currentSituation: EmergencyFundInput['currentSituation'],
    targetFund: { targetAmount: number },
    assumptions: EmergencyFundInput['assumptions']
  ): {
    monthsToBuild: number;
    monthlySavingsNeeded: number;
    timeline: Array<{ month: number; balance: number; progress: number }>;
  } {
    const shortfall = targetFund.targetAmount - currentSituation.currentEmergencyFund;
    const monthlySavings = assumptions.monthlySavings;
    const monthlyReturn = assumptions.expectedReturn / 12;

    let balance = currentSituation.currentEmergencyFund;
    const timeline: Array<{ month: number; balance: number; progress: number }> = [];
    let monthsToBuild = 0;

    while (balance < targetFund.targetAmount && monthsToBuild < 120) {
      balance = balance * (1 + monthlyReturn) + monthlySavings;
      monthsToBuild++;
      const progress = targetFund.targetAmount > 0 ? (balance / targetFund.targetAmount) * 100 : 0;
      timeline.push({
        month: monthsToBuild,
        balance,
        progress: Math.min(100, progress),
      });
    }

    const monthlySavingsNeeded =
      shortfall > 0 && monthsToBuild > 0 ? shortfall / monthsToBuild : monthlySavings;

    return {
      monthsToBuild: monthsToBuild || 999,
      monthlySavingsNeeded,
      timeline,
    };
  }

  private static analyzeWithdrawals(
    currentSituation: EmergencyFundInput['currentSituation'],
    targetFund: { targetAmount: number; monthlyExpenses: number },
    currentFund: number
  ): {
    scenarios: Array<{
      scenario: string;
      monthlyWithdrawal: number;
      monthsCovered: number;
      remainingFund: number;
    }>;
  } {
    const scenarios = [
      { name: 'Job Loss', monthlyWithdrawal: targetFund.monthlyExpenses },
      { name: 'Medical Emergency', monthlyWithdrawal: targetFund.monthlyExpenses * 1.5 },
      { name: 'Major Home Repair', monthlyWithdrawal: targetFund.monthlyExpenses * 0.5 },
    ];

    return {
      scenarios: scenarios.map((s) => {
        const monthsCovered = currentFund / s.monthlyWithdrawal;
        const remainingFund = currentFund - s.monthlyWithdrawal * Math.min(6, monthsCovered);

        return {
          scenario: s.name,
          monthlyWithdrawal: s.monthlyWithdrawal,
          monthsCovered,
          remainingFund: Math.max(0, remainingFund),
        };
      }),
    };
  }

  private static analyzeScenarios(
    currentSituation: EmergencyFundInput['currentSituation'],
    goals: EmergencyFundInput['goals'],
    _assumptions: EmergencyFundInput['assumptions']
  ): {
    conservative: { targetMonths: number; targetAmount: number };
    moderate: { targetMonths: number; targetAmount: number };
    aggressive: { targetMonths: number; targetAmount: number };
  } {
    const targetFundConservative = this.calculateTargetFund(currentSituation, {
      ...goals,
      targetMonths: 9,
    });
    const targetFundModerate = this.calculateTargetFund(currentSituation, {
      ...goals,
      targetMonths: 6,
    });
    const targetFundAggressive = this.calculateTargetFund(currentSituation, {
      ...goals,
      targetMonths: 3,
    });

    return {
      conservative: {
        targetMonths: 9,
        targetAmount: targetFundConservative.targetAmount,
      },
      moderate: {
        targetMonths: 6,
        targetAmount: targetFundModerate.targetAmount,
      },
      aggressive: {
        targetMonths: 3,
        targetAmount: targetFundAggressive.targetAmount,
      },
    };
  }

  private static generateRecommendations(
    targetFund: { targetAmount: number; interpretation: string },
    buildTimeline?: { monthsToBuild: number; monthlySavingsNeeded: number },
    currentSituation?: EmergencyFundInput['currentSituation'],
    goals?: EmergencyFundInput['goals']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(
      `Target emergency fund: $${targetFund.targetAmount.toFixed(0)} - ${targetFund.interpretation}`
    );

    if (currentSituation && currentSituation.currentEmergencyFund < targetFund.targetAmount) {
      const shortfall = targetFund.targetAmount - currentSituation.currentEmergencyFund;
      recommendations.push(`Shortfall: $${shortfall.toFixed(0)} to reach target`);

      if (buildTimeline) {
        recommendations.push(
          `Time to build: ${buildTimeline.monthsToBuild} months at $${buildTimeline.monthlySavingsNeeded.toFixed(0)}/month`
        );
      }
    } else if (
      currentSituation &&
      currentSituation.currentEmergencyFund >= targetFund.targetAmount
    ) {
      recommendations.push('✅ Emergency fund target met!');
    }

    if (goals?.priority === 'build-quickly') {
      recommendations.push(
        'Prioritize building emergency fund quickly - consider reducing other expenses temporarily'
      );
    }

    recommendations.push(
      'Keep emergency fund in high-yield savings account for liquidity and safety'
    );
    recommendations.push('Review and adjust target as life circumstances change');

    return recommendations;
  }
}
