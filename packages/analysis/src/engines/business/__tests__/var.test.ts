/**
 * VaR Calculator Tests
 */

import { describe, expect, it, vi } from 'vitest';
import type { VaRInput } from '../../../schemas/var.js';
import { VaRCalculator } from '../var.js';

describe('VaRCalculator', () => {
  const baseInput: VaRInput = {
    portfolio: {
      positions: [
        { symbol: 'AAPL', quantity: 100, currentPrice: 150, assetClass: 'stock' },
        { symbol: 'GOOGL', quantity: 50, currentPrice: 200, assetClass: 'stock' },
      ],
      totalValue: 25000,
    },
    parameters: {
      confidenceLevel: 0.95,
      timeHorizon: 1,
      method: 'historical',
    },
    marketData: {
      historicalReturns: [-0.02, 0.01, -0.03, 0.02, -0.01, 0.03, -0.02, 0.01],
    },
    analysis: {
      includeStressTesting: false,
      includeBacktesting: false,
    },
  };

  it('should calculate VaR using historical method', () => {
    const result = VaRCalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.varResult).toBeDefined();
    expect(result.varResult.varValue).toBeGreaterThanOrEqual(0);
    expect(result.varResult.method).toBe('Historical Simulation');
  });

  it('should calculate VaR using parametric method', () => {
    const parametricInput: VaRInput = {
      ...baseInput,
      parameters: { ...baseInput.parameters, method: 'parametric' },
      marketData: {
        volatilities: [0.15, 0.2],
      },
    };
    const result = VaRCalculator.analyze(parametricInput) as any;
    expect(result.varResult.method).toBe('Parametric (Variance-Covariance)');
  });

  it('should calculate VaR using Monte Carlo method', () => {
    const mcInput: VaRInput = {
      ...baseInput,
      parameters: { ...baseInput.parameters, method: 'monte-carlo' },
      marketData: {
        volatilities: [0.15, 0.2],
      },
    };
    const result = VaRCalculator.analyze(mcInput) as any;
    expect(result.varResult.method).toBe('Monte Carlo Simulation');
  });

  it('should perform stress testing when requested', () => {
    const stressInput: VaRInput = {
      ...baseInput,
      analysis: { ...baseInput.analysis, includeStressTesting: true },
    };
    const result = VaRCalculator.analyze(stressInput) as any;
    expect(result.stressTesting).toBeDefined();
    expect(result.stressTesting?.scenarios.length).toBeGreaterThan(0);
    expect(result.recommendations.some((rec: string) => rec.includes('Maximum stress VaR'))).toBe(
      true
    );
  });

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = VaRCalculator.analyze(baseInput) as any;

    // Check summary
    expect(result.summary).toBeDefined();
    expect(result.summary.confidenceLevel).toBe(baseInput.parameters.confidenceLevel);

    // Check recommendations
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.recommendations[0]).toBe('string');
  });

  it('falls back to Monte Carlo when historical returns are missing', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const input: VaRInput = {
      ...baseInput,
      parameters: { ...baseInput.parameters, method: 'historical' },
      marketData: {},
    };
    const result = VaRCalculator.analyze(input) as any;
    expect(result.varResult.method).toBe('Monte Carlo Simulation');
    expect(result.varResult.varValue).toBeGreaterThan(0);
    randomSpy.mockRestore();
  });

  it('uses default volatility and 99% z-score in parametric VaR', () => {
    const input: VaRInput = {
      ...baseInput,
      parameters: {
        ...baseInput.parameters,
        method: 'parametric',
        confidenceLevel: 0.99,
        timeHorizon: 252,
      },
      marketData: { volatilities: [] },
    };

    const result = VaRCalculator.analyze(input) as any;
    expect(result.varResult.varValue).toBeCloseTo(25000 * 0.15 * 2.33, 2);
  });

  it('uses fallback z-score for non-95/99 confidence', () => {
    const input: VaRInput = {
      ...baseInput,
      parameters: {
        ...baseInput.parameters,
        method: 'parametric',
        confidenceLevel: 0.9,
        timeHorizon: 252,
      },
      marketData: { volatilities: [0.1] },
    };

    const result = VaRCalculator.analyze(input) as any;
    expect(result.varResult.varValue).toBeCloseTo(25000 * 0.1 * 1.96, 2);
  });

  it('handles backtesting with empty historical returns', () => {
    const input: VaRInput = {
      ...baseInput,
      analysis: { ...baseInput.analysis, includeBacktesting: true },
      marketData: { historicalReturns: [] },
    };

    const result = VaRCalculator.analyze(input) as any;
    expect(result.backtesting).toBeDefined();
    expect(result.backtesting.violationRate).toBe(0);
    expect(result.backtesting.backtestResult).toBe('VaR model appears accurate');
  });

  it('flags recalibration when backtesting violations exceed expectations', () => {
    const input: VaRInput = {
      ...baseInput,
      parameters: { ...baseInput.parameters, method: 'parametric' },
      analysis: { ...baseInput.analysis, includeBacktesting: true },
      marketData: {
        historicalReturns: [
          -0.02, -0.018, -0.017, -0.016, -0.015, -0.014, -0.013, -0.012, -0.011, -0.01, -0.009,
          -0.008, -0.007, -0.006, -0.005, -0.004, -0.003, -0.002, -0.001, 0.001,
        ],
        volatilities: [0.01],
      },
    };

    const result = VaRCalculator.analyze(input) as any;
    expect(result.backtesting.violations).toBeGreaterThan(2);
    expect(result.backtesting.backtestResult).toBe(
      'VaR model may underestimate risk - consider recalibration'
    );
  });
});
