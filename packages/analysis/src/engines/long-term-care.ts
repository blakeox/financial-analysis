/**
 * Long-Term Care Planning Calculator
 * Analyze LTC insurance needs and funding strategies
 */

import type { LongTermCareInput } from '../schemas/long-term-care.js';

export class LongTermCareCalculator {
  /**
   * Analyze long-term care planning needs
   */
  static analyze(input: LongTermCareInput): unknown {
    const personalInfo = input.personalInfo;
    const careNeeds = input.careNeeds;
    const insuranceOptions = input.insuranceOptions;
    const financialResources = input.financialResources;
    const strategy = input.strategy;
    const analysis = input.analysis;

    // Calculate care costs
    const careCostAnalysis = this.calculateCareCosts(careNeeds, personalInfo);

    // Insurance analysis
    const insuranceAnalysis = insuranceOptions.hasLTCInsurance && insuranceOptions.policyDetails
      ? this.analyzeInsurance(insuranceOptions.policyDetails, careCostAnalysis, personalInfo)
      : undefined;

    // Self-funding analysis
    const selfFundingAnalysis = this.analyzeSelfFunding(
      financialResources,
      careCostAnalysis,
      personalInfo
    );

    // Hybrid strategy analysis
    const hybridAnalysis = strategy.fundingMethod === 'hybrid'
      ? this.analyzeHybridStrategy(insuranceAnalysis, selfFundingAnalysis, careCostAnalysis)
      : undefined;

    const fundingAnalysis = {
      fundingGap: selfFundingAnalysis.shortfall,
      availableAssets: selfFundingAnalysis.availableAssets,
      recommendedFundingMethod: strategy.fundingMethod,
    };

    const probabilityAnalysis = analysis.includeProbabilityAnalysis
      ? this.calculateProbabilityAnalysis(personalInfo, careNeeds, careCostAnalysis)
      : undefined;

    const comparison = {
      selfFundingCost: careCostAnalysis.lifetimeCost,
      insuranceCost: insuranceAnalysis?.totalPremiums || 0,
      hybridCost: hybridAnalysis?.totalCoverage ? Math.max(0, careCostAnalysis.lifetimeCost - hybridAnalysis.totalCoverage) : 0,
    };

    // Recommendations
    const recommendations = this.generateRecommendations(
      careCostAnalysis,
      insuranceAnalysis,
      selfFundingAnalysis,
      strategy,
      financialResources
    );

    return {
      summary: {
        estimatedLifetimeCost: careCostAnalysis.lifetimeCost,
        totalLifetimeCost: careCostAnalysis.lifetimeCost,
        insuranceCoverage: insuranceAnalysis?.coverageAmount || 0,
        selfFundingShortfall: selfFundingAnalysis.shortfall,
        recommendedStrategy: strategy.fundingMethod,
      },
      careCostAnalysis,
      insuranceAnalysis,
      selfFundingAnalysis,
      hybridAnalysis,
      fundingAnalysis,
      probabilityAnalysis,
      comparison,
      recommendations,
    };
  }

  private static calculateProbabilityAnalysis(
    personalInfo: LongTermCareInput['personalInfo'],
    careNeeds: LongTermCareInput['careNeeds'],
    careCosts: { lifetimeCost: number }
  ): {
    probabilityOfNeedingCare: number;
    expectedCost: number;
    expectedOutOfPocketCost: number;
    notes: string;
  } {
    // Deterministic, simple heuristic (not actuarial): increases with age; slight gender adjustment.
    const ageFactor = Math.min(1, Math.max(0, (personalInfo.age - 40) / 60));
    const genderAdjustment = personalInfo.gender === 'female' ? 0.05 : 0;
    const baseProbability = 0.55;
    const probabilityOfNeedingCare = Math.min(0.95, Math.max(0.1, baseProbability + ageFactor * 0.25 + genderAdjustment));

    const expectedCost = careCosts.lifetimeCost * probabilityOfNeedingCare;
    // Assume some costs are covered via Medicare/Medicaid/other resources (simplified).
    const expectedOutOfPocketCost = expectedCost * 0.7;

    return {
      probabilityOfNeedingCare,
      expectedCost,
      expectedOutOfPocketCost,
      notes: `Heuristic estimate using age ${personalInfo.age}, care start age ${careNeeds.expectedCareStartAge}, and care duration ${careNeeds.expectedCareDuration}`,
    };
  }

