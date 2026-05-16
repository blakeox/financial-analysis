import type { MonteCarloInvestmentInput } from '../../schemas/monte-carlo-investment.js';

export interface MonteCarloInvestmentResult {
  initialValue: number;
  expectedReturn: number;
  volatility: number;
  years: number;
  simulations: number;
  stepsPerYear: number;
  endingValue: {
    mean: number;
    median: number;
    min: number;
    max: number;
    percentiles: Record<string, number>;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal01(rng: () => number): number {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return Number.NaN;
  const clamped = Math.min(1, Math.max(0, p));
  const idx = (sorted.length - 1) * clamped;
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low]!;
  const w = idx - low;
  return sorted[low]! * (1 - w) + sorted[high]! * w;
}

export class MonteCarloInvestmentSimulator {
  static analyze(input: MonteCarloInvestmentInput): MonteCarloInvestmentResult {
    const rng = mulberry32(input.seed);
    const totalSteps = Math.max(1, Math.round(input.years * input.stepsPerYear));
    const dt = input.years / totalSteps;
    const drift = (input.expectedReturn - 0.5 * input.volatility * input.volatility) * dt;
    const volStep = input.volatility * Math.sqrt(dt);

    const endingValues: number[] = new Array(input.simulations);
    for (let i = 0; i < input.simulations; i++) {
      let value = input.initialValue;
      for (let step = 0; step < totalSteps; step++) {
        const z = normal01(rng);
        value = value * Math.exp(drift + volStep * z);
      }
      endingValues[i] = value;
    }

    endingValues.sort((a, b) => a - b);

    const sum = endingValues.reduce((s, v) => s + v, 0);
    const mean = sum / endingValues.length;
    const median = percentile(endingValues, 0.5);
    const min = endingValues[0] ?? 0;
    const max = endingValues[endingValues.length - 1] ?? 0;

    const percentiles: Record<string, number> = {};
    for (const p of input.percentiles) {
      percentiles[String(p)] = percentile(endingValues, p);
    }

    return {
      initialValue: input.initialValue,
      expectedReturn: input.expectedReturn,
      volatility: input.volatility,
      years: input.years,
      simulations: input.simulations,
      stepsPerYear: input.stepsPerYear,
      endingValue: {
        mean,
        median,
        min,
        max,
        percentiles,
      },
    };
  }
}
