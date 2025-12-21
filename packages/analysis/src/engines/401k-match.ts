/**
 * 401(k) Employer Match Optimizer
 * Maximize employer match, analyze vesting, and optimize contributions
 */

import type { EmployerMatch401kInput } from '../schemas/401k-match.js';

export class EmployerMatch401kOptimizer {
  /**
   * Analyze and optimize 401(k) employer match
   */
  static analyze(input: EmployerMatch401kInput): unknown {
    const planDetails = input.planDetails;
    const employeeInfo = input.employeeInfo;
    const analysis = input.analysis;

    // Calculate current match
    const currentMatch = this.calculateCurrentMatch(planDetails, employeeInfo);

    // Calculate maximum match
    const maximumMatch = this.calculateMaximumMatch(planDetails, employeeInfo);

    // Optimization analysis
    const optimization = analysis.includeMaximization
      ? this.optimizeContribution(employeeInfo, currentMatch, maximumMatch)
      : undefined;

    // Vesting analysis
    const vestingAnalysis = analysis.includeVestingAnalysis
      ? this.analyzeVesting(planDetails, employeeInfo, maximumMatch)
      : undefined;

    // Tax analysis
    const taxAnalysis = analysis.includeTaxAnalysis
      ? this.analyzeTaxBenefits(maximumMatch)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      currentMatch,
      maximumMatch,
      optimization,
      vestingAnalysis
    );

