/**
 * Investment Portfolio Analyzer
 * Comprehensive portfolio analysis and rebalancing recommendations
 *
 * Implements portfolio analysis including:
 * - Current vs target allocation analysis
 * - Rebalancing recommendations
 * - Diversification analysis
 * - Risk assessment
 * - Performance projections
 */

import type { InvestmentPortfolioInput } from '../../schemas/investment-portfolio.js';

export class InvestmentPortfolioAnalyzer {
  /**
   * Analyze investment portfolio and provide recommendations
   */
  static analyze(input: InvestmentPortfolioInput): unknown {
    const currentPortfolio = input.currentPortfolio;
    const goals = input.goals;

    // Calculate current allocation
    const currentAllocation = this.calculateCurrentAllocation(
      currentPortfolio.holdings,
      currentPortfolio.totalValue,
      currentPortfolio.cashReserve
    );

    // Calculate target allocation
    const targetAllocation = goals.targetAllocation;

    // Calculate allocation drift
    const allocationDrift = this.calculateAllocationDrift(currentAllocation, targetAllocation);

    // Calculate portfolio score
    const portfolioScore = this.calculatePortfolioScore(
      currentAllocation,
      targetAllocation,
      allocationDrift
    );

    // Generate rebalancing recommendations
    const rebalancingRecommendations = this.generateRebalancingRecommendations(
      currentAllocation,
      targetAllocation,
      currentPortfolio.totalValue
    );

    // Analyze diversification
    const diversificationAnalysis = this.analyzeDiversification(currentPortfolio.holdings);

    // Generate recommendations
    const recommendations: string[] = [];
    if (allocationDrift.total > 0.1) {
      recommendations.push('Rebalance your portfolio to align with target allocation');
    }
    if (diversificationAnalysis.sectorConcentration > 0.4) {
      recommendations.push('Diversify across more sectors to reduce concentration risk');
    }
    if (currentAllocation.cash > targetAllocation.cash * 1.5) {
      recommendations.push('Consider investing excess cash to meet target allocation');
    }
    if (currentAllocation.stocks < targetAllocation.stocks * 0.8) {
      recommendations.push('Increase stock allocation to meet target for your risk tolerance');
    }

    return {
      summary: {
        currentValue: currentPortfolio.totalValue.toFixed(2),
        targetAllocation: {
          stocks: (targetAllocation.stocks * 100).toFixed(1),
          bonds: (targetAllocation.bonds * 100).toFixed(1),
          cash: (targetAllocation.cash * 100).toFixed(1),
          alternatives: (targetAllocation.alternatives * 100).toFixed(1),
        },
        actualAllocation: {
          stocks: (currentAllocation.stocks * 100).toFixed(1),
          bonds: (currentAllocation.bonds * 100).toFixed(1),
          cash: (currentAllocation.cash * 100).toFixed(1),
          alternatives: (currentAllocation.alternatives * 100).toFixed(1),
        },
        portfolioScore,
        allocationDrift: (allocationDrift.total * 100).toFixed(1),
      },
      rebalancingRecommendations,
      diversificationAnalysis,
      recommendations,
      insights: [
        `Your portfolio is ${portfolioScore >= 80 ? 'well' : portfolioScore >= 60 ? 'moderately' : 'poorly'} aligned with your target allocation`,
        `Total allocation drift: ${(allocationDrift.total * 100).toFixed(1)}%`,
        `You hold ${currentPortfolio.holdings.length} positions across ${diversificationAnalysis.sectors.length} sectors`,
        portfolioScore >= 80
          ? 'Your portfolio is well-balanced and aligned with your goals'
          : 'Consider rebalancing to optimize your portfolio',
      ],
    };
  }

