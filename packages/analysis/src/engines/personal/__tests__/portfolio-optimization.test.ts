/**
 * Portfolio Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { PortfolioOptimizationInput } from '../../../schemas/portfolio-optimization.js';
import { PortfolioOptimizer } from '../portfolio-optimization.js';

describe('PortfolioOptimizer', () => {
  const baseInput: PortfolioOptimizationInput = {
    portfolio: {
      currentHoldings: [
        { symbol: 'AAPL', shares: 100, currentPrice: 150, assetClass: 'stock' },
        { symbol: 'BOND', shares: 200, currentPrice: 100, assetClass: 'bond' },
      ],
      totalValue: 35000,
    },
    constraints: {
      riskTolerance: 'moderate',
      minAllocation: 0,
      maxAllocation: 1,
    },
    marketData: {
      expectedReturns: [0.1, 0.05],
      volatilities: [0.2, 0.1],
    },
    analysis: {
      includeEfficientFrontier: true,
      includeRebalancing: false,
    },
  };

  it('should calculate current allocation', () => {
    const result = PortfolioOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.currentAllocation).toBeDefined();
    expect(Array.isArray(result.currentAllocation)).toBe(true);
  });

  it('should calculate portfolio metrics', () => {
    const result = PortfolioOptimizer.analyze(baseInput);
    expect(result.currentMetrics).toBeDefined();
    expect(result.currentMetrics.expectedReturn).toBeGreaterThanOrEqual(0);
    expect(result.currentMetrics.risk).toBeGreaterThanOrEqual(0);
  });

  it('should optimize allocation', () => {
    const result = PortfolioOptimizer.analyze(baseInput);
    expect(result.optimalAllocation).toBeDefined();
    expect(result.optimalAllocation.allocations.length).toBeGreaterThan(0);
  });

  it('should calculate efficient frontier when requested', () => {
    const result = PortfolioOptimizer.analyze(baseInput);
    expect(result.efficientFrontier).toBeDefined();
    expect(result.efficientFrontier?.points.length).toBeGreaterThan(0);
  });

  it('should return default metrics when expected returns are missing', () => {
    const result = PortfolioOptimizer.analyze({
      ...baseInput,
      marketData: {
        expectedReturns: [0.1],
        volatilities: [0.2],
      },
    });

    expect(result.currentMetrics.expectedReturn).toBeCloseTo(0.07, 5);
    expect(result.currentMetrics.risk).toBeCloseTo(0.15, 5);
  });

  it('should return zero allocations when total value is zero', () => {
    const result = PortfolioOptimizer.analyze({
      ...baseInput,
      portfolio: {
        ...baseInput.portfolio,
        totalValue: 0,
      },
    });

    expect(result.currentAllocation[0].allocation).toBe(0);
    expect(result.currentAllocation[1].allocation).toBe(0);
  });

  it('should include rebalancing trades when enabled', () => {
    const result = PortfolioOptimizer.analyze({
      ...baseInput,
      constraints: {
        ...baseInput.constraints,
        riskTolerance: 'aggressive',
        minAllocation: 0.1,
        maxAllocation: 0.9,
      },
      analysis: {
        includeEfficientFrontier: false,
        includeRebalancing: true,
      },
    });

    expect(result.rebalancing).toBeDefined();
    expect(result.rebalancing.rebalancingTrades.length).toBeGreaterThan(0);
    expect(result.rebalancing.rebalancingTrades.some((t: any) => t.action === 'Buy')).toBe(true);
    expect(result.rebalancing.rebalancingTrades.some((t: any) => t.action === 'Sell')).toBe(true);
    expect(result.efficientFrontier).toBeUndefined();
  });

  it('should include risk tolerance guidance in recommendations', () => {
    const result = PortfolioOptimizer.analyze({
      ...baseInput,
      constraints: {
        ...baseInput.constraints,
        riskTolerance: 'conservative',
      },
    });

    expect(result.recommendations.join(' ')).toContain('Conservative allocation');
  });
});
