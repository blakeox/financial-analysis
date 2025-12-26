/**
 * Business Financial Health Assessment
 * Standalone model for assessing business financial health
 */

import type { BusinessFinancialHealthInput } from '../schemas/business-financial-health.js';

export class BusinessFinancialHealthAnalyzer {
  static analyze(input: BusinessFinancialHealthInput): unknown {
    const financials = input.financials;
    const businessInfo = input.businessInfo;

    const ebitda = financials.annualEBITDA;
    const debtToEBITDA = ebitda > 0 ? financials.currentDebt / ebitda : 999;
    const currentRatio =
      financials.accountsPayable > 0
        ? (financials.cashOnHand + financials.accountsReceivable) / financials.accountsPayable
        : 999;
    const quickRatio =
      financials.accountsPayable > 0 ? financials.cashOnHand / financials.accountsPayable : 999;

    let score = 100;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Debt to EBITDA (target: <3x)
    if (debtToEBITDA < 2) {
      score += 10;
      strengths.push('Low debt-to-EBITDA ratio indicates strong debt capacity');
    } else if (debtToEBITDA > 5) {
      score -= 30;
      weaknesses.push('High debt-to-EBITDA ratio may limit borrowing capacity');
    } else if (debtToEBITDA > 3) {
      score -= 15;
      weaknesses.push('Moderate debt-to-EBITDA ratio - monitor closely');
    }

    // Current ratio (target: >1.5)
    if (currentRatio > 2) {
      score += 10;
      strengths.push('Strong current ratio indicates good liquidity');
    } else if (currentRatio < 1) {
      score -= 20;
      weaknesses.push('Current ratio below 1.0 indicates liquidity concerns');
    }

    // Quick ratio (target: >1.0)
    if (quickRatio > 1.5) {
      score += 5;
      strengths.push('Strong quick ratio shows good cash position');
    } else if (quickRatio < 0.5) {
      score -= 15;
      weaknesses.push('Low quick ratio - limited cash reserves');
    }

    // Years in business
    if (businessInfo.yearsInBusiness > 5) {
      score += 5;
      strengths.push('Established business history improves loan eligibility');
    } else if (businessInfo.yearsInBusiness < 2) {
      score -= 10;
      weaknesses.push('Newer business may face higher rates or stricter terms');
    }

    // Credit score
    if (financials.creditScore && financials.creditScore >= 720) {
      score += 10;
      strengths.push('Excellent credit score will help secure favorable terms');
    } else if (financials.creditScore && financials.creditScore < 620) {
      score -= 20;
      weaknesses.push('Low credit score may limit loan options or increase rates');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      metrics: {
        debtToEBITDA,
        currentRatio,
        quickRatio,
      },
      strengths,
      weaknesses,
      interpretation:
        score >= 80
          ? 'Excellent financial health - strong position for expansion'
          : score >= 60
            ? 'Good financial health - ready for expansion with proper planning'
            : score >= 40
              ? 'Moderate financial health - consider improving metrics before expansion'
              : 'Weak financial health - focus on strengthening fundamentals first',
    };
  }
}
