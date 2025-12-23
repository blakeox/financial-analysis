/**
 * Estate Planning Calculator
 * Estate tax planning, inheritance projections, trust analysis
 */

import type { EstatePlanningInput } from '../../schemas/estate-planning.js';

export class EstatePlanningCalculator {
  /**
   * Analyze estate planning and tax implications
   */
  static analyze(input: EstatePlanningInput): unknown {
    const personalInfo = input.personalInfo;
    const assets = input.assets;
    const estatePlan = input.estatePlan;
    const taxInfo = input.taxInfo;
    const analysis = input.analysis;

    // Project future estate value
    const projectedEstate = this.projectEstateValue(assets, taxInfo);

    // Estate tax calculation
    const estateTax = analysis.includeEstateTaxProjection
      ? this.calculateEstateTax(projectedEstate, taxInfo, personalInfo)
      : undefined;

    // Inheritance projection
    const inheritance = analysis.includeInheritanceProjection
      ? this.calculateInheritance(projectedEstate, estateTax, estatePlan)
      : undefined;

    // Trust analysis
    const trustAnalysis = analysis.includeTrustAnalysis
      ? this.analyzeTrusts(assets, estatePlan, taxInfo)
      : undefined;

    // Gift tax optimization
    const giftTaxOptimization = this.optimizeGiftTax(assets, taxInfo);

    // Recommendations
    const recommendations = this.generateRecommendations(
      estateTax,
      inheritance,
      estatePlan,
      projectedEstate
    );

    return {
      summary: {
        currentEstateValue: assets.totalAssets,
        projectedEstateValue: projectedEstate.projectedValue,
        estimatedEstateTax: estateTax?.totalTax,
        netInheritance: inheritance?.netInheritance,
        taxSavings: giftTaxOptimization.taxSavings,
      },
      projectedEstate,
      estateTax,
      inheritance,
      trustAnalysis,
      giftTaxOptimization,
      recommendations,
    };
  }

  private static projectEstateValue(
    assets: EstatePlanningInput['assets'],
    taxInfo: EstatePlanningInput['taxInfo']
  ): {
    projectedValue: number;
    growth: number;
    projections: Array<{ year: number; value: number }>;
  } {
    const projections: Array<{ year: number; value: number }> = [];
    let value = assets.totalAssets;

    for (let year = 0; year <= taxInfo.yearsToProject; year++) {
      projections.push({
        year,
        value,
      });
      value = value * (1 + taxInfo.expectedGrowthRate);
    }

    const growth = value - assets.totalAssets;

    return {
      projectedValue: value,
      growth,
      projections,
    };
  }

  private static calculateEstateTax(
    projectedEstate: { projectedValue: number },
    taxInfo: EstatePlanningInput['taxInfo'],
    personalInfo: EstatePlanningInput['personalInfo']
  ): {
    taxableEstate: number;
    federalTax: number;
    stateTax: number;
    totalTax: number;
    effectiveRate: number;
  } {
    // Estate tax exemption (doubled for married couples)
    const exemption =
      personalInfo.maritalStatus === 'married'
        ? taxInfo.federalEstateTaxExemption * 2
        : taxInfo.federalEstateTaxExemption;

    const taxableEstate = Math.max(
      0,
      projectedEstate.projectedValue - exemption - taxInfo.stateEstateTaxExemption
    );

    // Federal estate tax (2024 rates: 18-40%)
    let federalTax = 0;
    if (taxableEstate > 0) {
      // Simplified progressive tax calculation
      if (taxableEstate <= 10000) {
        federalTax = taxableEstate * 0.18;
      } else if (taxableEstate <= 20000) {
        federalTax = 10000 * 0.18 + (taxableEstate - 10000) * 0.2;
      } else if (taxableEstate <= 40000) {
        federalTax = 10000 * 0.18 + 10000 * 0.2 + (taxableEstate - 20000) * 0.22;
      } else if (taxableEstate <= 60000) {
        federalTax = 10000 * 0.18 + 10000 * 0.2 + 20000 * 0.22 + (taxableEstate - 40000) * 0.24;
      } else if (taxableEstate <= 1000000) {
        federalTax =
          10000 * 0.18 + 10000 * 0.2 + 20000 * 0.22 + 20000 * 0.24 + (taxableEstate - 60000) * 0.26;
      } else {
        federalTax =
          10000 * 0.18 +
          10000 * 0.2 +
          20000 * 0.22 +
          20000 * 0.24 +
          940000 * 0.26 +
          (taxableEstate - 1000000) * 0.4;
      }
    }

    // State estate tax (simplified)
    const stateTaxableEstate = Math.max(
      0,
      projectedEstate.projectedValue - taxInfo.stateEstateTaxExemption
    );
    const stateTax = stateTaxableEstate > 0 ? stateTaxableEstate * 0.16 : 0; // Assume 16% state rate

    const totalTax = federalTax + stateTax;
    const effectiveRate =
      projectedEstate.projectedValue > 0 ? (totalTax / projectedEstate.projectedValue) * 100 : 0;

    return {
      taxableEstate,
      federalTax,
      stateTax,
      totalTax,
      effectiveRate,
    };
  }

