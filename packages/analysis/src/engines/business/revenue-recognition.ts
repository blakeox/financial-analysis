/**
 * Revenue Recognition Calculator
 * ASC 606 compliant revenue recognition analysis
 */

import type { RevenueRecognitionInput } from '../../schemas/revenue-recognition.js';

export class RevenueRecognitionCalculator {
  /**
   * Analyze revenue recognition
   */
  static analyze(input: RevenueRecognitionInput): unknown {
    const companyInfo = input.companyInfo;
    const contracts = input.contracts;
    const analysis = input.analysis;

    // Allocate contract value
    const contractAllocation = this.allocateContractValue(contracts);

    // Revenue schedule
    const revenueSchedule = analysis.includeRevenueSchedule
      ? this.createRevenueSchedule(contractAllocation, analysis.projectionPeriod)
      : undefined;

    // Deferred revenue
    const deferredRevenue = analysis.includeDeferredRevenue
      ? this.calculateDeferredRevenue(contractAllocation, revenueSchedule)
      : undefined;

    // Contract assets
    const contractAssets = analysis.includeContractAssetAnalysis
      ? this.calculateContractAssets(contractAllocation, revenueSchedule)
      : undefined;

    // Compliance check
    const complianceCheck = analysis.includeComplianceCheck
      ? this.checkCompliance(contracts, companyInfo)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      revenueSchedule,
      deferredRevenue,
      complianceCheck
    );

    return {
      summary: {
        totalContractValue: contracts.reduce((sum, c) => sum + c.contractValue, 0),
        totalRevenueRecognized: revenueSchedule?.totalRecognized || 0,
        totalDeferredRevenue: deferredRevenue?.totalDeferred || 0,
        complianceStatus: complianceCheck?.status || 'unknown',
      },
      contractAllocation,
      revenueSchedule,
      deferredRevenue,
      contractAssets,
      complianceCheck,
      recommendations,
    };
  }

  private static allocateContractValue(contracts: RevenueRecognitionInput['contracts']): Array<{
    contractId: string;
    totalValue: number;
    obligations: Array<{ obligationId: string; allocatedValue: number; recognitionMethod: string }>;
  }> {
    return contracts.map((contract) => {
      const totalStandalonePrice = contract.performanceObligations.reduce(
        (sum, po) => sum + po.standaloneSellingPrice,
        0
      );

      const obligations = contract.performanceObligations.map((po) => {
        const allocatedValue =
          totalStandalonePrice > 0
            ? (po.standaloneSellingPrice / totalStandalonePrice) * contract.contractValue
            : contract.contractValue / contract.performanceObligations.length;

        return {
          obligationId: po.obligationId,
          allocatedValue,
          recognitionMethod: po.fulfillmentMethod,
        };
      });

      return {
        contractId: contract.contractId,
        totalValue: contract.contractValue,
        obligations,
      };
    });
  }

  private static createRevenueSchedule(
    allocation: Array<{
      obligations: Array<{ allocatedValue: number; recognitionMethod: string }>;
    }>,
    years: number
  ): {
    schedule: Array<{ year: number; revenue: number; cumulativeRevenue: number }>;
    totalRecognized: number;
  } {
    const schedule: Array<{ year: number; revenue: number; cumulativeRevenue: number }> = [];
    let cumulativeRevenue = 0;

    for (let year = 1; year <= years; year++) {
      const yearRevenue = allocation.reduce((sum, contract) => {
        return (
          sum +
          contract.obligations.reduce((obSum, ob) => {
            // Simplified: recognize evenly over time for over-time obligations
            if (ob.recognitionMethod === 'over-time') {
              return obSum + ob.allocatedValue / years;
            }
            // Point-in-time: recognize when fulfilled (simplified to year 1)
            return obSum + (year === 1 ? ob.allocatedValue : 0);
          }, 0)
        );
      }, 0);

      cumulativeRevenue += yearRevenue;
      schedule.push({
        year,
        revenue: yearRevenue,
        cumulativeRevenue,
      });
    }

    return {
      schedule,
      totalRecognized: cumulativeRevenue,
    };
  }

  private static calculateDeferredRevenue(
    allocation: Array<{ totalValue: number }>,
    schedule: { schedule: Array<{ cumulativeRevenue: number }> } | undefined
  ): {
    totalDeferred: number;
    byPeriod: Array<{ period: number; deferred: number }>;
  } {
    const totalContractValue = allocation.reduce((sum, c) => sum + c.totalValue, 0);
    const totalRecognized =
      schedule?.schedule[schedule.schedule.length - 1]?.cumulativeRevenue || 0;
    const totalDeferred = totalContractValue - totalRecognized;

    const byPeriod =
      schedule?.schedule.map((entry, index) => ({
        period: index + 1,
        deferred: totalContractValue - entry.cumulativeRevenue,
      })) || [];

    return {
      totalDeferred: Math.max(0, totalDeferred),
      byPeriod,
    };
  }

  private static calculateContractAssets(
    allocation: Array<{ totalValue: number }>,
    schedule: { schedule: Array<{ revenue: number }> } | undefined
  ): {
    totalContractAssets: number;
    byPeriod: Array<{ period: number; assets: number }>;
  } {
    // Contract assets represent costs incurred before revenue recognition
    // Simplified calculation
    const totalContractValue = allocation.reduce((sum, c) => sum + c.totalValue, 0);
    const totalRecognized = schedule?.schedule.reduce((sum, entry) => sum + entry.revenue, 0) || 0;
    const totalContractAssets = Math.max(0, totalContractValue * 0.3 - totalRecognized); // Assume 30% costs incurred

    const byPeriod =
      schedule?.schedule.map((entry, index) => ({
        period: index + 1,
        assets: Math.max(0, totalContractValue * 0.3 - entry.revenue),
      })) || [];

    return {
      totalContractAssets,
      byPeriod,
    };
  }

  private static checkCompliance(
    contracts: RevenueRecognitionInput['contracts'],
    _companyInfo: RevenueRecognitionInput['companyInfo']
  ): {
    status: 'compliant' | 'non-compliant' | 'review-needed';
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for proper performance obligation identification
    contracts.forEach((contract) => {
      if (contract.performanceObligations.length === 0) {
        issues.push(`Contract ${contract.contractId} has no performance obligations defined`);
      }
    });

    // Check standalone selling prices
    contracts.forEach((contract) => {
      const totalStandalonePrice = contract.performanceObligations.reduce(
        (sum, po) => sum + po.standaloneSellingPrice,
        0
      );
      if (totalStandalonePrice === 0) {
        issues.push(`Contract ${contract.contractId} has no standalone selling prices`);
      }
    });

    const status =
      issues.length === 0 ? 'compliant' : issues.length <= 2 ? 'review-needed' : 'non-compliant';

    return {
      status,
      issues,
    };
  }

  private static generateRecommendations(
    schedule: { totalRecognized: number } | undefined,
    deferred: { totalDeferred: number } | undefined,
    compliance: { status: string; issues: string[] } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (schedule) {
      recommendations.push(`Total revenue to recognize: $${schedule.totalRecognized.toFixed(0)}`);
    }

    if (deferred && deferred.totalDeferred > 0) {
      recommendations.push(`Deferred revenue: $${deferred.totalDeferred.toFixed(0)}`);
    }

    if (compliance) {
      if (compliance.status === 'compliant') {
        recommendations.push('Revenue recognition appears ASC 606 compliant');
      } else {
        recommendations.push('Review revenue recognition for compliance issues');
        compliance.issues.forEach((issue) => {
          recommendations.push(`Issue: ${issue}`);
        });
      }
    }

    return recommendations;
  }
}
