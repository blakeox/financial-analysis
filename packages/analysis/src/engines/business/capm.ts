import { Decimal } from 'decimal.js';

import type { CAPMInput } from '../../schemas/capm.js';

export interface CAPMResult {
  expectedReturn: number;
  riskFreeRate: number;
  beta: number;
  marketRiskPremium: number;
}

export class CAPMCalculator {
  static analyze(input: CAPMInput): CAPMResult {
    const expectedReturn = new Decimal(input.riskFreeRate)
      .plus(new Decimal(input.beta).times(input.marketRiskPremium))
      .toNumber();

    return {
      expectedReturn,
      riskFreeRate: input.riskFreeRate,
      beta: input.beta,
      marketRiskPremium: input.marketRiskPremium,
    };
  }
}