  private static calculateInheritance(
    projectedEstate: { projectedValue: number },
    estateTax?: { totalTax: number },
    estatePlan?: EstatePlanningInput['estatePlan']
  ): {
    grossInheritance: number;
    netInheritance: number;
    perBeneficiary: number;
    taxPercentage: number;
  } {
    const grossInheritance = projectedEstate.projectedValue;
    const totalTax = estateTax?.totalTax || 0;
    const netInheritance = grossInheritance - totalTax;
    const perBeneficiary =
      estatePlan && estatePlan.beneficiaries > 0
        ? netInheritance / estatePlan.beneficiaries
        : netInheritance;
    const taxPercentage = grossInheritance > 0 ? (totalTax / grossInheritance) * 100 : 0;

    return {
      grossInheritance,
      netInheritance,
      perBeneficiary,
      taxPercentage,
    };
  }

  private static analyzeTrusts(
    assets: EstatePlanningInput['assets'],
    estatePlan: EstatePlanningInput['estatePlan'],
    taxInfo: EstatePlanningInput['taxInfo']
  ): {
    trustRecommendation: string;
    taxSavings: number;
    benefits: string[];
  } {
    const benefits: string[] = [];
    let taxSavings = 0;

    if (!estatePlan.hasTrust) {
      // Estimate tax savings from trust
      const projectedEstate = this.projectEstateValue(assets, taxInfo);
      const estateTaxWithoutTrust = this.calculateEstateTax(projectedEstate, taxInfo, {
        age: 65,
        maritalStatus: 'married',
        stateOfResidence: 'CA',
      });
      // Trusts can help avoid probate and potentially reduce taxes
      taxSavings = estateTaxWithoutTrust.totalTax * 0.1; // Assume 10% savings

      benefits.push('Avoid probate');
      benefits.push('Potential tax savings');
      benefits.push('Privacy and control');
    }

    return {
      trustRecommendation: estatePlan.hasTrust
        ? 'You have a trust in place - review periodically'
        : 'Consider establishing a trust to reduce estate taxes and avoid probate',
      taxSavings,
      benefits,
    };
  }

  private static optimizeGiftTax(
    assets: EstatePlanningInput['assets'],
    taxInfo: EstatePlanningInput['taxInfo']
  ): {
    annualGiftExclusion: number;
    lifetimeGiftExemption: number;
    recommendedGifts: number;
    taxSavings: number;
  } {
    const annualGiftExclusion = 18000; // 2024: $18,000 per person per year
    const lifetimeGiftExemption = taxInfo.federalEstateTaxExemption;

    // Recommend annual gifting to reduce estate
    const recommendedGifts = Math.min(annualGiftExclusion * 2, assets.totalAssets * 0.1); // Up to 10% of assets

    // Tax savings from gifting
    const projectedEstate = this.projectEstateValue(assets, taxInfo);
    const currentTax = this.calculateEstateTax(projectedEstate, taxInfo, {
      age: 65,
      maritalStatus: 'married',
      stateOfResidence: 'CA',
    });

    const reducedEstate = { projectedValue: projectedEstate.projectedValue - recommendedGifts };
    const reducedTax = this.calculateEstateTax(reducedEstate, taxInfo, {
      age: 65,
      maritalStatus: 'married',
      stateOfResidence: 'CA',
    });

    const taxSavings = currentTax.totalTax - reducedTax.totalTax;

    return {
      annualGiftExclusion,
      lifetimeGiftExemption,
      recommendedGifts,
      taxSavings,
    };
  }

  private static generateRecommendations(
    estateTax?: { totalTax: number; effectiveRate: number },
    inheritance?: { netInheritance: number; taxPercentage: number },
    estatePlan?: EstatePlanningInput['estatePlan'],
    projectedEstate?: { projectedValue: number }
  ): string[] {
    const recommendations: string[] = [];

    if (estateTax && estateTax.totalTax > 0) {
      recommendations.push(
        `Estimated estate tax: $${estateTax.totalTax.toFixed(0)} (${estateTax.effectiveRate.toFixed(1)}% effective rate)`
      );
    }

    if (inheritance) {
      recommendations.push(
        `Net inheritance after taxes: $${inheritance.netInheritance.toFixed(0)} (${inheritance.taxPercentage.toFixed(1)}% tax rate)`
      );
    }

    if (!estatePlan?.hasWill) {
      recommendations.push(
        '⚠️ No will in place - create a will to ensure assets are distributed according to your wishes'
      );
    }

    if (!estatePlan?.hasTrust && projectedEstate && projectedEstate.projectedValue > 1000000) {
      recommendations.push(
        'Consider establishing a trust to reduce estate taxes and avoid probate'
      );
    }

    recommendations.push('Review estate plan annually and update beneficiaries');
    recommendations.push('Consider annual gifting to reduce estate value over time');

    return recommendations;
  }
}
