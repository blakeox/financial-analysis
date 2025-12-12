/**
 * International Tax Planning Calculator
 * Optimize FEIE, FTC, and foreign asset reporting
 */

import type { InternationalTaxPlanningInput } from '../schemas/international-tax-planning.js';

export class InternationalTaxPlanningCalculator {
  /**
   * Analyze international tax planning strategies
   */
  static analyze(input: InternationalTaxPlanningInput): unknown {
    const personalInfo = input.personalInfo;
    const foreignIncome = input.foreignIncome;
    const feie = input.feie;
    const foreignTaxCredit = input.foreignTaxCredit;
    const foreignAssets = input.foreignAssets;
    const analysis = input.analysis;

    // FEIE vs FTC comparison
    const feieVsFTC = analysis.includeFEIEvsFTC
      ? this.compareFEIEvsFTC(feie, foreignTaxCredit, foreignIncome, personalInfo)
      : undefined;

    // Tax savings calculation
    const taxSavings = analysis.includeTaxSavings
      ? this.calculateTaxSavings(feieVsFTC, foreignIncome, personalInfo)
      : undefined;

    // Compliance check
    const complianceCheck = analysis.includeComplianceCheck
      ? this.checkCompliance(foreignAssets, foreignIncome, feie, personalInfo)
      : undefined;

    // Optimization recommendations
    const optimization = analysis.includeOptimization
      ? this.optimizeStrategy(feie, foreignTaxCredit, foreignIncome, personalInfo)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      feieVsFTC,
      taxSavings,
      complianceCheck,
      optimization
    );

