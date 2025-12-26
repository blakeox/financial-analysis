/**
 * 529 Plan Optimizer
 * Optimize 529 plan contributions and state selection
 */

import { Decimal } from 'decimal.js';
import { FiveTwoNineOptimizerInputSchema } from '../../schemas/529-optimizer.js';
import type { FiveTwoNineOptimizerInput } from '../../schemas/529-optimizer.js';

export class FiveTwoNineOptimizer {
  /**
   * Optimize 529 plan strategy
   */
  static analyze(input: FiveTwoNineOptimizerInput): unknown {
    const validated = FiveTwoNineOptimizerInputSchema.parse(input);

    const personalInfo = validated.personalInfo;
    const children = validated.children;
    const current529Accounts = validated.current529Accounts;
    const contributionPlan = validated.contributionPlan;
    const state529Options = validated.state529Options;
    const financialAid = validated.financialAid;
    const strategy = validated.strategy;
    const analysis = validated.analysis;

    // Calculate total education costs
    const educationCosts = this.calculateEducationCosts(children);

    // Analyze current 529 accounts
    const currentAccountAnalysis = this.analyzeCurrentAccounts(
      current529Accounts,
      contributionPlan,
      children
    );

    // Project future balances
    const projections = analysis.includeProjection
      ? this.project529Growth(currentAccountAnalysis, contributionPlan, children)
      : undefined;

    // State comparison
    const stateComparison = strategy.includeMultiStateComparison
      ? (state529Options
        ? this.compareStates(state529Options, personalInfo, contributionPlan)
        : {
          states: [],
          bestState: personalInfo.stateOfResidence,
        })
      : undefined;

    // Financial aid impact
    const aidImpact = financialAid.includeAidImpact
      ? this.analyzeFinancialAidImpact(projections, financialAid, personalInfo)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      educationCosts,
      projections,
      stateComparison,
      aidImpact,
      strategy
    );

    const projectedBalance = projections?.totalBalance ?? 0;
    const shortfallTotal = Math.max(0, educationCosts.totalCost - projectedBalance);
    const shortfallAnalysis = analysis.includeShortfallAnalysis
      ? {
        totalShortfall: shortfallTotal,
        perChild: projections?.perChildProjections ?? [],
      }
      : undefined;