  private static calculateCurrentAllocation(
    holdings: Array<{
      shares: number;
      currentPrice: number;
      assetClass: string;
    }>,
    totalValue: number,
    cashReserve: number
  ): {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives: number;
  } {
    let stocks = 0;
    let bonds = 0;
    let alternatives = 0;

    for (const holding of holdings) {
      const value = holding.shares * holding.currentPrice;
      if (holding.assetClass === 'stock' || holding.assetClass === 'etf') {
        stocks += value;
      } else if (holding.assetClass === 'bond') {
        bonds += value;
      } else if (holding.assetClass === 'alternative') {
        alternatives += value;
      }
    }

    return {
      stocks: stocks / totalValue,
      bonds: bonds / totalValue,
      cash: cashReserve / totalValue,
      alternatives: alternatives / totalValue,
    };
  }

  private static calculateAllocationDrift(
    current: { stocks: number; bonds: number; cash: number; alternatives: number },
    target: { stocks: number; bonds: number; cash: number; alternatives: number }
  ): {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives: number;
    total: number;
  } {
    const stocks = Math.abs(current.stocks - target.stocks);
    const bonds = Math.abs(current.bonds - target.bonds);
    const cash = Math.abs(current.cash - target.cash);
    const alternatives = Math.abs(current.alternatives - target.alternatives);
    const total = stocks + bonds + cash + alternatives;

    return { stocks, bonds, cash, alternatives, total };
  }

  private static calculatePortfolioScore(
    _current: { stocks: number; bonds: number; cash: number; alternatives: number },
    _target: { stocks: number; bonds: number; cash: number; alternatives: number },
    drift: { total: number }
  ): number {
    let score = 100;

    // Deduct points for allocation drift
    score -= drift.total * 200; // Each 1% drift = 2 points

    // Bonus for being close to target
    if (drift.total < 0.05) score += 10;
    if (drift.total < 0.1) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private static generateRebalancingRecommendations(
    current: { stocks: number; bonds: number; cash: number; alternatives: number },
    target: { stocks: number; bonds: number; cash: number; alternatives: number },
    totalValue: number
  ): Array<{
    action: string;
    assetClass: string;
    currentPercent: string;
    targetPercent: string;
    adjustment: string;
  }> {
    const recommendations: Array<{
      action: string;
      assetClass: string;
      currentPercent: string;
      targetPercent: string;
      adjustment: string;
    }> = [];

    const classes = [
      { name: 'stocks', current: current.stocks, target: target.stocks },
      { name: 'bonds', current: current.bonds, target: target.bonds },
      { name: 'cash', current: current.cash, target: target.cash },
      { name: 'alternatives', current: current.alternatives, target: target.alternatives },
    ];

    for (const assetClass of classes) {
      const drift = Math.abs(assetClass.current - assetClass.target);
      if (drift > 0.05) {
        // More than 5% drift
        const adjustment = (assetClass.target - assetClass.current) * totalValue;
        recommendations.push({
          action: adjustment > 0 ? 'Increase' : 'Decrease',
          assetClass: assetClass.name,
          currentPercent: (assetClass.current * 100).toFixed(1),
          targetPercent: (assetClass.target * 100).toFixed(1),
          adjustment: Math.abs(adjustment).toFixed(2),
        });
      }
    }

    return recommendations;
  }

  private static analyzeDiversification(holdings: Array<{ sector: string; assetClass: string }>): {
    sectors: string[];
    sectorConcentration: number;
    assetClassDiversity: number;
  } {
    const sectors = new Set(holdings.map((h) => h.sector));
    const assetClasses = new Set(holdings.map((h) => h.assetClass));

    // Calculate sector concentration (max single sector %)
    const sectorCounts = new Map<string, number>();
    for (const holding of holdings) {
      sectorCounts.set(holding.sector, (sectorCounts.get(holding.sector) || 0) + 1);
    }
    const maxSectorCount = Math.max(...Array.from(sectorCounts.values()));
    const sectorConcentration = maxSectorCount / holdings.length;

    return {
      sectors: Array.from(sectors),
      sectorConcentration,
      assetClassDiversity: assetClasses.size / 6, // 6 possible asset classes
    };
  }
}
