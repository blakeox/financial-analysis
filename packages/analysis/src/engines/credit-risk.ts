/**
 * Credit Risk Analysis
 * Probability of Default (PD), Loss Given Default (LGD), Expected Loss (EL)
 */

import type { CreditRiskInput } from '../schemas/credit-risk.js';

export class CreditRiskAnalyzer {
  /**
   * Analyze credit risk metrics
   */
  static analyze(input: CreditRiskInput): unknown {
    const financials = input.financials;
    const debtInfo = input.debtInfo;
    const analysis = input.analysis;

    // Calculate financial ratios
    const ratios = this.calculateRatios(financials);

    // Probability of Default (PD)
    const probabilityOfDefault = analysis.includePD
      ? this.calculatePD(ratios, input.borrowerInfo)
      : undefined;

    // Loss Given Default (LGD)
    const lossGivenDefault = analysis.includeLGD
      ? this.calculateLGD(debtInfo.recoveryRate)
      : undefined;

    // Expected Loss (EL = PD × LGD × EAD)
    const expectedLoss =
      analysis.includeEL && probabilityOfDefault && lossGivenDefault
        ? this.calculateEL(
            probabilityOfDefault.pd,
            lossGivenDefault.lgd,
            debtInfo.exposureAtDefault
          )
        : undefined;

    // Credit rating assessment
    const creditRating = this.assessCreditRating(ratios, probabilityOfDefault);

    // Stress testing
    const stressTesting = analysis.includeStressTesting
      ? this.performStressTesting(financials, ratios, probabilityOfDefault)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      probabilityOfDefault,
      lossGivenDefault,
      expectedLoss,
      creditRating
    );

