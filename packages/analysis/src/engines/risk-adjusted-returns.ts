import { Decimal } from 'decimal.js';

import type { RiskAdjustedReturnsInput } from '../schemas/risk-adjusted-returns.js';

export interface RiskAdjustedReturnsResult {
  averageReturn: number;
  annualizedReturn: number;
  volatility: number;
  annualizedVolatility: number;
  downsideDeviation: number;
  annualizedDownsideDeviation: number;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function computeDownsideDeviation(values: number[], targetReturn: number): number {
  if (values.length === 0) return 0;
  const downside = values.map((r) => Math.min(0, r - targetReturn));
  const meanSquared = downside.reduce((sum, d) => sum + d * d, 0) / downside.length;
  return Math.sqrt(meanSquared);
}

export class RiskAdjustedReturnsCalculator {
  static analyze(input: RiskAdjustedReturnsInput): RiskAdjustedReturnsResult {
    const { returns, riskFreeRate, targetReturn, periodsPerYear } = input;

    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const excessReturns = returns.map((r) => new Decimal(r).minus(riskFreeRate).toNumber());
    const excessAverage = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;

    const volatility = stdDev(returns);
    const downsideDeviation = computeDownsideDeviation(returns, targetReturn);

    const annualizedReturn = new Decimal(averageReturn).times(periodsPerYear).toNumber();
    const annualizedVolatility = volatility * Math.sqrt(periodsPerYear);
    const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(periodsPerYear);

    const annualizedExcessReturn = new Decimal(excessAverage).times(periodsPerYear).toNumber();

    const sharpeRatio =
      annualizedVolatility > 0 ? annualizedExcessReturn / annualizedVolatility : null;
    const sortinoRatio =
      annualizedDownsideDeviation > 0 ? annualizedExcessReturn / annualizedDownsideDeviation : null;

    return {
      averageReturn,
      annualizedReturn,
      volatility,
      annualizedVolatility,
      downsideDeviation,
      annualizedDownsideDeviation,
      sharpeRatio,
      sortinoRatio,
    };
  }
}
