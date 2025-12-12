/**
 * Startup Financial Model
 * Comprehensive startup financial projections and funding analysis
 */

import type { StartupFinancialModelInput } from '../schemas/startup-financial-model.js';

export class StartupFinancialModel {
  /**
   * Analyze startup financial model
   */
  static analyze(input: StartupFinancialModelInput): unknown {
    const currentSituation = input.currentSituation;
    const revenueProjections = input.revenueProjections;
    const expenses = input.expenses;
    const funding = input.funding;
    const milestones = input.milestones;
    const analysis = input.analysis;

    // Burn rate analysis
    const burnRateAnalysis = analysis.includeBurnRate
      ? this.calculateBurnRate(currentSituation, expenses, revenueProjections)
      : undefined;

    // Runway calculation
    const runwayAnalysis = analysis.includeRunway
      ? this.calculateRunway(currentSituation, burnRateAnalysis, funding)
      : undefined;

    // Unit economics
    const unitEconomics = analysis.includeUnitEconomics
      ? this.calculateUnitEconomics(revenueProjections, expenses, currentSituation)
      : undefined;

    // Funding needs
    const fundingNeeds = analysis.includeFundingNeeds
      ? this.analyzeFundingNeeds(runwayAnalysis, milestones, expenses, revenueProjections)
      : undefined;

    // Milestone tracking
    const milestoneTracking = analysis.includeMilestoneTracking
      ? this.trackMilestones(milestones, revenueProjections, currentSituation)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      burnRateAnalysis,
      runwayAnalysis,
      unitEconomics,
      fundingNeeds,
      milestoneTracking
    );