    return {
      summary: {
        foreignIncome: foreignIncome.foreignEarnedIncome,
        feieExclusion: feieVsFTC?.feieExclusion || 0,
        ftcCredit: feieVsFTC?.ftcCredit || 0,
        totalTaxSavings: taxSavings?.totalSavings || 0,
        complianceStatus: complianceCheck?.status || 'unknown',
      },
      feieVsFTC,
      taxSavings,
      complianceCheck,
      optimization,
      recommendations,
    };
  }

  private static compareFEIEvsFTC(
    feie: InternationalTaxPlanningInput['feie'],
    ftc: InternationalTaxPlanningInput['foreignTaxCredit'],
    income: InternationalTaxPlanningInput['foreignIncome'],
    _personalInfo: InternationalTaxPlanningInput['personalInfo']
  ): {
    feieExclusion: number;
    ftcCredit: number;
    betterOption: 'feie' | 'ftc' | 'hybrid';
    recommendation: string;
  } {
    const feieExclusion = feie.eligibleForFEIE
      ? Math.min(income.foreignEarnedIncome, feie.feiELimit)
      : 0;
    const taxableAfterFEIE = Math.max(0, income.foreignEarnedIncome - feieExclusion);
    const usTaxOnForeignIncome = taxableAfterFEIE * 0.37; // Assume top rate

    const ftcCredit = ftc.eligibleForFTC && ftc.useFTC
      ? Math.min(income.foreignTaxPaid, usTaxOnForeignIncome)
      : 0;

    let betterOption: 'feie' | 'ftc' | 'hybrid' = 'feie';
    if (feieExclusion > 0 && ftcCredit > 0) {
      betterOption = 'hybrid';
    } else if (ftcCredit > feieExclusion) {
      betterOption = 'ftc';
    }

    let recommendation = 'Use FEIE for earned income exclusion';
    if (betterOption === 'ftc') {
      recommendation = 'Use FTC for better tax benefit';
    } else if (betterOption === 'hybrid') {
      recommendation = 'Use FEIE for earned income, FTC for unearned income';
    }

    return {
      feieExclusion,
      ftcCredit,
      betterOption,
      recommendation,
    };
  }

  private static calculateTaxSavings(
    comparison: { feieExclusion: number; ftcCredit: number } | undefined,
    _income: InternationalTaxPlanningInput['foreignIncome'],
    _personalInfo: InternationalTaxPlanningInput['personalInfo']
  ): {
    feieSavings: number;
    ftcSavings: number;
    totalSavings: number;
  } {
    if (!comparison) {
      return {
        feieSavings: 0,
        ftcSavings: 0,
        totalSavings: 0,
      };
    }

    const usTaxRate = 0.37; // Assume top rate
    const feieSavings = comparison.feiEExclusion * usTaxRate;
    const ftcSavings = comparison.ftcCredit;
    const totalSavings = feieSavings + ftcSavings;

    return {
      feieSavings,
      ftcSavings,
      totalSavings,
    };
  }

  private static checkCompliance(
    assets: InternationalTaxPlanningInput['foreignAssets'],
    _income: InternationalTaxPlanningInput['foreignIncome'],
    feie: InternationalTaxPlanningInput['feie'],
    _personalInfo: InternationalTaxPlanningInput['personalInfo']
  ): {
    status: 'compliant' | 'non-compliant' | 'review-needed';
    fbarRequired: boolean;
    fatcaRequired: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    let fbarRequired = false;
    let fatcaRequired = false;

    // FBAR requirement (aggregate > $10,000)
    const totalForeignAccounts = assets.foreignBankAccounts.reduce((sum, acc) => sum + acc.maxBalance, 0);
    if (totalForeignAccounts > 10000) {
      fbarRequired = true;
      issues.push('FBAR filing required - aggregate foreign accounts exceed $10,000');
    }

    // FATCA requirement (aggregate > $50,000)
    const totalForeignAssets = assets.foreignFinancialAssets.reduce((sum, asset) => sum + asset.value, 0);
    if (totalForeignAssets > 50000) {
      fatcaRequired = true;
      issues.push('FATCA Form 8938 filing required - aggregate foreign assets exceed $50,000');
    }

    // FEIE eligibility check
    if (feie.eligibleForFEIE && feie.daysAbroad < 330) {
      issues.push('Physical presence test may not be met - verify days abroad');
    }

    const status = issues.length === 0 ? 'compliant' : issues.length <= 2 ? 'review-needed' : 'non-compliant';

    return {
      status,
      fbarRequired,
      fatcaRequired,
      issues,
    };
  }

  private static optimizeStrategy(
    feie: InternationalTaxPlanningInput['feie'],
    ftc: InternationalTaxPlanningInput['foreignTaxCredit'],
    income: InternationalTaxPlanningInput['foreignIncome'],
    _personalInfo: InternationalTaxPlanningInput['personalInfo']
  ): {
    optimalStrategy: string;
    estimatedSavings: number;
    recommendations: string[];
  } {
    const feieExclusion = feie.eligibleForFEIE ? Math.min(income.foreignEarnedIncome, feie.feiELimit) : 0;
    const ftcCredit = ftc.eligibleForFTC ? ftc.foreignTaxPaid : 0;

    let optimalStrategy = 'Use FEIE for earned income';
    let estimatedSavings = feieExclusion * 0.37;

    if (ftcCredit > feieExclusion * 0.37) {
      optimalStrategy = 'Use FTC for better tax benefit';
      estimatedSavings = ftcCredit;
    }

    const recommendations: string[] = [];
    if (feie.eligibleForFEIE) {
      recommendations.push('Maximize FEIE exclusion for earned income');
    }
    if (ftc.eligibleForFTC) {
      recommendations.push('Use FTC for unearned income and excess foreign taxes');
    }

    return {
      optimalStrategy,
      estimatedSavings,
      recommendations,
    };
  }

  private static generateRecommendations(
    comparison: { recommendation: string } | undefined,
    savings: { totalSavings: number } | undefined,
    compliance: { status: string; issues: string[] } | undefined,
    optimization: { optimalStrategy: string } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (comparison) {
      recommendations.push(comparison.recommendation);
    }

    if (savings) {
      recommendations.push(`Estimated tax savings: $${savings.totalSavings.toFixed(0)}`);
    }

    if (compliance) {
      if (compliance.status === 'non-compliant') {
        recommendations.push('URGENT: Address compliance issues');
      }
      compliance.issues.forEach((issue) => {
        recommendations.push(`Compliance: ${issue}`);
      });
    }

    if (optimization) {
      recommendations.push(`Optimal strategy: ${optimization.optimalStrategy}`);
    }

    return recommendations;
  }
}


