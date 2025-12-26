import { Decimal } from 'decimal.js';

import type { CarbonCreditValuationInput } from '../schemas/carbon-credit.js';

export interface CarbonCreditValuationResult {
  tonnesCO2e: number;
  pricePerTonne: number;
  yearsUntilSale: number;
  futurePricePerTonne: number;
  spotValue: number;
  futureValue: number;
  presentValue: number;
  discountRate: number;
  priceGrowthRate: number;
}

export class CarbonCreditValuationCalculator {
  static analyze(input: CarbonCreditValuationInput): CarbonCreditValuationResult {
    const spotValue = new Decimal(input.tonnesCO2e).times(input.pricePerTonne).toNumber();

    const futurePricePerTonne = new Decimal(input.pricePerTonne)
      .times(new Decimal(1).plus(input.priceGrowthRate).pow(input.yearsUntilSale))
      .toNumber();

    const futureValue = new Decimal(input.tonnesCO2e).times(futurePricePerTonne).toNumber();

    const discountFactor = new Decimal(1).plus(input.discountRate).pow(input.yearsUntilSale);
    const presentValue = discountFactor.gt(0) ? new Decimal(futureValue).div(discountFactor).toNumber() : Number.NaN;

    return {
      tonnesCO2e: input.tonnesCO2e,
      pricePerTonne: input.pricePerTonne,
      yearsUntilSale: input.yearsUntilSale,
      futurePricePerTonne,
      spotValue,
      futureValue,
      presentValue,
      discountRate: input.discountRate,
      priceGrowthRate: input.priceGrowthRate,
    };
  }
}

