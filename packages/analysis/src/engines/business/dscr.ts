/**
 * Debt Service Coverage Ratio (DSCR) Calculator
 * Standalone model for calculating and analyzing DSCR
 */

import type { DSCRInput } from '../../schemas/dscr.js';

export class DSCRCalculator {
  static analyze(input: DSCRInput): unknown {
    const totalDebtService =
      input.annualDebtService + (input.newLoanPayment ? input.newLoanPayment * 12 : 0);
    const ratio = totalDebtService > 0 ? input.ebitda / totalDebtService : 999;

    let status: string;
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