    return {
      summary: {
        currentCash: currentSituation.currentCash,
        monthlyBurnRate: burnRateAnalysis?.monthlyBurnRate || 0,
        runwayMonths: runwayAnalysis?.runwayMonths || 0,
        fundingNeeded: fundingNeeds?.totalFundingNeeded || 0,
        ltvCacRatio: unitEconomics?.ltvCacRatio || 0,
      },
      burnRateAnalysis,
      runwayAnalysis,
      unitEconomics,
      fundingNeeds,
      milestoneTracking,
      recommendations,
    };
  }

  private static calculateBurnRate(
    current: StartupFinancialModelInput['currentSituation'],
    expenses: StartupFinancialModelInput['expenses'],
    _revenue: StartupFinancialModelInput['revenueProjections']
  ): {
    monthlyBurnRate: number;
    grossBurnRate: number;
    netBurnRate: number;
    burnRateTrend: string;
  } {
    const fixedCosts = expenses.fixedCosts.salaries + expenses.fixedCosts.rent + expenses.fixedCosts.utilities + expenses.fixedCosts.insurance + expenses.fixedCosts.otherFixed;
    const grossBurnRate = fixedCosts / 12;
    const netBurnRate = grossBurnRate - (current.currentRevenue / 12);
    const monthlyBurnRate = netBurnRate;

    let trend = 'stable';
    if (netBurnRate > grossBurnRate * 0.8) {
      trend = 'increasing';
    } else if (netBurnRate < grossBurnRate * 0.5) {
      trend = 'decreasing';
    }

    return {
      monthlyBurnRate,
      grossBurnRate,
      netBurnRate,
      burnRateTrend: trend,
    };
  }

  private static calculateRunway(
    current: StartupFinancialModelInput['currentSituation'],
    burnRate: { monthlyBurnRate: number } | undefined,
    _funding: StartupFinancialModelInput['funding']
  ): {
    runwayMonths: number;
    runwayDate: string;
    fundingNeeded: number;
  } {
    if (!burnRate) {
      return {
        runwayMonths: 0,
        runwayDate: new Date().toISOString(),
        fundingNeeded: 0,
      };
    }

    const runwayMonths = burnRate.monthlyBurnRate > 0
      ? current.currentCash / burnRate.monthlyBurnRate
      : 999;
    const runwayDate = new Date();
    runwayDate.setMonth(runwayDate.getMonth() + Math.floor(runwayMonths));
    const fundingNeeded = Math.max(0, burnRate.monthlyBurnRate * 6 - current.currentCash); // 6 months buffer

    return {
      runwayMonths: Math.floor(runwayMonths),
      runwayDate: runwayDate.toISOString(),
      fundingNeeded,
    };
  }

  private static calculateUnitEconomics(
    revenue: StartupFinancialModelInput['revenueProjections'],
    expenses: StartupFinancialModelInput['expenses'],
    current: StartupFinancialModelInput['currentSituation']
  ): {
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackPeriod: number;
    grossMargin: number;
  } {
    const cac = expenses.variableCosts.customerAcquisitionCost || (expenses.variableCosts.marketing * (revenue.revenueModel === 'subscription' ? current.currentMRR : current.currentRevenue)) / (current.currentCustomers || 1);
    const arpu = revenue.revenueModel === 'subscription' ? (current.currentMRR / (current.currentCustomers || 1)) * 12 : (current.currentRevenue / (current.currentCustomers || 1));
    const churnRate = revenue.revenueProjections.monthlyRevenue[0]?.churnRate || 0.05;
    const ltv = arpu / churnRate;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const paybackPeriod = arpu > 0 ? cac / (arpu / 12) : 0;
    const grossMargin = revenue.revenueModel === 'subscription' ? (1 - expenses.variableCosts.costOfGoodsSold) * 100 : (1 - expenses.variableCosts.costOfGoodsSold) * 100;

    return {
      cac,
      ltv,
      ltvCacRatio,
      paybackPeriod,
      grossMargin,
    };
  }

  private static analyzeFundingNeeds(
    runway: { fundingNeeded: number } | undefined,
    milestones: StartupFinancialModelInput['milestones'],
    _expenses: StartupFinancialModelInput['expenses'],
    _revenue: StartupFinancialModelInput['revenueProjections']
  ): {
    totalFundingNeeded: number;
    byMilestone: Array<{ milestone: string; fundingNeeded: number; targetDate: string }>;
    recommendedFunding: number;
  } {
    const baseFunding = runway?.fundingNeeded || 0;
    const milestoneFunding = milestones.reduce((sum, m) => sum + m.requiredFunding, 0);
    const totalFundingNeeded = baseFunding + milestoneFunding;

    const byMilestone = milestones.map((m) => ({
      milestone: m.milestone,
      fundingNeeded: m.requiredFunding,
      targetDate: m.targetDate,
    }));

    const recommendedFunding = totalFundingNeeded * 1.5; // 50% buffer

    return {
      totalFundingNeeded,
      byMilestone,
      recommendedFunding,
    };
  }

  private static trackMilestones(
    milestones: StartupFinancialModelInput['milestones'],
    revenue: StartupFinancialModelInput['revenueProjections'],
    current: StartupFinancialModelInput['currentSituation']
  ): {
    milestones: Array<{
      milestone: string;
      targetDate: string;
      status: 'on-track' | 'at-risk' | 'behind';
      progress: number;
    }>;
  } {
    const now = new Date();
    const milestoneStatus = milestones.map((m) => {
      const targetDate = new Date(m.targetDate);
      const daysUntilTarget = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const progress = m.keyMetrics?.revenue
        ? (current.currentRevenue / m.keyMetrics.revenue) * 100
        : m.keyMetrics?.customers
          ? ((current.currentCustomers || 0) / m.keyMetrics.customers) * 100
          : 50;

      let status: 'on-track' | 'at-risk' | 'behind' = 'on-track';
      if (progress < 50 && daysUntilTarget < 90) {
        status = 'behind';
      } else if (progress < 75 && daysUntilTarget < 180) {
        status = 'at-risk';
      }

      return {
        milestone: m.milestone,
        targetDate: m.targetDate,
        status,
        progress: Math.min(100, progress),
      };
    });

    return {
      milestones: milestoneStatus,
    };
  }

  private static generateRecommendations(
    burnRate: { monthlyBurnRate: number } | undefined,
    runway: { runwayMonths: number; fundingNeeded: number } | undefined,
    unitEconomics: { ltvCacRatio: number; paybackPeriod: number } | undefined,
    funding: { totalFundingNeeded: number } | undefined,
    milestones: { milestones: Array<{ status: string }> } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (burnRate) {
      recommendations.push(`Monthly burn rate: $${burnRate.monthlyBurnRate.toFixed(0)}`);
    }

    if (runway) {
      recommendations.push(`Runway: ${runway.runwayMonths} months`);
      if (runway.runwayMonths < 6) {
        recommendations.push('URGENT: Secure funding within 3 months');
      }
    }

    if (unitEconomics) {
      recommendations.push(`LTV:CAC ratio: ${unitEconomics.ltvCacRatio.toFixed(2)}`);
      if (unitEconomics.ltvCacRatio < 3) {
        recommendations.push('LTV:CAC ratio below 3:1 - improve unit economics');
      }
      recommendations.push(`Payback period: ${unitEconomics.paybackPeriod.toFixed(1)} months`);
    }

    if (funding) {
      recommendations.push(`Total funding needed: $${funding.totalFundingNeeded.toFixed(0)}`);
    }

    if (milestones) {
      const behindMilestones = milestones.milestones.filter((m) => m.status === 'behind');
      if (behindMilestones.length > 0) {
        recommendations.push(`${behindMilestones.length} milestones are behind schedule`);
      }
    }

    return recommendations;
  }
}


