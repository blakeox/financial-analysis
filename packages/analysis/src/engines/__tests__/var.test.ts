/**
 * VaR Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import { VaRInputSchema } from '../../schemas/var.js';
import { VaRCalculator } from '../var.js';

describe('VaRCalculator', () => {
  const baseInput = VaRInputSchema.parse({
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
  });

  it('should calculate VaR using historical method', () => {
    const result = VaRCalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.varResult).toBeDefined();
    expect(result.varResult.varValue).toBeGreaterThanOrEqual(0);
    expect(result.varResult.method).toBe('Historical Simulation');
  });

  it('should calculate VaR using parametric method', () => {
    const parametricInput = VaRInputSchema.parse({
      ...baseInput,
      parameters: { ...baseInput.parameters, method: 'parametric' },
      marketData: {
        volatilities: [0.15, 0.2],
      },
    });
    const result = VaRCalculator.analyze(parametricInput) as any;
    expect(result.varResult.method).toBe('Parametric (Variance-Covariance)');
  });

  it('should calculate VaR using Monte Carlo method', () => {
    const mcInput = VaRInputSchema.parse({
      ...baseInput,
      parameters: { ...baseInput.parameters, method: 'monte-carlo' },
      marketData: {
        volatilities: [0.15, 0.2],
      },
    });
    const result = VaRCalculator.analyze(mcInput) as any;
    expect(result.varResult.method).toBe('Monte Carlo Simulation');
  });

  it('should perform stress testing when requested', () => {
    const stressInput = VaRInputSchema.parse({
      ...baseInput,
      analysis: { ...baseInput.analysis, includeStressTesting: true },
    });
    const result = VaRCalculator.analyze(stressInput) as any;
    expect(result.stressTesting).toBeDefined();
    expect(result.stressTesting?.scenarios.length).toBeGreaterThan(0);
  });
});
