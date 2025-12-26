/**
 * 1031 Exchange Analyzer
 * Analyze like-kind exchange tax deferral benefits
 */

import type { OneZeroThreeOneExchangeInput } from '../schemas/1031-exchange.js';

export class OneZeroThreeOneExchangeAnalyzer {
  /**
   * Analyze 1031 exchange benefits
   */
  static analyze(input: OneZeroThreeOneExchangeInput): unknown {
    const raw = input as unknown as Record<string, unknown>;

    const toNumber = (value: unknown, fallback = 0): number => {
      const num = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(num) ? num : fallback;
    };

    const toBoolean = (value: unknown, fallback = false): boolean => {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return fallback;
    };

    const relinquishedRaw = (raw['relinquishedProperty'] ?? {}) as Record<string, unknown>;
    const replacementRaw = (raw['replacementProperty'] ?? {}) as Record<string, unknown>;
    const timelineRaw = ((raw['exchangeTimeline'] ?? raw['exchangeDetails']) ?? {}) as Record<string, unknown>;
    const taxInfoRaw = (raw['taxInfo'] ?? {}) as Record<string, unknown>;
    const analysisRaw = (raw['analysis'] ?? {}) as Record<string, unknown>;
    const bootRaw = (raw['boot'] ?? {}) as Record<string, unknown>;

    const relinquished = {
      sellingPrice: toNumber(relinquishedRaw['sellingPrice'] ?? relinquishedRaw['salePrice']),
      adjustedBasis: toNumber(relinquishedRaw['adjustedBasis']),
      accumulatedDepreciation: toNumber(relinquishedRaw['accumulatedDepreciation']),
      sellingExpenses: toNumber(relinquishedRaw['sellingExpenses']),
    };

    const replacement = {
      purchasePrice: toNumber(replacementRaw['purchasePrice']),
      purchaseExpenses: toNumber(replacementRaw['purchaseExpenses'] ?? replacementRaw['closingCosts']),
      mortgageAmount: toNumber(replacementRaw['mortgageAmount']),
      downPayment: toNumber(replacementRaw['downPayment']),
    };

    const timeline = {
      identificationDeadline: String(timelineRaw['identificationDeadline'] ?? ''),
      closingDeadline: String(timelineRaw['closingDeadline'] ?? ''),
      qualifiedIntermediary: toBoolean(timelineRaw['qualifiedIntermediary'], true),
      exchangeType: String(timelineRaw['exchangeType'] ?? ''),
    };

    const federalTaxRateRaw = (taxInfoRaw['federalTaxRate'] ?? {}) as Record<string, unknown>;
    const taxInfo = {
      federalTaxRate: {
        ordinary: toNumber(federalTaxRateRaw['ordinary'], 0.37),
        capitalGains: toNumber(federalTaxRateRaw['capitalGains'], 0.2),
        depreciationRecapture: toNumber(federalTaxRateRaw['depreciationRecapture'], 0.25),
      },
      stateTaxRate: toNumber(taxInfoRaw['stateTaxRate'], 0),
      netInvestmentIncomeTax: toBoolean(taxInfoRaw['netInvestmentIncomeTax'], false),
      niiTaxRate: toNumber(taxInfoRaw['niiTaxRate'], 0.038),
      includeDepreciationRecapture: toBoolean(taxInfoRaw['includeDepreciationRecapture'], true),
    };

    const boot = {
      cashReceived: toNumber(bootRaw['cashReceived']),
      debtRelief: toNumber(bootRaw['debtRelief']),
      nonLikeKindProperty: toNumber(bootRaw['nonLikeKindProperty']),
      totalBoot: toNumber(
        bootRaw['totalBoot'],
        toNumber(bootRaw['cashReceived']) + toNumber(bootRaw['debtRelief']) + toNumber(bootRaw['nonLikeKindProperty'])
      ),
    };

    const analysis = {
      includeTaxDeferral: toBoolean(analysisRaw['includeTaxDeferral'], true),
      includeDepreciationRecapture: toBoolean(analysisRaw['includeDepreciationRecapture'], taxInfo.includeDepreciationRecapture),
      includeBootAnalysis: toBoolean(analysisRaw['includeBootAnalysis'], true),
      includeComparison: toBoolean(analysisRaw['includeComparison'], false),
      includeComplianceCheck: toBoolean(analysisRaw['includeComplianceCheck'], true),
      includeReplacementAnalysis: toBoolean(analysisRaw['includeReplacementAnalysis'], true),
    };

    // Calculate tax deferral
    const taxDeferral = analysis.includeTaxDeferral
      ? this.calculateTaxDeferral(relinquished, boot, taxInfo)
      : undefined;

    // Depreciation recapture
    const depreciationRecapture = analysis.includeDepreciationRecapture
      ? this.calculateDepreciationRecapture(relinquished, taxInfo)
      : undefined;

    // Boot analysis
    const bootAnalysis = analysis.includeBootAnalysis
      ? this.analyzeBoot(boot, taxInfo)
      : undefined;

    // Comparison to selling without exchange
    const comparison = analysis.includeComparison
      ? this.compareToSale(relinquished, taxDeferral, taxInfo)
      : undefined;

    const complianceCheck = analysis.includeComplianceCheck
      ? this.checkCompliance(timeline)
      : undefined;

    const replacementAnalysis = analysis.includeReplacementAnalysis
      ? this.analyzeReplacement(relinquished, replacement)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      taxDeferral,
      depreciationRecapture,
      bootAnalysis,
      comparison,
      timeline
    );

