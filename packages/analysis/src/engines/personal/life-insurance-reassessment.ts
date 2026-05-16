/**
 * Life Insurance Needs Reassessment Calculator
 * Reassess life insurance coverage needs and optimize policies
 */

import type { LifeInsuranceReassessmentInput } from '../../schemas/life-insurance-reassessment.js';

export class LifeInsuranceReassessmentCalculator {
  /**
   * Reassess life insurance needs
   */
  static analyze(input: LifeInsuranceReassessmentInput): unknown {
    const currentPolicies = input.currentPolicies;
    const financialSituation = input.financialSituation;
    const needsAnalysis = input.needsAnalysis;
    const analysis = input.analysis;

    // Calculate total coverage needs
    const totalNeeds = this.calculateTotalNeeds(needsAnalysis, financialSituation);

    // Analyze current policies
    const currentCoverageAnalysis = this.analyzeCurrentPolicies(currentPolicies, totalNeeds);

    // Coverage gap analysis
    const gapAnalysis = analysis.includeCoverageGapAnalysis
      ? this.analyzeCoverageGap(currentCoverageAnalysis, totalNeeds)
      : undefined;

    // Policy optimization
    const optimization = analysis.includePolicyOptimization
      ? this.optimizePolicies(currentPolicies, totalNeeds, financialSituation)
      : undefined;

    // Term vs Permanent comparison
    const termVsPermanentComparison = analysis.includeTermVsPermanent
      ? this.compareTermVsPermanent(totalNeeds, financialSituation)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      totalNeeds,
      currentCoverageAnalysis,
      gapAnalysis,
      optimization
    );

