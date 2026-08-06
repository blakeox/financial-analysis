/**
 * Debt Service Coverage Ratio (DSCR) Calculator
 * Standalone model for calculating and analyzing DSCR
 */

import { DSCR_FORMULA_METADATA, type FormulaSemanticMetadata } from '../../formula-semantics.js';
import type { DSCRInput } from '../../schemas/dscr.js';

export interface DSCRResult {
  // Optional for compatibility with legacy result fixtures; calculator output always supplies these fields.
  formulaVersion?: string;
  formulaMetadata?: FormulaSemanticMetadata;
  ratio: number;
  status: 'excellent' | 'good' | 'marginal' | 'poor';
  interpretation: string;
  recommendations: string[];
  breakdown: {
    ebitda: number;
    existingDebtService: number;
    newLoanDebtService: number;
    totalDebtService: number;
  };
  targetRatio: number;
  margin: number;
}

export class DSCRCalculator {
  static analyze(input: DSCRInput): DSCRResult {
    const totalDebtService =
      input.annualDebtService + (input.newLoanPayment ? input.newLoanPayment * 12 : 0);
    const ratio = totalDebtService > 0 ? input.ebitda / totalDebtService : 999;

    let status: DSCRResult['status'];
    let interpretation: string;
    const recommendations: string[] = [];

    if (ratio >= 1.5) {
      status = 'excellent';
      interpretation = 'Strong debt service coverage - low risk';
      recommendations.push('Excellent DSCR - you have strong capacity for additional debt');
    } else if (ratio >= 1.25) {
      status = 'good';
      interpretation = 'Adequate debt service coverage - acceptable risk';
      recommendations.push('Good DSCR - acceptable for most lenders');
    } else if (ratio >= 1.0) {
      status = 'marginal';
      interpretation = 'Minimal debt service coverage - higher risk';
      recommendations.push('Marginal DSCR - consider improving before taking on additional debt');
      recommendations.push('Target: Increase EBITDA or reduce debt service to reach 1.25x');
    } else {
      status = 'poor';
      interpretation = 'Insufficient debt service coverage - high risk';
      recommendations.push('Poor DSCR - business cannot service current debt levels');
      recommendations.push('Critical: Must improve EBITDA or reduce debt before expansion');
    }

    return {
      formulaVersion: DSCR_FORMULA_METADATA.formulaVersion,
      formulaMetadata: DSCR_FORMULA_METADATA,
      ratio,
      status,
      interpretation,
      recommendations,
      breakdown: {
        ebitda: input.ebitda,
        existingDebtService: input.existingDebtService,
        newLoanDebtService: input.newLoanPayment ? input.newLoanPayment * 12 : 0,
        totalDebtService,
      },
      targetRatio: 1.25,
      margin: ratio - 1.25,
    };
  }
}
