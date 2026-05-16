/**
 * Net Worth Tracker
 * Track assets, liabilities, net worth over time with projections
 */

import type { NetWorthInput } from '../../schemas/net-worth.js';

export class NetWorthTracker {
  /**
   * Analyze net worth and project future value
   */
  static analyze(input: NetWorthInput): unknown {
    const assets = input.assets;
    const liabilities = input.liabilities;
    const projections = input.projections;
    const goals = input.goals;

    // Calculate current net worth
    const currentNetWorth = this.calculateNetWorth(assets, liabilities);

    // Project future net worth
    const netWorthProjections = this.projectNetWorth(
      assets,
      liabilities,
      projections,
      goals.targetDate
    );

    // Milestones
    const milestones = goals.includeMilestones
      ? this.calculateMilestones(currentNetWorth, netWorthProjections, goals.targetNetWorth)
      : undefined;

    // Asset allocation
    const assetAllocation = this.analyzeAssetAllocation(assets);

    // Debt analysis
    const debtAnalysis = this.analyzeDebt(liabilities, currentNetWorth);

    // Recommendations
    const recommendations = this.generateRecommendations(
      currentNetWorth,
      netWorthProjections,
      milestones,
      debtAnalysis
    );

    return {
      summary: {
        currentNetWorth: currentNetWorth.netWorth,
        totalAssets: currentNetWorth.totalAssets,
        totalLiabilities: currentNetWorth.totalLiabilities,
        projectedNetWorth: netWorthProjections.finalNetWorth,
        yearsToTarget: milestones?.yearsToTarget,
      },
      currentNetWorth,
      projections: netWorthProjections,
      milestones,
      assetAllocation,
      debtAnalysis,
      recommendations,
    };
  }

