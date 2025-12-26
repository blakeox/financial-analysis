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
    const relinquished = input.relinquishedProperty;
    const replacement = input.replacementProperty;
    const timeline = input.exchangeTimeline;
    const taxInfo = input.taxInfo;
    const boot = input.boot;
    const analysis = input.analysis;

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
      comparison,
      recommendations,
    };
  }

  private static calculateTaxDeferral(
    relinquished: OneZeroThreeOneExchangeInput['relinquishedProperty'],
    boot: OneZeroThreeOneExchangeInput['boot'],
    taxInfo: OneZeroThreeOneExchangeInput['taxInfo']
  ): {
    realizedGain: number;
    recognizedGain: number;
    deferredGain: number;
    deferredTax: number;
  } {
    const realizedGain = relinquished.sellingPrice - relinquished.adjustedBasis;
    const recognizedGain = boot.totalBoot; // Only boot is recognized
    const deferredGain = realizedGain - recognizedGain;
    const deferredTax = deferredGain * (taxInfo.federalTaxRate.capitalGains + taxInfo.stateTaxRate);

    return {
      realizedGain,
      recognizedGain,
      deferredGain,
      deferredTax,
    };
  }

  private static calculateDepreciationRecapture(
    relinquished: OneZeroThreeOneExchangeInput['relinquishedProperty'],
    taxInfo: OneZeroThreeOneExchangeInput['taxInfo']
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
    boot: OneZeroThreeOneExchangeInput['boot'],
    taxInfo: OneZeroThreeOneExchangeInput['taxInfo']
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
    relinquished: OneZeroThreeOneExchangeInput['relinquishedProperty'],
    deferral: { deferredTax: number } | undefined,
    taxInfo: OneZeroThreeOneExchangeInput['taxInfo']
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
    timeline: OneZeroThreeOneExchangeInput['exchangeTimeline']
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
}