  private static calculateCareCosts(
    careNeeds: LongTermCareInput['careNeeds'],
    personalInfo: LongTermCareInput['personalInfo']
  ): {
    annualCost: number;
    lifetimeCost: number;
    costAtRetirement: number;
    inflationAdjusted: boolean;
  } {
    const yearsUntilCare = Math.max(0, careNeeds.expectedCareStartAge - personalInfo.age);
    const annualCost = careNeeds.annualCareCost;
    const lifetimeCost = annualCost * careNeeds.expectedCareDuration;
    const costAtRetirement = annualCost * Math.pow(1 + careNeeds.careCostInflation, yearsUntilCare);

    return {
      annualCost,
      lifetimeCost,
      costAtRetirement,
      inflationAdjusted: true,
    };
  }

  private static analyzeInsurance(
    policy: NonNullable<LongTermCareInput['insuranceOptions']['policyDetails']>,
    careCosts: { lifetimeCost: number; annualCost: number },
    personalInfo: LongTermCareInput['personalInfo']
  ): {
    coverageAmount: number;
    coveragePercentage: number;
    shortfall: number;
    totalPremiums: number;
    netBenefit: number;
  } {
    const totalBenefit = policy.dailyBenefit * 365 * policy.benefitPeriod;
    const coverageAmount = Math.min(totalBenefit, careCosts.lifetimeCost);
    const coveragePercentage = (coverageAmount / careCosts.lifetimeCost) * 100;
    const shortfall = Math.max(0, careCosts.lifetimeCost - coverageAmount);

    const yearsToPay = Math.max(0, personalInfo.age - 50); // Assume start paying at 50
    const totalPremiums = policy.annualPremium * yearsToPay;
    const netBenefit = coverageAmount - totalPremiums;

    return {
      coverageAmount,
      coveragePercentage,
      shortfall,
      totalPremiums,
      netBenefit,
    };
  }

  private static analyzeSelfFunding(
    resources: LongTermCareInput['financialResources'],
    careCosts: { lifetimeCost: number },
    _personalInfo: LongTermCareInput['personalInfo']
  ): {
    availableAssets: number;
    coveragePercentage: number;
    shortfall: number;
    yearsOfCoverage: number;
  } {
    const availableAssets = resources.currentAssets + resources.expectedRetirementAssets;
    const coveragePercentage = (availableAssets / careCosts.lifetimeCost) * 100;
    const shortfall = Math.max(0, careCosts.lifetimeCost - availableAssets);
    const yearsOfCoverage = careCosts.lifetimeCost > 0 ? availableAssets / (careCosts.lifetimeCost / 3) : 0; // Assume 3 years average

    return {
      availableAssets,
      coveragePercentage: Math.min(100, coveragePercentage),
      shortfall,
      yearsOfCoverage,
    };
  }

  private static analyzeHybridStrategy(
    insurance: { coverageAmount: number } | undefined,
    selfFunding: { availableAssets: number },
    careCosts: { lifetimeCost: number }
  ): {
    totalCoverage: number;
    coveragePercentage: number;
    shortfall: number;
  } {
    const insuranceCoverage = insurance?.coverageAmount || 0;
    const totalCoverage = insuranceCoverage + selfFunding.availableAssets;
    const coveragePercentage = (totalCoverage / careCosts.lifetimeCost) * 100;
    const shortfall = Math.max(0, careCosts.lifetimeCost - totalCoverage);

    return {
      totalCoverage,
      coveragePercentage: Math.min(100, coveragePercentage),
      shortfall,
    };
  }

  private static generateRecommendations(
    careCosts: { lifetimeCost: number },
    insurance: { netBenefit: number } | undefined,
    selfFunding: { shortfall: number },
    strategy: LongTermCareInput['strategy'],
    resources: LongTermCareInput['financialResources']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Estimated lifetime LTC cost: $${careCosts.lifetimeCost.toFixed(0)}`);

    if (strategy.fundingMethod === 'self-fund' && selfFunding.shortfall > 0) {
      recommendations.push(`Self-funding shortfall: $${selfFunding.shortfall.toFixed(0)} - consider insurance`);
    }

    if (insurance && insurance.netBenefit > 0) {
      recommendations.push('LTC insurance provides positive net benefit');
    }

    if (resources.currentAssets < careCosts.lifetimeCost * 0.5) {
      recommendations.push('Consider LTC insurance to protect assets');
    }

    return recommendations;
  }
}