  private static calculateNetWorth(
    assets: NetWorthInput['assets'],
    liabilities: NetWorthInput['liabilities']
  ): {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assetBreakdown: Array<{ category: string; value: number; percentage: number }>;
    liabilityBreakdown: Array<{ category: string; value: number; percentage: number }>;
  } {
    const totalAssets =
      assets.cash +
      assets.investments +
      assets.realEstate +
      assets.retirementAccounts +
      assets.businessValue +
      assets.otherAssets;

    const totalLiabilities =
      liabilities.mortgages +
      liabilities.creditCardDebt +
      liabilities.studentLoans +
      liabilities.autoLoans +
      liabilities.otherDebt;

    const netWorth = totalAssets - totalLiabilities;

    const assetBreakdown = [
      { category: 'Cash', value: assets.cash, percentage: (assets.cash / totalAssets) * 100 },
      {
        category: 'Investments',
        value: assets.investments,
        percentage: (assets.investments / totalAssets) * 100,
      },
      {
        category: 'Real Estate',
        value: assets.realEstate,
        percentage: (assets.realEstate / totalAssets) * 100,
      },
      {
        category: 'Retirement',
        value: assets.retirementAccounts,
        percentage: (assets.retirementAccounts / totalAssets) * 100,
      },
      {
        category: 'Business',
        value: assets.businessValue,
        percentage: (assets.businessValue / totalAssets) * 100,
      },
      {
        category: 'Other',
        value: assets.otherAssets,
        percentage: (assets.otherAssets / totalAssets) * 100,
      },
    ];

    const liabilityBreakdown = [
      {
        category: 'Mortgages',
        value: liabilities.mortgages,
        percentage: (liabilities.mortgages / totalLiabilities) * 100,
      },
      {
        category: 'Credit Cards',
        value: liabilities.creditCardDebt,
        percentage: (liabilities.creditCardDebt / totalLiabilities) * 100,
      },
      {
        category: 'Student Loans',
        value: liabilities.studentLoans,
        percentage: (liabilities.studentLoans / totalLiabilities) * 100,
      },
      {
        category: 'Auto Loans',
        value: liabilities.autoLoans,
        percentage: (liabilities.autoLoans / totalLiabilities) * 100,
      },
      {
        category: 'Other Debt',
        value: liabilities.otherDebt,
        percentage: (liabilities.otherDebt / totalLiabilities) * 100,
      },
    ];

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetBreakdown,
      liabilityBreakdown,
    };
  }

  private static projectNetWorth(
    assets: NetWorthInput['assets'],
    liabilities: NetWorthInput['liabilities'],
    projections: NetWorthInput['projections'],
    _targetDate?: string
  ): {
    projections: Array<{
      year: number;
      assets: number;
      liabilities: number;
      netWorth: number;
      growth: number;
    }>;
    finalNetWorth: number;
    totalGrowth: number;
  } {
    const netWorthProjections: Array<{
      year: number;
      assets: number;
      liabilities: number;
      netWorth: number;
      growth: number;
    }> = [];

    let currentAssets =
      assets.cash +
      assets.investments +
      assets.realEstate +
      assets.retirementAccounts +
      assets.businessValue +
      assets.otherAssets;
    let currentLiabilities =
      liabilities.mortgages +
      liabilities.creditCardDebt +
      liabilities.studentLoans +
      liabilities.autoLoans +
      liabilities.otherDebt;
    const initialNetWorth = currentAssets - currentLiabilities;

    for (let year = 0; year <= projections.yearsToProject; year++) {
      currentAssets = currentAssets * (1 + projections.assetGrowthRate);
      currentLiabilities = currentLiabilities * (1 - projections.debtPaydownRate);
      const netWorth = currentAssets - currentLiabilities;
      const growth = netWorth - initialNetWorth;

      netWorthProjections.push({
        year,
        assets: currentAssets,
        liabilities: currentLiabilities,
        netWorth,
        growth,
      });
    }

    const finalProjection = netWorthProjections[netWorthProjections.length - 1];
    return {
      projections: netWorthProjections,
      finalNetWorth: finalProjection?.netWorth || initialNetWorth,
      totalGrowth: finalProjection?.growth || 0,
    };
  }

  private static calculateMilestones(
    currentNetWorth: { netWorth: number },
    netWorthProjections: { projections: Array<{ year: number; netWorth: number }> },
    targetNetWorth?: number
  ): {
    milestones: Array<{ milestone: string; year: number; netWorth: number }>;
    yearsToTarget: number | undefined;
  } {
    const milestones: Array<{ milestone: string; year: number; netWorth: number }> = [];

    // Standard milestones
    const milestoneAmounts = [100000, 250000, 500000, 1000000, 2500000, 5000000];

    milestoneAmounts.forEach((amount) => {
      if (amount > currentNetWorth.netWorth) {
        const milestone = netWorthProjections.projections.find((p) => p.netWorth >= amount);
        if (milestone) {
          milestones.push({
            milestone: `$${amount.toLocaleString()}`,
            year: milestone.year,
            netWorth: milestone.netWorth,
          });
        }
      }
    });

    // Target net worth
    let yearsToTarget: number | undefined;
    if (targetNetWorth && targetNetWorth > currentNetWorth.netWorth) {
      const targetMilestone = netWorthProjections.projections.find(
        (p) => p.netWorth >= targetNetWorth
      );
      if (targetMilestone) {
        yearsToTarget = targetMilestone.year;
        milestones.push({
          milestone: 'Target Net Worth',
          year: targetMilestone.year,
          netWorth: targetMilestone.netWorth,
        });
      }
    }

    return {
      milestones,
      yearsToTarget,
    };
  }

  private static analyzeAssetAllocation(assets: NetWorthInput['assets']): {
    allocation: Array<{ category: string; value: number; percentage: number }>;
    diversificationScore: number;
  } {
    const totalAssets =
      assets.cash +
      assets.investments +
      assets.realEstate +
      assets.retirementAccounts +
      assets.businessValue +
      assets.otherAssets;

    const allocation = [
      { category: 'Cash', value: assets.cash, percentage: (assets.cash / totalAssets) * 100 },
      {
        category: 'Investments',
        value: assets.investments,
        percentage: (assets.investments / totalAssets) * 100,
      },
      {
        category: 'Real Estate',
        value: assets.realEstate,
        percentage: (assets.realEstate / totalAssets) * 100,
      },
      {
        category: 'Retirement',
        value: assets.retirementAccounts,
        percentage: (assets.retirementAccounts / totalAssets) * 100,
      },
      {
        category: 'Business',
        value: assets.businessValue,
        percentage: (assets.businessValue / totalAssets) * 100,
      },
      {
        category: 'Other',
        value: assets.otherAssets,
        percentage: (assets.otherAssets / totalAssets) * 100,
      },
    ];

    // Diversification score (higher = more diversified)
    const nonZeroCategories = allocation.filter((a) => a.value > 0).length;
    const maxCategoryPercentage = Math.max(...allocation.map((a) => a.percentage));
    const diversificationScore = nonZeroCategories * 10 + (100 - maxCategoryPercentage);

    return {
      allocation,
      diversificationScore: Math.min(100, diversificationScore),
    };
  }

  private static analyzeDebt(
    liabilities: NetWorthInput['liabilities'],
    netWorth: { netWorth: number; totalAssets: number }
  ): {
    totalDebt: number;
    debtToAssets: number;
    debtToNetWorth: number;
    highInterestDebt: number;
    recommendations: string[];
  } {
    const totalDebt =
      liabilities.mortgages +
      liabilities.creditCardDebt +
      liabilities.studentLoans +
      liabilities.autoLoans +
      liabilities.otherDebt;

    const debtToAssets = netWorth.totalAssets > 0 ? (totalDebt / netWorth.totalAssets) * 100 : 0;
    const debtToNetWorth = netWorth.netWorth > 0 ? (totalDebt / netWorth.netWorth) * 100 : 999;
    const highInterestDebt = liabilities.creditCardDebt; // Assume credit cards are high interest

    const recommendations: string[] = [];
    if (highInterestDebt > 0) {
      recommendations.push(
        `High-interest debt: $${highInterestDebt.toFixed(0)} - prioritize paying this off`
      );
    }

    if (debtToAssets > 50) {
      recommendations.push('High debt-to-assets ratio - consider reducing debt');
    }

    return {
      totalDebt,
      debtToAssets,
      debtToNetWorth,
      highInterestDebt,
      recommendations,
    };
  }

  private static generateRecommendations(
    currentNetWorth: { netWorth: number },
    netWorthProjections: { finalNetWorth: number; totalGrowth: number },
    milestones?: { yearsToTarget: number | undefined },
    debtAnalysis?: { recommendations: string[] }
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Current net worth: $${currentNetWorth.netWorth.toFixed(0)}`);
    recommendations.push(
      `Projected net worth in 10 years: $${netWorthProjections.finalNetWorth.toFixed(0)}`
    );

    if (milestones && milestones.yearsToTarget) {
      recommendations.push(`Years to reach target: ${milestones.yearsToTarget}`);
    }

    if (debtAnalysis) {
      recommendations.push(...debtAnalysis.recommendations);
    }

    recommendations.push('Track net worth monthly to monitor progress');
    recommendations.push('Focus on increasing assets and reducing liabilities');

    return recommendations;
  }
}
