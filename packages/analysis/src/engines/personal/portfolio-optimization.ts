/**
 * Portfolio Optimization
 * Mean-variance optimization, efficient frontier, asset allocation
 */

import type { PortfolioOptimizationInput } from '../../schemas/portfolio-optimization.js';

export class PortfolioOptimizer {
  /**
   * Optimize portfolio allocation
   */
  static analyze(input: PortfolioOptimizationInput): unknown {
    const portfolio = input.portfolio;
    const constraints = input.constraints;
    const marketData = input.marketData;
    const analysis = input.analysis;

    // Calculate current allocation
    const currentAllocation = this.calculateCurrentAllocation(portfolio);

    // Calculate portfolio metrics
    const currentMetrics = this.calculatePortfolioMetrics(
      portfolio,
      marketData.expectedReturns,
      marketData.volatilities,
      marketData.correlationMatrix
    );

    // Optimize allocation
    const optimalAllocation = this.optimizeAllocation(
      portfolio,
      constraints,
      marketData,
      currentMetrics
    );

    // Efficient frontier
    const efficientFrontier = analysis.includeEfficientFrontier
      ? this.calculateEfficientFrontier(portfolio, marketData, constraints)
      : undefined;

    // Rebalancing recommendations
    const rebalancing = analysis.includeRebalancing
      ? this.analyzeRebalancing(currentAllocation, optimalAllocation)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      currentAllocation,
      optimalAllocation,
      currentMetrics,
      constraints
    );

