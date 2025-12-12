/**
 * Business Succession Planning Calculator
 * Plan business transfer with tax optimization
 */

import type { BusinessSuccessionPlanningInput } from '../schemas/business-succession-planning.js';

export class BusinessSuccessionPlanningCalculator {
  /**
   * Analyze business succession planning
   */
  static analyze(input: BusinessSuccessionPlanningInput): unknown {
    const businessInfo = input.businessInfo;
    const ownership = input.ownership;
    const valuation = input.valuation;
    const successionOptions = input.successionOptions;
    const taxPlanning = input.taxPlanning;
    const buySellAgreement = input.buySellAgreement;
    const analysis = input.analysis;

    // Valuation analysis
    const valuationAnalysis = this.analyzeValuation(valuation, businessInfo);

    // Tax analysis
    const taxAnalysis = analysis.includeTaxAnalysis
      ? this.analyzeTaxes(valuationAnalysis, taxPlanning, successionOptions)
      : undefined;

    // Estate tax impact
    const estateTaxImpact = analysis.includeEstateTaxImpact
      ? this.analyzeEstateTax(valuationAnalysis, taxPlanning, ownership)
      : undefined;

    // Transfer strategies
    const transferStrategies = analysis.includeTransferStrategies
      ? this.analyzeTransferStrategies(successionOptions, taxPlanning, valuationAnalysis)
      : undefined;

    // Timing analysis
    const timingAnalysis = analysis.includeTimingAnalysis
      ? this.analyzeTiming(ownership, taxPlanning)
      : undefined;

    // Funding analysis
    const fundingAnalysis = analysis.includeFundingAnalysis
      ? this.analyzeFunding(successionOptions, buySellAgreement, valuationAnalysis)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      valuationAnalysis,
      taxAnalysis,
      estateTaxImpact,
      transferStrategies,
      timingAnalysis
    );