    return {
      summary: {
        totalEducationCosts: educationCosts.totalCost,
        projectedBalance,
        projected529Balance: new Decimal(projectedBalance),
        shortfall: new Decimal(educationCosts.totalCost).minus(projectedBalance).toNumber(),
        optimalState: stateComparison?.bestState,
      },
      educationCosts,
      currentAccountAnalysis,
      projections,
      projection: projections
        ? {
          projectedBalance: projections.totalBalance,
          perChildProjections: projections.perChildProjections,
          annualProjections: projections.annualProjections,
        }
        : undefined,
      stateComparison,
      aidImpact,
      shortfallAnalysis,
      recommendations,
    };
  }

  private static calculateEducationCosts(children: FiveTwoNineOptimizerInput['children']): {
    totalCost: number;
    perChild: Array<{ childAge: number; totalCost: number; yearsUntilCollege: number }>;
  } {
    const perChild = children.map((child) => {
      const yearsUntilCollege = child.yearsUntilCollege;
      const totalCost = child.expectedCollegeCost || 0;
      return {
        childAge: child.age,
        totalCost,
        yearsUntilCollege,
      };
    });

    const totalCost = perChild.reduce((sum, child) => sum + child.totalCost, 0);

    return {
      totalCost,
      perChild,
    };
  }

  private static analyzeCurrentAccounts(
    accounts: FiveTwoNineOptimizerInput['current529Accounts'],
    plan: FiveTwoNineOptimizerInput['contributionPlan'],
    _children: FiveTwoNineOptimizerInput['children']
  ): {
    totalBalance: number;
    totalAnnualContribution: number;
    averageReturn: number;
    totalFees: number;
  } {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const totalAnnualContribution =
      accounts.reduce((sum, acc) => sum + acc.annualContribution, 0) + plan.annualContribution;
    const averageReturn =
      accounts.length > 0
        ? accounts.reduce((sum, acc) => sum + acc.investmentReturn, 0) / accounts.length
        : 0.07;
    const totalFees = accounts.reduce((sum, acc) => sum + acc.currentBalance * acc.fees, 0);

    return {
      totalBalance,
      totalAnnualContribution,
      averageReturn,
      totalFees,
    };
  }

  private static project529Growth(
    current: { totalBalance: number; averageReturn: number; totalAnnualContribution: number },
    plan: FiveTwoNineOptimizerInput['contributionPlan'],
    children: FiveTwoNineOptimizerInput['children']
  ): {
    totalBalance: number;
    perChildProjections: Array<{
      childAge: number;
      projectedBalance: number;
      shortfall: number;
    }>;
    annualProjections: Array<{ year: number; balance: number; contributions: number }>;
  } {
    const maxYears = Math.max(...children.map((c) => c.yearsUntilCollege), 0);
    let balance = new Decimal(current.totalBalance);
    const annualContribution = current.totalAnnualContribution;
    const annualReturn = current.averageReturn;
    const projections: Array<{ year: number; balance: number; contributions: number }> = [];

    for (let year = 1; year <= maxYears; year++) {
      balance = balance.times(new Decimal(1).plus(annualReturn));
      balance = balance.plus(
        annualContribution * Math.pow(1 + plan.contributionIncrease, year - 1)
      );
      projections.push({
        year,
        balance: balance.toNumber(),
        contributions: annualContribution * Math.pow(1 + plan.contributionIncrease, year - 1),
      });
    }

    const perChildProjections = children.map((child) => {
      const years = child.yearsUntilCollege;
      const projectedBalance =
        years > 0 && years <= projections.length ? projections[years - 1]?.balance || 0 : 0;
      const shortfall = Math.max(0, (child.expectedCollegeCost || 0) - projectedBalance);
      return {
        childAge: child.age,
        projectedBalance,
        shortfall,
      };
    });

    return {
      totalBalance: balance.toNumber(),
      perChildProjections,
      annualProjections: projections,
    };
  }

  private static compareStates(
    states: NonNullable<FiveTwoNineOptimizerInput['state529Options']>,
    personalInfo: FiveTwoNineOptimizerInput['personalInfo'],
    plan: FiveTwoNineOptimizerInput['contributionPlan']
  ): {
    states: Array<{
      state: string;
      taxSavings: number;
      fees: number;
      netBenefit: number;
    }>;
    bestState: string;
  } {
    const stateAnalysis = states.map((state) => {
      const taxSavings =
        state.stateTaxDeduction && state.state === personalInfo.stateOfResidence
          ? Math.min(plan.annualContribution, state.maxDeduction) * personalInfo.stateTaxRate
          : 0;
      const fees = plan.annualContribution * state.fees;
      const netBenefit = taxSavings - fees;

      return {
        state: state.state,
        taxSavings,
        fees,
        netBenefit,
      };
    });

    const bestState = stateAnalysis.reduce((best, current) =>
      current.netBenefit > best.netBenefit ? current : best
    ).state;

    return {
      states: stateAnalysis,
      bestState,
    };
  }

  private static analyzeFinancialAidImpact(
    projections: { totalBalance: number } | undefined,
    aid: FiveTwoNineOptimizerInput['financialAid'],
    _personalInfo: FiveTwoNineOptimizerInput['personalInfo']
  ): {
    aidReduction: number;
    net529Benefit: number;
    recommendation: string;
  } {
    if (!projections || !aid.expectFinancialAid) {
      return {
        aidReduction: 0,
        net529Benefit: projections?.totalBalance || 0,
        recommendation: '529 plan has minimal impact on financial aid',
      };
    }

    // 529 assets reduce aid by ~5.64% of asset value
    const aidReduction = projections.totalBalance * 0.0564 * aid.expectedAidPercentage;
    const net529Benefit = projections.totalBalance - aidReduction;

    let recommendation = '529 plan may reduce financial aid eligibility';
    if (aidReduction < projections.totalBalance * 0.1) {
      recommendation = '529 plan has minimal impact on financial aid';
    }

    return {
      aidReduction,
      net529Benefit,
      recommendation,
    };
  }

  private static generateRecommendations(
    costs: { totalCost: number },
    projections: { totalBalance: number; perChildProjections: Array<{ childAge: number; projectedBalance: number; shortfall: number }>; annualProjections: Array<{ year: number; balance: number; contributions: number }> } | undefined,
    stateComparison: { bestState: string } | undefined,
    aidImpact: { aidReduction: number; net529Benefit: number; recommendation: string } | undefined,
    _strategy: FiveTwoNineOptimizerInput['strategy']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Total education costs: $${costs.totalCost.toFixed(0)}`);

    if (projections) {
      recommendations.push(`Projected 529 balance: $${projections.totalBalance.toFixed(0)}`);
      const totalShortfall = projections.perChildProjections.reduce((sum, child) => sum + child.shortfall, 0);
      if (totalShortfall > 0) {
        recommendations.push(
          `Shortfall: $${totalShortfall.toFixed(0)} - consider increasing contributions`
        );
      }
    }

    if (stateComparison) {
      recommendations.push(`Optimal state plan: ${stateComparison.bestState}`);
    }

    if (aidImpact) {
      recommendations.push(aidImpact.recommendation);
    }

    return recommendations;
  }
}