    return {
      summary: {
        pd: probabilityOfDefault?.pd,
        lgd: lossGivenDefault?.lgd,
        expectedLoss: expectedLoss?.el,
        creditRating: creditRating.rating,
        riskLevel: creditRating.riskLevel,
      },
      ratios,
      probabilityOfDefault,
      lossGivenDefault,
      expectedLoss,
      creditRating,
      stressTesting,
      recommendations,
    };
  }

  private static calculateRatios(financials: CreditRiskInput['financials']): {
    debtToEquity: number;
    debtToEBITDA: number;
    currentRatio: number;
    quickRatio: number;
    interestCoverage: number;
  } {
    const equity = financials.totalAssets - financials.totalDebt;
    const debtToEquity = equity > 0 ? financials.totalDebt / equity : 999;
    const debtToEBITDA = financials.ebitda > 0 ? financials.totalDebt / financials.ebitda : 999;
    const currentRatio =
      financials.currentLiabilities > 0
        ? (financials.cashAndEquivalents + financials.totalAssets * 0.2) /
          financials.currentLiabilities
        : 999;
    const quickRatio =
      financials.currentLiabilities > 0
        ? financials.cashAndEquivalents / financials.currentLiabilities
        : 999;
    const interestCoverage =
      financials.ebitda > 0 ? financials.ebitda / (financials.totalDebt * 0.05) : 0; // Assume 5% interest

    return {
      debtToEquity,
      debtToEBITDA,
      currentRatio,
      quickRatio,
      interestCoverage,
    };
  }

  private static calculatePD(
    ratios: { debtToEBITDA: number; interestCoverage: number; currentRatio: number },
    borrowerInfo?: CreditRiskInput['borrowerInfo']
  ): {
    pd: number;
    pdRating: string;
    factors: string[];
  } {
    let pd = 0.02; // Base 2% PD
    const factors: string[] = [];

    // Debt-to-EBITDA impact
    if (ratios.debtToEBITDA > 6) {
      pd += 0.15;
      factors.push('Very high debt-to-EBITDA significantly increases default risk');
    } else if (ratios.debtToEBITDA > 4) {
      pd += 0.08;
      factors.push('High debt-to-EBITDA increases default risk');
    } else if (ratios.debtToEBITDA > 2) {
      pd += 0.03;
      factors.push('Moderate debt-to-EBITDA');
    }

    // Interest coverage impact
    if (ratios.interestCoverage < 1) {
      pd += 0.2;
      factors.push('Cannot cover interest payments - very high default risk');
    } else if (ratios.interestCoverage < 1.5) {
      pd += 0.1;
      factors.push('Low interest coverage - elevated default risk');
    } else if (ratios.interestCoverage < 2) {
      pd += 0.05;
      factors.push('Moderate interest coverage');
    }

    // Current ratio impact
    if (ratios.currentRatio < 1) {
      pd += 0.1;
      factors.push('Current ratio below 1.0 indicates liquidity risk');
    }

    // Years in business
    if (borrowerInfo && borrowerInfo.yearsInBusiness && borrowerInfo.yearsInBusiness < 2) {
      pd += 0.05;
      factors.push('Newer business has higher default risk');
    }

    pd = Math.min(pd, 0.5); // Cap at 50%

    let pdRating = '';
    if (pd < 0.05) {
      pdRating = 'Low';
    } else if (pd < 0.15) {
      pdRating = 'Moderate';
    } else if (pd < 0.3) {
      pdRating = 'High';
    } else {
      pdRating = 'Very High';
    }

    return {
      pd,
      pdRating,
      factors,
    };
  }

  private static calculateLGD(recoveryRate: number): {
    lgd: number;
    interpretation: string;
  } {
    const lgd = 1 - recoveryRate; // Loss Given Default = 1 - Recovery Rate

    let interpretation = '';
    if (lgd < 0.3) {
      interpretation = 'Low loss given default - good collateral/recovery prospects';
    } else if (lgd < 0.5) {
      interpretation = 'Moderate loss given default';
    } else {
      interpretation = 'High loss given default - limited recovery prospects';
    }

    return {
      lgd,
      interpretation,
    };
  }

  private static calculateEL(
    pd: number,
    lgd: number,
    ead: number
  ): {
    el: number;
    interpretation: string;
  } {
    const el = pd * lgd * ead; // Expected Loss = PD × LGD × EAD

    let interpretation = '';
    if (el < ead * 0.01) {
      interpretation = 'Low expected loss';
    } else if (el < ead * 0.05) {
      interpretation = 'Moderate expected loss';
    } else {
      interpretation = 'High expected loss - significant credit risk';
    }

    return {
      el,
      interpretation,
    };
  }

  private static assessCreditRating(
    ratios: { debtToEBITDA: number; interestCoverage: number },
    pd?: { pd: number }
  ): {
    rating: string;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 100;

    // Debt-to-EBITDA scoring
    if (ratios.debtToEBITDA > 6) {
      score -= 40;
      factors.push('Very high debt-to-EBITDA');
    } else if (ratios.debtToEBITDA > 4) {
      score -= 20;
      factors.push('High debt-to-EBITDA');
    } else if (ratios.debtToEBITDA > 2) {
      score -= 10;
    }

    // Interest coverage scoring
    if (ratios.interestCoverage < 1) {
      score -= 30;
      factors.push('Cannot cover interest payments');
    } else if (ratios.interestCoverage < 1.5) {
      score -= 15;
      factors.push('Low interest coverage');
    }

    // PD-based scoring
    if (pd && pd.pd > 0.3) {
      score -= 30;
      factors.push('Very high probability of default');
    } else if (pd && pd.pd > 0.15) {
      score -= 15;
      factors.push('High probability of default');
    }

    // Determine rating
    let rating = 'BBB';
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    if (score >= 80) {
      rating = 'AA';
      riskLevel = 'low';
    } else if (score >= 70) {
      rating = 'A';
      riskLevel = 'low';
    } else if (score >= 60) {
      rating = 'BBB';
      riskLevel = 'medium';
    } else if (score >= 50) {
      rating = 'BB';
      riskLevel = 'medium';
    } else if (score >= 40) {
      rating = 'B';
      riskLevel = 'high';
    } else {
      rating = 'CCC';
      riskLevel = 'high';
    }

    return {
      rating,
      riskLevel,
      factors,
    };
  }

  private static performStressTesting(
    financials: CreditRiskInput['financials'],
    _ratios: { debtToEBITDA: number },
    pd?: { pd: number }
  ): {
    scenarios: Array<{
      scenario: string;
      revenueShock: number;
      ebitdaShock: number;
      stressedPD: number;
      stressedEL: number;
    }>;
  } {
    const scenarios: Array<{
      scenario: string;
      revenueShock: number;
      ebitdaShock: number;
      stressedPD: number;
      stressedEL: number;
    }> = [];

    const stressCases = [
      { name: 'Mild Recession', revenue: -0.1, ebitda: -0.15 },
      { name: 'Moderate Recession', revenue: -0.2, ebitda: -0.3 },
      { name: 'Severe Recession', revenue: -0.3, ebitda: -0.5 },
    ];

    stressCases.forEach((stress) => {
      // Calculate stressed EBITDA for analysis (not used in return but kept for completeness)
      // const stressedEBITDA = financials.ebitda * (1 + stress.ebitda);
      // const stressedDebtToEBITDA = stressedEBITDA > 0 ? financials.totalDebt / stressedEBITDA : 999;
      const stressedPD = Math.min(0.5, (pd?.pd || 0.02) * (1 + Math.abs(stress.ebitda) * 2));
      const stressedEL = stressedPD * 0.4 * financials.totalDebt; // Assume 40% LGD

      scenarios.push({
        scenario: stress.name,
        revenueShock: stress.revenue * 100,
        ebitdaShock: stress.ebitda * 100,
        stressedPD,
        stressedEL,
      });
    });

    return {
      scenarios,
    };
  }

  private static generateRecommendations(
    pd?: { pd: number; pdRating: string },
    lgd?: { lgd: number },
    el?: { el: number },
    creditRating?: { rating: string; riskLevel: string }
  ): string[] {
    const recommendations: string[] = [];

    if (pd) {
      recommendations.push(
        `Probability of Default: ${(pd.pd * 100).toFixed(2)}% (${pd.pdRating} risk)`
      );
    }

    if (lgd) {
      recommendations.push(`Loss Given Default: ${(lgd.lgd * 100).toFixed(1)}%`);
    }

    if (el) {
      recommendations.push(`Expected Loss: $${el.el.toFixed(0)}`);
    }

    if (creditRating) {
      recommendations.push(
        `Credit Rating: ${creditRating.rating} (${creditRating.riskLevel} risk)`
      );
    }

    if (pd && pd.pd > 0.15) {
      recommendations.push('High default risk - consider credit enhancement or restructuring');
    }

    if (creditRating && creditRating.riskLevel === 'high') {
      recommendations.push('High credit risk - implement risk mitigation strategies');
    }

    return recommendations;
  }
}