    return {
      summary: {
        currentContribution: employeeInfo.annualSalary * employeeInfo.currentContribution,
        currentMatch: currentMatch.annualMatch,
        maximumMatch: maximumMatch.annualMatch,
        matchLeftOnTable: maximumMatch.annualMatch - currentMatch.annualMatch,
        optimalContribution: optimization?.optimalContributionPercent,
      },
      currentMatch,
      maximumMatch,
      optimization,
      vestingAnalysis,
      taxAnalysis,
      recommendations,
    };
  }

  private static calculateCurrentMatch(
    planDetails: EmployerMatch401kInput['planDetails'],
    employeeInfo: EmployerMatch401kInput['employeeInfo']
  ): {
    annualContribution: number;
    annualMatch: number;
    matchPercentage: number;
    isMaximized: boolean;
  } {
    const annualContribution = employeeInfo.annualSalary * employeeInfo.currentContribution;
    const matchableContribution = Math.min(
      annualContribution,
      employeeInfo.annualSalary * planDetails.matchLimit
    );
    const annualMatch = matchableContribution * planDetails.employerMatch;
    const matchPercentage = (annualMatch / annualContribution) * 100;
    const maximumPossibleMatch =
      employeeInfo.annualSalary * planDetails.matchLimit * planDetails.employerMatch;
    const isMaximized = annualMatch >= maximumPossibleMatch * 0.99; // Within 1% of max

    return {
      annualContribution,
      annualMatch,
      matchPercentage,
      isMaximized,
    };
  }

  private static calculateMaximumMatch(
    planDetails: EmployerMatch401kInput['planDetails'],
    employeeInfo: EmployerMatch401kInput['employeeInfo']
  ): {
    optimalContributionPercent: number;
    optimalContributionAmount: number;
    annualMatch: number;
    totalAnnualContribution: number;
  } {
    // To maximize match, contribute up to the match limit
    const optimalContributionPercent = planDetails.matchLimit;
    const optimalContributionAmount = employeeInfo.annualSalary * optimalContributionPercent;
    const annualMatch = optimalContributionAmount * planDetails.employerMatch;
    const totalAnnualContribution = optimalContributionAmount + annualMatch;

    return {
      optimalContributionPercent,
      optimalContributionAmount,
      annualMatch,
      totalAnnualContribution,
    };
  }

  private static optimizeContribution(
    employeeInfo: EmployerMatch401kInput['employeeInfo'],
    currentMatch: { annualMatch: number },
    maximumMatch: { optimalContributionPercent: number; optimalContributionAmount: number; annualMatch: number }
  ): {
    currentContributionPercent: number;
    optimalContributionPercent: number;
    additionalContributionNeeded: number;
    additionalMatchGained: number;
    roi: number;
  } {
    const additionalContributionNeeded =
      maximumMatch.optimalContributionAmount -
      employeeInfo.annualSalary * employeeInfo.currentContribution;
    const additionalMatchGained = maximumMatch.annualMatch - currentMatch.annualMatch;
    const roi =
      additionalContributionNeeded > 0
        ? (additionalMatchGained / additionalContributionNeeded) * 100
        : 0;

    return {
      currentContributionPercent: employeeInfo.currentContribution,
      optimalContributionPercent: maximumMatch.optimalContributionPercent,
      additionalContributionNeeded,
      additionalMatchGained,
      roi,
    };
  }

  private static analyzeVesting(
    planDetails: EmployerMatch401kInput['planDetails'],
    employeeInfo: EmployerMatch401kInput['employeeInfo'],
    maximumMatch: { annualMatch: number }
  ): {
    vestedMatch: number;
    unvestedMatch: number;
    vestingStatus: string;
    yearsToFullVesting: number;
  } {
    let vestedMatch = maximumMatch.annualMatch;
    let unvestedMatch = 0;
    let vestingStatus = 'Fully Vested';
    let yearsToFullVesting = 0;

    if (planDetails.vestingSchedule === 'immediate') {
      vestedMatch = maximumMatch.annualMatch;
      unvestedMatch = 0;
    } else if (planDetails.vestingSchedule === 'cliff') {
      if (employeeInfo.yearsOfService >= planDetails.vestingYears) {
        vestedMatch = maximumMatch.annualMatch;
        unvestedMatch = 0;
      } else {
        vestedMatch = 0;
        unvestedMatch = maximumMatch.annualMatch;
        yearsToFullVesting = planDetails.vestingYears - employeeInfo.yearsOfService;
        vestingStatus = `Cliff vesting - ${yearsToFullVesting} years remaining`;
      }
    } else if (planDetails.vestingSchedule === 'graded') {
      const vestingPercentage = Math.min(1, employeeInfo.yearsOfService / planDetails.vestingYears);
      vestedMatch = maximumMatch.annualMatch * vestingPercentage;
      unvestedMatch = maximumMatch.annualMatch * (1 - vestingPercentage);
      yearsToFullVesting = Math.max(0, planDetails.vestingYears - employeeInfo.yearsOfService);
      vestingStatus = `Graded vesting - ${(vestingPercentage * 100).toFixed(0)}% vested`;
    }

    return {
      vestedMatch,
      unvestedMatch,
      vestingStatus,
      yearsToFullVesting,
    };
  }

  private static analyzeTaxBenefits(
    maximumMatch: { optimalContributionAmount: number; totalAnnualContribution: number }
  ): {
    taxSavings: number;
    effectiveContribution: number;
    interpretation: string;
  } {
    // Assume 25% tax bracket
    const taxRate = 0.25;
    const taxSavings = maximumMatch.optimalContributionAmount * taxRate;
    const effectiveContribution = maximumMatch.optimalContributionAmount - taxSavings;

    return {
      taxSavings,
      effectiveContribution,
      interpretation: `Tax-deferred contributions save $${taxSavings.toFixed(0)} in taxes annually`,
    };
  }

  private static generateRecommendations(
    currentMatch: { isMaximized: boolean; annualMatch: number },
    maximumMatch: { annualMatch: number; optimalContributionPercent: number },
    optimization?: { additionalMatchGained: number; roi: number },
    vestingAnalysis?: { vestingStatus: string; yearsToFullVesting: number }
  ): string[] {
    const recommendations: string[] = [];

    if (!currentMatch.isMaximized) {
      recommendations.push(
        `⚠️ Not maximizing employer match - leaving $${(maximumMatch.annualMatch - currentMatch.annualMatch).toFixed(0)} on the table annually`
      );

      if (optimization) {
        recommendations.push(
          `Contribute ${(maximumMatch.optimalContributionPercent * 100).toFixed(0)}% of salary to maximize match (ROI: ${optimization.roi.toFixed(0)}%)`
        );
        recommendations.push(
          `Additional match gained: $${optimization.additionalMatchGained.toFixed(0)}/year - this is free money!`
        );
      }
    } else {
      recommendations.push('✅ Maximizing employer match - excellent!');
    }

    if (vestingAnalysis && vestingAnalysis.yearsToFullVesting > 0) {
      recommendations.push(
        `Vesting status: ${vestingAnalysis.vestingStatus} - ${vestingAnalysis.yearsToFullVesting.toFixed(0)} years to full vesting`
      );
    }

    recommendations.push(
      "Contribute at least enough to get full employer match - it's an instant return"
    );
    recommendations.push(
      'Consider contributing beyond match limit if you can afford it (up to IRS limits)'
    );

    return recommendations;
  }
}
