import { Decimal } from 'decimal.js';

import type { NPVIRRInput } from '../../schemas/npv-irr.js';

export interface NPVIRRResult {
  npv: number;
  irr: number | null;
  paybackPeriod: number | null;
  discountRate: number;
  cashFlows: number[];
  sensitivity?: Array<{ discountRate: number; npv: number }> | undefined;
}

function npv(cashFlows: number[], discountRate: number): number {
  const onePlusR = new Decimal(1).plus(discountRate);
  if (onePlusR.lte(0)) return Number.NaN;
  return cashFlows.reduce((sum, cf, t) => {
    const pv = new Decimal(cf).div(onePlusR.pow(t));
    return sum.plus(pv);
  }, new Decimal(0)).toNumber();
}

function tryComputePaybackPeriod(cashFlows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t] ?? 0;
    const prev = cumulative;
    cumulative += cf;
    if (t > 0 && prev < 0 && cumulative >= 0) {
      const fraction = cf !== 0 ? Math.abs(prev) / Math.abs(cf) : 0;
      return (t - 1) + fraction;
    }
  }
  return null;
}

function irr(cashFlows: number[]): number | null {
  const minRate = -0.999;
  const maxRate = 10;
  const steps = 200;

  const scanRates: number[] = [];
  for (let i = 0; i <= steps; i++) {
    scanRates.push(minRate + (i / steps) * (maxRate - minRate));
  }

  let prevRate = scanRates[0]!;
  let prevNPV = npv(cashFlows, prevRate);
  for (let i = 1; i < scanRates.length; i++) {
    const rate = scanRates[i]!;
    const val = npv(cashFlows, rate);
    if (Number.isFinite(prevNPV) && Number.isFinite(val) && prevNPV === 0) return prevRate;
    if (Number.isFinite(prevNPV) && Number.isFinite(val) && prevNPV * val < 0) {
      let low = prevRate;
      let high = rate;
      let lowVal = prevNPV;
      for (let iter = 0; iter < 100; iter++) {
        const mid = (low + high) / 2;
        const midVal = npv(cashFlows, mid);
        if (!Number.isFinite(midVal)) return null;
        if (Math.abs(midVal) < 1e-10) return mid;
        if (lowVal * midVal < 0) {
          high = mid;
        } else {
          low = mid;
        }
        if (Math.abs(high - low) < 1e-12) return (high + low) / 2;
      }
      return (high + low) / 2;
    }
    prevRate = rate;
    prevNPV = val;
  }

  return null;
}

export class NPVIRRCalculator {
  static analyze(input: NPVIRRInput): NPVIRRResult {
    const baseNPV = npv(input.cashFlows, input.discountRate);
    const baseIRR = irr(input.cashFlows);
    const paybackPeriod = tryComputePaybackPeriod(input.cashFlows);

    const sensitivity = input.sensitivityDiscountRates
      ? input.sensitivityDiscountRates.map((r) => ({
          discountRate: r,
          npv: npv(input.cashFlows, r),
        }))
      : undefined;

    return {
      npv: baseNPV,
      irr: baseIRR,
      paybackPeriod,
      discountRate: input.discountRate,
      cashFlows: input.cashFlows,
      sensitivity,
    };
  }
}