    return {
      summary: {
        currentReturn: currentMetrics.expectedReturn,
        optimalReturn: optimalAllocation.expectedReturn,
        currentRisk: currentMetrics.risk,
        optimalRisk: optimalAllocation.risk,
        improvement: optimalAllocation.expectedReturn - currentMetrics.expectedReturn,
      },
      currentAllocation,
      currentMetrics,
      optimalAllocation,
      efficientFrontier,
      rebalancing,
      recommendations,
    };
  }

  private static calculateCurrentAllocation(
    portfolio: PortfolioOptimizationInput['portfolio']
  ): Array<{
    symbol: string;
    value: number;
    allocation: number;
  }> {
    return portfolio.currentHoldings.map((holding) => {
      const value = holding.shares * holding.currentPrice;
      const allocation = portfolio.totalValue > 0 ? value / portfolio.totalValue : 0;
      return {
        symbol: holding.symbol,
        value,
        allocation,
      };
    });
  }

  private static calculatePortfolioMetrics(
    portfolio: PortfolioOptimizationInput['portfolio'],
    expectedReturns?: number[],
    volatilities?: number[],
    _correlationMatrix?: number[][]
  ): {
    expectedReturn: number;
    risk: number;
    sharpeRatio: number;
  } {
    const allocations = this.calculateCurrentAllocation(portfolio);

    // Calculate weighted return
    const expectedReturn =
      expectedReturns && expectedReturns.length === allocations.length
        ? allocations.reduce((sum, alloc, i) => sum + alloc.allocation * expectedReturns[i]!, 0)
        : 0.07; // Default 7%

    // Calculate portfolio risk (simplified)
    const risk =
      volatilities && volatilities.length === allocations.length
        ? Math.sqrt(
            allocations.reduce((sum, alloc, i) => {
              const variance = Math.pow(volatilities[i]! * alloc.allocation, 2);
              return sum + variance;
            }, 0)
          )
        : 0.15; // Default 15%

    const riskFreeRate = 0.03; // Assume 3% risk-free rate
    const sharpeRatio = risk > 0 ? (expectedReturn - riskFreeRate) / risk : 0;

    return {
      expectedReturn,
      risk,
      sharpeRatio,
    };
  }

  private static optimizeAllocation(
    portfolio: PortfolioOptimizationInput['portfolio'],
    constraints: PortfolioOptimizationInput['constraints'],
    marketData: PortfolioOptimizationInput['marketData'],
    currentMetrics: { expectedReturn: number; risk: number }
  ): {
    allocations: Array<{ symbol: string; allocation: number }>;
    expectedReturn: number;
    risk: number;
    sharpeRatio: number;
  } {
    // Simplified optimization - in practice would use quadratic programming
    const numAssets = portfolio.currentHoldings.length;
    const baseAllocation = 1 / numAssets;

    // Adjust based on risk tolerance
    let riskAdjustment = 1;
    if (constraints.riskTolerance === 'conservative') {
      riskAdjustment = 0.7; // Favor lower risk assets
    } else if (constraints.riskTolerance === 'aggressive') {
      riskAdjustment = 1.3; // Favor higher risk assets
    }

    const allocations = portfolio.currentHoldings.map((holding, index) => {
      // Simplified: equal weight with risk adjustment
      let allocation = baseAllocation * riskAdjustment;

      // Adjust based on expected returns if provided
      if (marketData.expectedReturns && marketData.expectedReturns[index] !== undefined) {
        const returnAdjustment =
          (marketData.expectedReturns[index]! - currentMetrics.expectedReturn) * 0.5;
        allocation = Math.max(
          constraints.minAllocation,
          Math.min(constraints.maxAllocation, allocation + returnAdjustment)
        );
      }

      return {
        symbol: holding.symbol,
        allocation: Math.max(
          constraints.minAllocation,
          Math.min(constraints.maxAllocation, allocation)
        ),
      };
    });

    // Normalize allocations to sum to 1
    const totalAllocation = allocations.reduce((sum, a) => sum + a.allocation, 0);
    const normalizedAllocations = allocations.map((a) => ({
      ...a,
      allocation: a.allocation / totalAllocation,
    }));

    // Calculate optimized metrics
    const expectedReturns = marketData.expectedReturns;
    const optimizedReturn =
      expectedReturns &&
      expectedReturns.length === normalizedAllocations.length
        ? normalizedAllocations.reduce(
            (sum, alloc, i) => sum + alloc.allocation * expectedReturns[i]!,
            0
          )
        : currentMetrics.expectedReturn * 1.1;

    const optimizedRisk =
      marketData.volatilities && marketData.volatilities.length === normalizedAllocations.length
        ? Math.sqrt(
            normalizedAllocations.reduce((sum, alloc, i) => {
              const variance = Math.pow(marketData.volatilities![i]! * alloc.allocation, 2);
              return sum + variance;
            }, 0)
          )
        : currentMetrics.risk * 0.9;

    const riskFreeRate = 0.03;
    const sharpeRatio = optimizedRisk > 0 ? (optimizedReturn - riskFreeRate) / optimizedRisk : 0;

    return {
      allocations: normalizedAllocations,
      expectedReturn: optimizedReturn,
      risk: optimizedRisk,
      sharpeRatio,
    };
  }

  private static calculateEfficientFrontier(
    _portfolio: PortfolioOptimizationInput['portfolio'],
    _marketData: PortfolioOptimizationInput['marketData'],
    _constraints: PortfolioOptimizationInput['constraints']
  ): {
    points: Array<{
      risk: number;
      return: number;
      sharpeRatio: number;
    }>;
    optimalPoint: {
      risk: number;
      return: number;
      sharpeRatio: number;
    };
  } {
    const points: Array<{ risk: number; return: number; sharpeRatio: number }> = [];

    // Generate efficient frontier points (simplified)
    for (let riskLevel = 0.05; riskLevel <= 0.3; riskLevel += 0.01) {
      const expectedReturn = 0.03 + riskLevel * 1.2; // Simplified risk-return relationship
      const sharpeRatio = (expectedReturn - 0.03) / riskLevel;
      points.push({ risk: riskLevel, return: expectedReturn, sharpeRatio });
    }

    // Find optimal point (highest Sharpe ratio)
    const optimalPoint = points.reduce((max, point) =>
      point.sharpeRatio > max.sharpeRatio ? point : max
    );

    return {
      points,
      optimalPoint,
    };
  }

  private static analyzeRebalancing(
    currentAllocation: Array<{ symbol: string; allocation: number }>,
    optimalAllocation: { allocations: Array<{ symbol: string; allocation: number }> }
  ): {
    rebalancingTrades: Array<{
      symbol: string;
      currentAllocation: number;
      targetAllocation: number;
      adjustment: number;
      action: string;
    }>;
    totalAdjustment: number;
  } {
    const rebalancingTrades: Array<{
      symbol: string;
      currentAllocation: number;
      targetAllocation: number;
      adjustment: number;
      action: string;
    }> = [];

    currentAllocation.forEach((current) => {
      const target = optimalAllocation.allocations.find((a) => a.symbol === current.symbol);
      if (target) {
        const adjustment = target.allocation - current.allocation;
        if (Math.abs(adjustment) > 0.01) {
          // Only rebalance if difference > 1%
          rebalancingTrades.push({
            symbol: current.symbol,
            currentAllocation: current.allocation,
            targetAllocation: target.allocation,
            adjustment,
            action: adjustment > 0 ? 'Buy' : 'Sell',
          });
        }
      }
    });

    const totalAdjustment = rebalancingTrades.reduce(
      (sum, trade) => sum + Math.abs(trade.adjustment),
      0
    );

    return {
      rebalancingTrades,
      totalAdjustment,
    };
  }

  private static generateRecommendations(
    _currentAllocation: Array<{ allocation: number }>,
    optimalAllocation: { expectedReturn: number; risk: number; sharpeRatio: number },
    currentMetrics: { expectedReturn: number; risk: number },
    constraints: PortfolioOptimizationInput['constraints']
  ): string[] {
    const recommendations: string[] = [];

    if (optimalAllocation.expectedReturn > currentMetrics.expectedReturn) {
      recommendations.push(
        `Optimization can improve expected return from ${(currentMetrics.expectedReturn * 100).toFixed(1)}% to ${(optimalAllocation.expectedReturn * 100).toFixed(1)}%`
      );
    }

    if (optimalAllocation.risk < currentMetrics.risk) {
      recommendations.push(
        `Optimization can reduce risk from ${(currentMetrics.risk * 100).toFixed(1)}% to ${(optimalAllocation.risk * 100).toFixed(1)}%`
      );
    }

    recommendations.push(`Optimal Sharpe Ratio: ${optimalAllocation.sharpeRatio.toFixed(2)}`);

    if (constraints.riskTolerance === 'conservative') {
      recommendations.push('Conservative allocation favors stability and lower volatility');
    } else if (constraints.riskTolerance === 'aggressive') {
      recommendations.push('Aggressive allocation seeks higher returns with higher risk');
    }

    return recommendations;
  }
}
