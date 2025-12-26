/**
 * Portfolio Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { PortfolioOptimizationInput } from '../../schemas/portfolio-optimization.js';
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
});
