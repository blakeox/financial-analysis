/**
 * Credit Score Impact Analyzer
 * Analyze actions that impact credit score and optimize credit health
 */

import type { CreditScoreImpactInput } from '../../schemas/credit-score-impact.js';

export class CreditScoreImpactAnalyzer {
  /**
   * Analyze credit score impact of various actions
   */
  static analyze(input: CreditScoreImpactInput): unknown {
    const currentCredit = input.currentCredit;
    const creditHistory = input.creditHistory;
    const paymentHistory = input.paymentHistory;
    const creditUtilization = input.creditUtilization;
    const creditMix = input.creditMix;
    const recentActivity = input.recentActivity;
    const plannedActions = input.plannedActions;
    const analysis = input.analysis;

    // Calculate current score factors
    const scoreFactors = this.calculateScoreFactors(
      creditHistory,
      paymentHistory,
      creditUtilization,
      creditMix,
      recentActivity
    );

    // Project score changes
    const scoreProjection = analysis.includeScoreProjection
      ? this.projectScoreChanges(plannedActions, analysis.projectionMonths)
      : undefined;

    // Action recommendations
    const actionRecommendations = analysis.includeActionRecommendations
      ? this.generateActionRecommendations(plannedActions, creditUtilization)
      : undefined;

    // Utilization analysis
    const utilizationAnalysis = this.calculateUtilizationAnalysis(creditUtilization);

    // Timeline analysis
    const timelineAnalysis = analysis.includeTimelineAnalysis
      ? this.calculateTimelineAnalysis(scoreProjection)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      scoreFactors,
      scoreProjection,
      actionRecommendations,
      plannedActions
    );

