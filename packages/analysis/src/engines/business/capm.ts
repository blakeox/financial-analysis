import { Decimal } from 'decimal.js';

import { CAPM_FORMULA_METADATA, type FormulaSemanticMetadata } from '../../formula-semantics.js';
import type { CAPMInput } from '../../schemas/capm.js';

export interface CAPMResult {
  // Optional for compatibility with legacy result fixtures; calculator output always supplies these fields.
  formulaVersion?: string;
  formulaMetadata?: FormulaSemanticMetadata;
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
      formulaVersion: CAPM_FORMULA_METADATA.formulaVersion,
      formulaMetadata: CAPM_FORMULA_METADATA,
      expectedReturn,
      riskFreeRate: input.riskFreeRate,
      beta: input.beta,
      marketRiskPremium: input.marketRiskPremium,
    };
  }
}