    return {
      summary: {
        totalNeeded: totalNeeds.totalCoverage,
        currentCoverage: currentCoverageAnalysis.totalCoverage,
        coverageGap: gapAnalysis?.gap || 0,
        excessCoverage: gapAnalysis?.excess || 0,
        recommendation:
          gapAnalysis && gapAnalysis.gap > 0
            ? 'increase'
            : gapAnalysis && gapAnalysis.excess > totalNeeds.totalCoverage * 0.2
              ? 'decrease'
              : 'maintain',
      },
      needsAnalysis: {
        ...totalNeeds,
        totalNeeded: totalNeeds.totalCoverage,
      },
      currentCoverageAnalysis,
      coverageGapAnalysis: gapAnalysis
        ? {
            ...gapAnalysis,
            coverageGap: gapAnalysis.gap,
          }
        : undefined,
      policyOptimization: optimization,
      termVsPermanentComparison,
      recommendations,
    };
  }

  private static compareTermVsPermanent(
    needs: { totalCoverage: number },
    _financial: LifeInsuranceReassessmentInput['financialSituation']
  ): {
    termRecommendation: string;
    permanentRecommendation: string;
    costComparison: {
      termCost: number;
      permanentCost: number;
      difference: number;
    };
  } {
    const termCost = needs.totalCoverage * 0.001;
    const permanentCost = needs.totalCoverage * 0.01;

    return {
      termRecommendation: 'Recommended for temporary needs (income replacement, debt payoff)',
      permanentRecommendation: 'Recommended for permanent needs (estate taxes, final expenses)',
      costComparison: {
        termCost,
        permanentCost,
        difference: permanentCost - termCost,
      },
    };
  }

  private static calculateTotalNeeds(
    needs: LifeInsuranceReassessmentInput['needsAnalysis'],
    financial: LifeInsuranceReassessmentInput['financialSituation']
  ): {
    incomeReplacement: number;
    debtPayoff: number;
    educationFunding: number;
    finalExpenses: number;
    estateTaxes: number;
    totalCoverage: number;
  } {
    const incomeReplacement =
      financial.annualIncome *
      needs.incomeReplacement.yearsOfIncome *
      needs.incomeReplacement.replacementPercentage;
    const debtPayoff = needs.debtPayoff.mortgageBalance + needs.debtPayoff.otherDebt;
    const educationFunding =
      needs.educationFunding.childrenCount * needs.educationFunding.educationCostPerChild;
    const finalExpenses = needs.finalExpenses;
    const estateTaxes = needs.estateTaxes;
    const totalCoverage =
      incomeReplacement + debtPayoff + educationFunding + finalExpenses + estateTaxes;

    return {
      incomeReplacement,
      debtPayoff,
      educationFunding,
      finalExpenses,
      estateTaxes,
      totalCoverage,
    };
  }

  private static analyzeCurrentPolicies(
    policies: LifeInsuranceReassessmentInput['currentPolicies'],
    _needs: { totalCoverage: number }
  ): {
    totalCoverage: number;
    termCoverage: number;
    permanentCoverage: number;
    totalPremiums: number;
    policies: Array<{
      type: string;
      coverage: number;
      premium: number;
      cashValue: number;
    }>;
  } {
    let totalCoverage = 0;
    let termCoverage = 0;
    let permanentCoverage = 0;
    let totalPremiums = 0;
    const policyDetails = policies.map((policy) => {
      totalCoverage += policy.faceAmount;
      if (policy.policyType === 'term') {
        termCoverage += policy.faceAmount;
      } else {
        permanentCoverage += policy.faceAmount;
      }
      totalPremiums += policy.annualPremium;

      return {
        type: policy.policyType,
        coverage: policy.faceAmount,
        premium: policy.annualPremium,
        cashValue: policy.cashValue,
      };
    });

    return {
      totalCoverage,
      termCoverage,
      permanentCoverage,
      totalPremiums,
      policies: policyDetails,
    };
  }

  private static analyzeCoverageGap(
    current: { totalCoverage: number },
    needs: { totalCoverage: number }
  ): {
    gap: number;
    excess: number;
    gapPercentage: number;
    excessPercentage: number;
  } {
    const gap = Math.max(0, needs.totalCoverage - current.totalCoverage);
    const excess = Math.max(0, current.totalCoverage - needs.totalCoverage);
    const gapPercentage = needs.totalCoverage > 0 ? (gap / needs.totalCoverage) * 100 : 0;
    const excessPercentage = current.totalCoverage > 0 ? (excess / current.totalCoverage) * 100 : 0;

    return {
      gap,
      excess,
      gapPercentage,
      excessPercentage,
    };
  }

  private static optimizePolicies(
    policies: LifeInsuranceReassessmentInput['currentPolicies'],
    needs: { totalCoverage: number },
    _financial: LifeInsuranceReassessmentInput['financialSituation']
  ): {
    recommendedTermCoverage: number;
    recommendedPermanentCoverage: number;
    potentialSavings: number;
    recommendations: string[];
  } {
    // Generally recommend term for most needs, permanent for estate planning
    const recommendedTermCoverage = needs.totalCoverage * 0.8; // 80% term
    const recommendedPermanentCoverage = needs.totalCoverage * 0.2; // 20% permanent

    const currentPremiums = policies.reduce((sum, p) => sum + p.annualPremium, 0);
    // Simplified: assume term is cheaper
    const estimatedTermPremium = recommendedTermCoverage * 0.001; // $1 per $1000 coverage
    const estimatedPermanentPremium = recommendedPermanentCoverage * 0.01; // $10 per $1000 coverage
    const optimizedPremiums = estimatedTermPremium + estimatedPermanentPremium;
    const potentialSavings = currentPremiums - optimizedPremiums;

    const recommendations: string[] = [];
    if (potentialSavings > 0) {
      recommendations.push(`Potential annual savings: $${potentialSavings.toFixed(0)}`);
    }

    return {
      recommendedTermCoverage,
      recommendedPermanentCoverage,
      potentialSavings: Math.max(0, potentialSavings),
      recommendations,
    };
  }

  private static generateRecommendations(
    needs: { totalCoverage: number },
    current: { totalCoverage: number },
    gap: { gap: number; excess: number } | undefined,
    optimization: { potentialSavings: number } | undefined
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Total coverage needed: $${needs.totalCoverage.toFixed(0)}`);
    recommendations.push(`Current coverage: $${current.totalCoverage.toFixed(0)}`);

    if (gap) {
      if (gap.gap > 0) {
        recommendations.push(`Coverage gap: $${gap.gap.toFixed(0)} - consider increasing coverage`);
      }
      if (gap.excess > needs.totalCoverage * 0.2) {
        recommendations.push(
          `Excess coverage: $${gap.excess.toFixed(0)} - consider reducing or canceling unnecessary policies`
        );
      }
    }

    if (optimization && optimization.potentialSavings > 0) {
      recommendations.push(
        `Potential savings: $${optimization.potentialSavings.toFixed(0)}/year with optimized coverage`
      );
    }

    return recommendations;
  }
}