    return {
      summary: {
        businessValue: valuationAnalysis.estimatedValue,
        estateTax: estateTaxImpact?.estateTax || 0,
        transferTax: taxAnalysis?.transferTax || 0,
        recommendedStrategy: transferStrategies?.bestStrategy,
        yearsUntilTransfer: timingAnalysis?.yearsUntilOptimalTransfer || 0,
      },
      valuationAnalysis,
      taxAnalysis,
      estateTaxImpact,
      transferStrategies,
      timingAnalysis,
      fundingAnalysis,
      recommendations,
    };
  }

  private static analyzeValuation(
    valuation: BusinessSuccessionPlanningInput['valuation'],
    business: BusinessSuccessionPlanningInput['businessInfo']
  ): {
    estimatedValue: number;
    valueRange: { low: number; high: number };
    method: string;
  } {
    let estimatedValue = valuation.estimatedValue;

    // If using multiples, calculate
    if (valuation.valuationMethod === 'market-multiple' && valuation.valuationMultiple) {
      estimatedValue = business.annualEBITDA * valuation.valuationMultiple;
    } else if (valuation.valuationMethod === 'income-approach') {
      estimatedValue = business.annualEBITDA * 5; // Simplified
    }

    const valueRange = {
      low: estimatedValue * 0.8,
      high: estimatedValue * 1.2,
    };

    return {
      estimatedValue,
      valueRange,
      method: valuation.valuationMethod,
    };
  }

  private static analyzeTaxes(
    valuation: { estimatedValue: number },
    taxPlanning: BusinessSuccessionPlanningInput['taxPlanning'],
    succession: BusinessSuccessionPlanningInput['successionOptions']
  ): {
    transferTax: number;
    capitalGainsTax: number;
    giftTax: number;
    totalTax: number;
  } {
    const transferValue = succession.salePrice || valuation.estimatedValue;
    const transferTax = transferValue * 0.2; // Capital gains rate
    const capitalGainsTax = transferTax;
    const giftTax = successionOptions.transferMethod === 'gift' ? transferValue * 0.4 : 0; // Estate tax rate
    const totalTax = capitalGainsTax + giftTax;

    return {
      transferTax,
      capitalGainsTax,
      giftTax,
      totalTax,
    };
  }

  private static analyzeEstateTax(
    valuation: { estimatedValue: number },
    taxPlanning: BusinessSuccessionPlanningInput['taxPlanning'],
    _ownership: BusinessSuccessionPlanningInput['ownership']
  ): {
    grossEstate: number;
    exemptions: number;
    taxableEstate: number;
    estateTax: number;
  } {
    const grossEstate = valuation.estimatedValue;
    const exemptions = taxPlanning.federalEstateTaxExemption + taxPlanning.stateEstateTaxExemption;
    const taxableEstate = Math.max(0, grossEstate - exemptions);
    const estateTax = taxableEstate * taxPlanning.estateTaxRate;

    return {
      grossEstate,
      exemptions,
      taxableEstate,
      estateTax,
    };
  }

  private static analyzeTransferStrategies(
    succession: BusinessSuccessionPlanningInput['successionOptions'],
    taxPlanning: BusinessSuccessionPlanningInput['taxPlanning'],
    valuation: { estimatedValue: number }
  ): {
    strategies: Array<{ method: string; taxCost: number; flexibility: string }>;
    bestStrategy: string;
  } {
    const strategies = [
      {
        method: 'sale',
        taxCost: valuation.estimatedValue * 0.2, // Capital gains
        flexibility: 'high',
      },
      {
        method: 'gift',
        taxCost: Math.max(0, (valuation.estimatedValue - taxPlanning.giftTaxExemption) * 0.4),
        flexibility: 'low',
      },
      {
        method: 'trust',
        taxCost: valuation.estimatedValue * 0.15, // Reduced through planning
        flexibility: 'medium',
      },
      {
        method: 'family-transfer',
        taxCost: valuation.estimatedValue * 0.1, // Best tax treatment
        flexibility: 'medium',
      },
    ];

    const bestStrategy = strategies.reduce((best, current) =>
      current.taxCost < best.taxCost ? current : best
    ).method;

    return {
      strategies,
      bestStrategy,
    };
  }

  private static analyzeTiming(
    ownership: BusinessSuccessionPlanningInput['ownership'],
    _taxPlanning: BusinessSuccessionPlanningInput['taxPlanning']
  ): {
    yearsUntilOptimalTransfer: number;
    optimalTransferAge: number;
    recommendation: string;
  } {
    const averageAge = ownership.currentOwners.reduce((sum, owner) => sum + owner.age, 0) / ownership.currentOwners.length;
    const averageExitAge = ownership.currentOwners[0]?.expectedExitAge || 65;
    const yearsUntilOptimalTransfer = Math.max(0, averageExitAge - averageAge);

    let recommendation = 'Plan transfer well in advance';
    if (yearsUntilOptimalTransfer < 5) {
      recommendation = 'URGENT: Begin succession planning immediately';
    }

    return {
      yearsUntilOptimalTransfer,
      optimalTransferAge: averageExitAge,
      recommendation,
    };
  }

  private static analyzeFunding(
    succession: BusinessSuccessionPlanningInput['successionOptions'],
    buySell: BusinessSuccessionPlanningInput['buySellAgreement'],
    valuation: { estimatedValue: number }
  ): {
    fundingNeeded: number;
    fundingMethod: string;
    lifeInsuranceNeeded: number;
    recommendation: string;
  } {
    const fundingNeeded = succession.salePrice || valuation.estimatedValue;
    const fundingMethod = buySell.fundingMethod || 'cash';
    const lifeInsuranceNeeded = fundingMethod === 'life-insurance' ? fundingNeeded : 0;

    let recommendation = 'Consider life insurance to fund buy-sell agreement';
    if (fundingMethod === 'cash') {
      recommendation = 'Ensure sufficient cash reserves for transfer';
    }

    return {
      fundingNeeded,
      fundingMethod,
      lifeInsuranceNeeded,
      recommendation,
    };
  }

  private static generateRecommendations(
    valuation: { estimatedValue: number },
    tax: { totalTax: number } | undefined,
    estate: { estateTax: number } | undefined,
    strategies: { bestStrategy: string } | undefined,
    timing: { recommendation: string } | undefined
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Business value: $${valuation.estimatedValue.toFixed(0)}`);

    if (tax) {
      recommendations.push(`Estimated transfer tax: $${tax.totalTax.toFixed(0)}`);
    }

    if (estate && estate.estateTax > 0) {
      recommendations.push(`Estate tax: $${estate.estateTax.toFixed(0)} - consider gifting strategies`);
    }

    if (strategies) {
      recommendations.push(`Recommended transfer method: ${strategies.bestStrategy}`);
    }

    if (timing) {
      recommendations.push(timing.recommendation);
    }

    return recommendations;
  }
}


