import { Decimal } from 'decimal.js';

import type { FXHedgingInput } from '../schemas/fx-hedging.js';

export interface FXHedgingResult {
  spotRate: number;
  forwardRate: number;
  hedgePoints: number;
  impliedCarry: number;
  tenorYears: number;
  unhedgedReturn?: number | undefined;
  hedgedReturn?: number | undefined;
}

export class FXHedgingAnalyzer {
  static analyze(input: FXHedgingInput): FXHedgingResult {
    const domesticFactor = new Decimal(1).plus(input.domesticRate).pow(input.tenorYears);
    const foreignFactor = new Decimal(1).plus(input.foreignRate).pow(input.tenorYears);
    const forwardRate = new Decimal(input.spotRate).times(domesticFactor).div(foreignFactor).toNumber();
    const hedgePoints = new Decimal(forwardRate).minus(input.spotRate).toNumber();
    const impliedCarry = new Decimal(forwardRate).div(input.spotRate).minus(1).toNumber();

    const base: FXHedgingResult = {
      spotRate: input.spotRate,
      forwardRate,
      hedgePoints,
      impliedCarry,
      tenorYears: input.tenorYears,
    };

    if (input.expectedSpotRateAtMaturity !== undefined && input.foreignAssetReturn !== undefined) {
      const unhedgedReturn = new Decimal(1)
        .plus(input.foreignAssetReturn)
        .times(new Decimal(input.expectedSpotRateAtMaturity).div(input.spotRate))
        .minus(1)
        .toNumber();

      const hedgedReturn = new Decimal(1)
        .plus(input.foreignAssetReturn)
        .times(new Decimal(forwardRate).div(input.spotRate))
        .minus(1)
        .toNumber();

      return { ...base, unhedgedReturn, hedgedReturn };
    }

    return base;
  }
}

