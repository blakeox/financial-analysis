import { Decimal } from 'decimal.js';

import {
  BREAK_EVEN_FORMULA_METADATA,
  type FormulaSemanticMetadata,
} from '../../formula-semantics.js';
import type { BreakEvenInput } from '../../schemas/break-even.js';

export interface BreakEvenResult {
  // Optional for compatibility with legacy result fixtures; analyzer output always supplies these fields.
  formulaVersion?: string;
  formulaMetadata?: FormulaSemanticMetadata;
  breakEvenPossible: boolean;
  contributionMarginPerUnit: number;
  contributionMarginRatio: number;
  breakEvenUnits: number | null;
  breakEvenRevenue: number | null;
  fixedCosts: number;
  variableCostPerUnit: number;
  pricePerUnit: number;
  targetProfit: number;
  reason?: string | undefined;
}

export class BreakEvenAnalyzer {
  static analyze(input: BreakEvenInput): BreakEvenResult {
    const cmPerUnit = new Decimal(input.pricePerUnit).minus(input.variableCostPerUnit).toNumber();
    const cmRatio =
      input.pricePerUnit > 0 ? new Decimal(cmPerUnit).div(input.pricePerUnit).toNumber() : 0;

    if (cmPerUnit <= 0) {
      return {
        formulaVersion: BREAK_EVEN_FORMULA_METADATA.formulaVersion,
        formulaMetadata: BREAK_EVEN_FORMULA_METADATA,
        breakEvenPossible: false,
        contributionMarginPerUnit: cmPerUnit,
        contributionMarginRatio: cmRatio,
        breakEvenUnits: null,
        breakEvenRevenue: null,
        fixedCosts: input.fixedCosts,
        variableCostPerUnit: input.variableCostPerUnit,
        pricePerUnit: input.pricePerUnit,
        targetProfit: input.targetProfit,
        reason: 'Price per unit must exceed variable cost per unit to break even',
      };
    }

    const requiredContribution = new Decimal(input.fixedCosts).plus(input.targetProfit);
    const breakEvenUnits = requiredContribution.div(cmPerUnit).toNumber();
    const breakEvenRevenue = new Decimal(breakEvenUnits).times(input.pricePerUnit).toNumber();

    return {
      formulaVersion: BREAK_EVEN_FORMULA_METADATA.formulaVersion,
      formulaMetadata: BREAK_EVEN_FORMULA_METADATA,
      breakEvenPossible: true,
      contributionMarginPerUnit: cmPerUnit,
      contributionMarginRatio: cmRatio,
      breakEvenUnits,
      breakEvenRevenue,
      fixedCosts: input.fixedCosts,
      variableCostPerUnit: input.variableCostPerUnit,
      pricePerUnit: input.pricePerUnit,
      targetProfit: input.targetProfit,
    };
  }
}