    return {
      summary: {
        relinquishedValue: relinquished.sellingPrice,
        replacementValue: replacement.purchasePrice,
        taxDeferred: taxDeferral?.deferredTax || 0,
        bootReceived: boot.totalBoot,
        taxOnBoot: bootAnalysis?.taxOnBoot || 0,
        netTaxSavings: comparison?.taxSavings || 0,
      },
      taxDeferral,
      depreciationRecapture,
      bootAnalysis,
      complianceCheck,
      replacementAnalysis,
      comparison,
      recommendations,
    };
  }

  private static calculateTaxDeferral(
    relinquished: { sellingPrice: number; adjustedBasis: number },
    boot: { totalBoot: number },
    taxInfo: {
      federalTaxRate: { capitalGains: number };
      stateTaxRate: number;
      netInvestmentIncomeTax: boolean;
      niiTaxRate: number;
    }
  ): {
    realizedGain: number;
    recognizedGain: number;
    deferredGain: number;
    deferredTax: number;
    deferredTaxAmount: number;
  } {
    const realizedGain = relinquished.sellingPrice - relinquished.adjustedBasis;
    const recognizedGain = Math.max(0, Math.min(boot.totalBoot, realizedGain)); // Only boot is recognized
    const deferredGain = realizedGain - recognizedGain;
    const baseRate = taxInfo.federalTaxRate.capitalGains + taxInfo.stateTaxRate;
    const niitRate = taxInfo.netInvestmentIncomeTax ? taxInfo.niiTaxRate : 0;
    const deferredTax = deferredGain * (baseRate + niitRate);

    return {
      realizedGain,
      recognizedGain,
      deferredGain,
      deferredTax,
      deferredTaxAmount: deferredTax,
    };
  }

  private static calculateDepreciationRecapture(
    relinquished: { accumulatedDepreciation: number; sellingPrice: number; adjustedBasis: number },
    taxInfo: { federalTaxRate: { depreciationRecapture: number } }
  ): {
    depreciationRecapture: number;
    recaptureTax: number;
  } {
    const depreciationRecapture = Math.min(
      relinquished.accumulatedDepreciation,
      relinquished.sellingPrice - relinquished.adjustedBasis
    );
    const recaptureTax = depreciationRecapture * taxInfo.federalTaxRate.depreciationRecapture;

    return {
      depreciationRecapture,
      recaptureTax,
    };
  }

  private static analyzeBoot(
    boot: { cashReceived: number; debtRelief: number; totalBoot: number },
    taxInfo: { federalTaxRate: { capitalGains: number }; stateTaxRate: number }
  ): {
    cashBoot: number;
    debtReliefBoot: number;
    totalBoot: number;
    taxOnBoot: number;
  } {
    const totalBoot = boot.totalBoot;
    const taxOnBoot = totalBoot * (taxInfo.federalTaxRate.capitalGains + taxInfo.stateTaxRate);

    return {
      cashBoot: boot.cashReceived,
      debtReliefBoot: boot.debtRelief,
      totalBoot,
      taxOnBoot,
    };
  }

  private static compareToSale(
    relinquished: { sellingPrice: number; adjustedBasis: number },
    deferral: { deferredTax: number } | undefined,
    taxInfo: { federalTaxRate: { capitalGains: number }; stateTaxRate: number }
  ): {
    taxWithoutExchange: number;
    taxWithExchange: number;
    taxSavings: number;
    recommendation: string;
  } {
    const gain = relinquished.sellingPrice - relinquished.adjustedBasis;
    const taxWithoutExchange = gain * (taxInfo.federalTaxRate.capitalGains + taxInfo.stateTaxRate);
    const taxWithExchange = deferral?.deferredTax || 0;
    const taxSavings = taxWithoutExchange - taxWithExchange;

    let recommendation = '1031 exchange provides significant tax deferral';
    if (taxSavings < 10000) {
      recommendation = 'Tax savings may not justify exchange complexity';
    }

    return {
      taxWithoutExchange,
      taxWithExchange,
      taxSavings,
      recommendation,
    };
  }

  private static generateRecommendations(
    deferral: { deferredTax: number } | undefined,
    recapture: { recaptureTax: number } | undefined,
    boot: { taxOnBoot: number } | undefined,
    comparison: { taxSavings: number; recommendation: string } | undefined,
    timeline: { identificationDeadline: string; closingDeadline: string; qualifiedIntermediary: boolean }
  ): string[] {
    const recommendations: string[] = [];

    if (deferral) {
      recommendations.push(`Tax deferred: $${deferral.deferredTax.toFixed(0)}`);
    }

    if (comparison) {
      recommendations.push(`Tax savings vs sale: $${comparison.taxSavings.toFixed(0)}`);
      recommendations.push(comparison.recommendation);
    }

    if (recapture) {
      recommendations.push(`Depreciation recapture tax: $${recapture.recaptureTax.toFixed(0)}`);
    }

    if (boot && boot.taxOnBoot > 0) {
      recommendations.push(`Tax on boot received: $${boot.taxOnBoot.toFixed(0)}`);
    }

    recommendations.push(`Identification deadline: ${timeline.identificationDeadline}`);
    recommendations.push(`Closing deadline: ${timeline.closingDeadline}`);

    if (!timeline.qualifiedIntermediary) {
      recommendations.push('CRITICAL: Use qualified intermediary for valid exchange');
    }

    return recommendations;
  }

  private static checkCompliance(timeline: {
    identificationDeadline: string;
    closingDeadline: string;
    qualifiedIntermediary: boolean;
    exchangeType: string;
  }): { isCompliant: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!timeline.identificationDeadline) issues.push('Missing identification deadline');
    if (!timeline.closingDeadline) issues.push('Missing closing deadline');
    if (!timeline.qualifiedIntermediary) issues.push('Qualified intermediary required');

    // Keep deterministic/simple: treat missing deadlines/QI as non-compliant.
    const isCompliant = issues.length === 0;

    // Optional informational note.
    if (timeline.exchangeType && timeline.exchangeType !== 'delayed') {
      issues.push(`Exchange type: ${timeline.exchangeType}`);
    }

    return { isCompliant, issues };
  }

  private static analyzeReplacement(
    relinquished: { sellingPrice: number },
    replacement: { purchasePrice: number; purchaseExpenses: number; mortgageAmount: number; downPayment: number }
  ): {
    totalReplacementCost: number;
    meetsReinvestmentRequirement: boolean;
    valueGap: number;
  } {
    const totalReplacementCost = replacement.purchasePrice + replacement.purchaseExpenses;
    const meetsReinvestmentRequirement = totalReplacementCost >= relinquished.sellingPrice;
    const valueGap = relinquished.sellingPrice - totalReplacementCost;

    return {
      totalReplacementCost,
      meetsReinvestmentRequirement,
      valueGap,
    };
  }
}