    return {
      summary: {
        currentScore: currentCredit.currentScore,
        projectedScore: scoreProjection?.projectedScore || currentCredit.currentScore,
        scoreChange:
          (scoreProjection?.projectedScore || currentCredit.currentScore) -
          currentCredit.currentScore,
        creditHealth: this.assessCreditHealth(currentCredit.currentScore),
      },
      scoreFactors,
      scoreProjection,
      actionRecommendations,
      utilizationAnalysis,
      timelineAnalysis,
      recommendations,
    };
  }

  private static calculateUtilizationAnalysis(
    utilization: CreditScoreImpactInput['creditUtilization']
  ) {
    const status =
      utilization.utilizationPercentage <= 0.1
        ? 'excellent'
        : utilization.utilizationPercentage <= 0.3
          ? 'good'
          : utilization.utilizationPercentage <= 0.5
            ? 'fair'
            : 'poor';

    return {
      totalLimit: utilization.totalCreditLimit,
      totalUsed: utilization.totalCreditUsed,
      utilizationPercentage: utilization.utilizationPercentage,
      status,
      individualCards: utilization.individualCardUtilization,
    };
  }

  private static calculateTimelineAnalysis(
    scoreProjection:
      | {
          scoreChanges: Array<{ month: number; score: number; change: number; reason: string }>;
        }
      | undefined
  ) {
    if (!scoreProjection) return undefined;

    return {
      timeline: scoreProjection.scoreChanges.map((change) => ({
        month: change.month,
        score: change.score,
        event: change.reason,
      })),
    };
  }

  private static calculateScoreFactors(
    history: CreditScoreImpactInput['creditHistory'],
    payment: CreditScoreImpactInput['paymentHistory'],
    utilization: CreditScoreImpactInput['creditUtilization'],
    mix: CreditScoreImpactInput['creditMix'],
    activity: CreditScoreImpactInput['recentActivity']
  ): {
    paymentHistoryScore: number; // 35% of score
    utilizationScore: number; // 30% of score
    creditHistoryScore: number; // 15% of score
    creditMixScore: number; // 10% of score
    newCreditScore: number; // 10% of score
    overallHealth: string;
  } {
    // Payment history (35%)
    const paymentScore = payment.onTimePayments >= 100 ? 100 : payment.onTimePayments;
    const paymentHistoryScore = paymentScore * 0.35;

    // Utilization (30%)
    const utilizationScore =
      utilization.utilizationPercentage <= 0.3
        ? 100
        : Math.max(0, 100 - (utilization.utilizationPercentage - 0.3) * 200);
    const utilizationWeighted = utilizationScore * 0.3;

    // Credit history (15%)
    const historyScore =
      history.averageAgeOfAccounts > 84 ? 100 : (history.averageAgeOfAccounts / 84) * 100;
    const historyWeighted = historyScore * 0.15;

    // Credit mix (10%)
    const mixScore =
      (mix.creditCards > 0 ? 30 : 0) +
      (mix.installmentLoans > 0 ? 30 : 0) +
      (mix.mortgages > 0 ? 40 : 0);
    const mixWeighted = mixScore * 0.1;

    // New credit (10%)
    const newCreditScore =
      activity.hardInquiries === 0 ? 100 : Math.max(0, 100 - activity.hardInquiries * 10);
    const newCreditWeighted = newCreditScore * 0.1;

    const overallScore =
      paymentHistoryScore + utilizationWeighted + historyWeighted + mixWeighted + newCreditWeighted;
    const overallHealth =
      overallScore >= 80
        ? 'excellent'
        : overallScore >= 60
          ? 'good'
          : overallScore >= 40
            ? 'fair'
            : 'poor';

    return {
      paymentHistoryScore: paymentHistoryScore * 100,
      utilizationScore: utilizationWeighted * 100,
      creditHistoryScore: historyWeighted * 100,
      creditMixScore: mixWeighted * 100,
      newCreditScore: newCreditWeighted * 100,
      overallHealth,
    };
  }

  private static projectScoreChanges(
    actions: CreditScoreImpactInput['plannedActions'],
    months: number
  ): {
    projectedScore: number;
    scoreChanges: Array<{ month: number; score: number; change: number; reason: string }>;
  } {
    // Simplified projection
    let projectedScore = 700; // Base score
    const changes: Array<{ month: number; score: number; change: number; reason: string }> = [];

    if (actions.payDownDebt && actions.payDownDebt.amount > 0) {
      const utilizationImprovement = Math.min(30, (actions.payDownDebt.amount / 10000) * 10);
      projectedScore += utilizationImprovement;
      changes.push({
        month: 1,
        score: projectedScore,
        change: utilizationImprovement,
        reason: 'Reduced credit utilization',
      });
    }

    if (actions.openNewAccount) {
      projectedScore -= 5; // Temporary dip
      changes.push({
        month: 1,
        score: projectedScore,
        change: -5,
        reason: 'New account inquiry',
      });
    }

    // Gradual improvement over time
    for (let month = 2; month <= months; month++) {
      if (actions.payDownDebt) {
        projectedScore += 2; // Gradual improvement
        changes.push({
          month,
          score: projectedScore,
          change: 2,
          reason: 'Continued on-time payments',
        });
      }
    }

    return {
      projectedScore: Math.min(850, Math.max(300, projectedScore)),
      scoreChanges: changes,
    };
  }

  private static generateActionRecommendations(
    actions: CreditScoreImpactInput['plannedActions'],
    utilization: CreditScoreImpactInput['creditUtilization']
  ): {
    priorityActions: Array<{ action: string; impact: string; priority: number }>;
  } {
    const priorityActions: Array<{ action: string; impact: string; priority: number }> = [];

    if (utilization.utilizationPercentage > 0.3) {
      priorityActions.push({
        action: 'Reduce credit utilization below 30%',
        impact: 'high',
        priority: 1,
      });
    }

    if (actions.payDownDebt && actions.payDownDebt.amount > 0) {
      priorityActions.push({
        action: `Pay down $${actions.payDownDebt.amount.toFixed(0)} in debt`,
        impact: 'high',
        priority: 2,
      });
    }

    if (actions.requestCreditLimitIncrease) {
      priorityActions.push({
        action: 'Request credit limit increase',
        impact: 'medium',
        priority: 3,
      });
    }

    return {
      priorityActions: priorityActions.sort((a, b) => a.priority - b.priority),
    };
  }

  private static assessCreditHealth(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 750) return 'excellent';
    if (score >= 700) return 'good';
    if (score >= 650) return 'fair';
    return 'poor';
  }

  private static generateRecommendations(
    factors: { overallHealth: string },
    projection: { projectedScore: number } | undefined,
    actions: { priorityActions: Array<{ action: string }> } | undefined,
    planned: CreditScoreImpactInput['plannedActions']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Current credit health: ${factors.overallHealth}`);

    if (projection) {
      recommendations.push(`Projected score: ${projection.projectedScore}`);
    }

    if (actions) {
      actions.priorityActions.forEach((action) => {
        recommendations.push(`Priority: ${action.action}`);
      });
    }

    if (planned.payDownDebt) {
      recommendations.push(
        `Pay down debt to reduce utilization to ${(planned.payDownDebt.targetUtilization * 100).toFixed(0)}%`
      );
    }

    return recommendations;
  }
}
