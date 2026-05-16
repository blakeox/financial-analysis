/**
 * HSA Optimization Calculator
 * Maximize Health Savings Account tax benefits and retirement healthcare planning
 */

import { Decimal } from 'decimal.js';
import type { HSAOptimizationInput } from '../schemas/hsa-optimization.js';

export class HSAOptimizer {
  /**
   * Analyze HSA optimization strategies
   */
  static analyze(input: HSAOptimizationInput): unknown {
    const personalInfo = input.personalInfo;
    const contributionLimits = input.contributionLimits;
    const hsaDetails = input.hsaDetails;
    const medicalExpenses = input.medicalExpenses;
    const strategy = input.strategy;
    const taxInfo = input.taxInfo;

    // Calculate contribution limits
    const maxContribution = this.calculateMaxContribution(
      personalInfo,
      contributionLimits,
      hsaDetails.employerContribution
    );

    // Calculate tax benefits
    const taxBenefits = this.calculateTaxBenefits(
      hsaDetails.annualContribution,
      taxInfo,
      personalInfo.filingStatus
    );

    // Project HSA growth
    const hsaProjection = this.projectHSAGrowth(
      personalInfo.currentHSABalance,
      hsaDetails,
      maxContribution,
      medicalExpenses.yearsUntilRetirement
    );

    // Retirement healthcare analysis
    const retirementAnalysis = this.analyzeRetirementHealthcare(
      hsaProjection,
      medicalExpenses,
      strategy
    );

    // Strategy recommendations
    const recommendations = this.generateRecommendations(
      maxContribution,
      taxBenefits,
      hsaProjection,
      strategy,
      medicalExpenses
    );

    return {
      summary: {
        maxContribution: maxContribution.total,
        currentContribution: hsaDetails.annualContribution,
        totalTaxSavings: taxBenefits.totalSavings,
        projectedBalanceAtRetirement: hsaProjection.finalBalance,
        tripleTaxBenefit: true,
      },
      contributionOptimization: {
        ...maxContribution,
        optimalContribution: maxContribution.personalContribution,
      },
      taxSavings: {
        ...taxBenefits,
        annualTaxSavings: taxBenefits.totalSavings,
      },
      retirementProjections: {
        ...hsaProjection,
        projectedBalance: hsaProjection.finalBalance,
      },
      retirementAnalysis,
      recommendations,
    };
  }

  private static calculateMaxContribution(
    personalInfo: HSAOptimizationInput['personalInfo'],
    limits: HSAOptimizationInput['contributionLimits'],
    employerContribution: number
  ): {
    individualLimit: number;
    familyLimit: number;
    catchUp: number;
    total: number;
    employerContribution: number;
    personalContribution: number;
  } {
    const isFamily = personalInfo.filingStatus === 'married-joint';
    const baseLimit = isFamily ? limits.familyLimit : limits.individualLimit;
    const catchUp = personalInfo.age >= 55 ? limits.catchUpContribution : 0;
    const total = baseLimit + catchUp;
    const personalContribution = Math.max(0, total - employerContribution);

    return {
      individualLimit: limits.individualLimit,
      familyLimit: limits.familyLimit,
      catchUp,
      total,
      employerContribution,
      personalContribution,
    };
  }

  private static calculateTaxBenefits(
    contribution: number,
    taxInfo: HSAOptimizationInput['taxInfo'],
    _filingStatus: string
  ): {
    federalTaxSavings: number;
    stateTaxSavings: number;
    ficaTaxSavings: number;
    totalSavings: number;
    effectiveTaxRate: number;
  } {
    const federalSavings = contribution * taxInfo.federalTaxRate;
    const stateSavings = contribution * taxInfo.stateTaxRate;
    const ficaSavings = contribution * taxInfo.ficaTaxRate;
    const totalSavings = federalSavings + stateSavings + ficaSavings;
    const effectiveRate = taxInfo.federalTaxRate + taxInfo.stateTaxRate + taxInfo.ficaTaxRate;

    return {
      federalTaxSavings: federalSavings,
      stateTaxSavings: stateSavings,
      ficaTaxSavings: ficaSavings,
      totalSavings,
      effectiveTaxRate: effectiveRate,
    };
  }

  private static projectHSAGrowth(
    currentBalance: number,
    hsaDetails: HSAOptimizationInput['hsaDetails'],
    maxContribution: { total: number },
    years: number
  ): {
    finalBalance: number;
    totalContributions: number;
    totalGrowth: number;
    annualProjections: Array<{
      year: number;
      balance: number;
      contributions: number;
      growth: number;
    }>;
  } {
    const annualReturn = hsaDetails.investmentReturn;
    const annualContribution = Math.min(hsaDetails.annualContribution, maxContribution.total);
    let balance = new Decimal(currentBalance);
    const projections: Array<{
      year: number;
      balance: number;
      contributions: number;
      growth: number;
    }> = [];

    for (let year = 1; year <= years; year++) {
      const startBalance = balance.toNumber();
      balance = balance.times(new Decimal(1).plus(annualReturn));
      balance = balance.plus(annualContribution);
      const endBalance = balance.toNumber();
      const growth = endBalance - startBalance - annualContribution;

      projections.push({
        year,
        balance: endBalance,
        contributions: annualContribution,
        growth,
      });
    }

    return {
      finalBalance: balance.toNumber(),
      totalContributions: annualContribution * years,
      totalGrowth: balance.toNumber() - currentBalance - annualContribution * years,
      annualProjections: projections,
    };
  }

  private static analyzeRetirementHealthcare(
    hsaProjection: { finalBalance: number },
    medicalExpenses: HSAOptimizationInput['medicalExpenses'],
    strategy: HSAOptimizationInput['strategy']
  ): {
    projectedRetirementBalance: number;
    estimatedRetirementMedicalCosts: number;
    coveragePercentage: number;
    shortfall: number;
    recommendations: string[];
  } {
    const projectedBalance = hsaProjection.finalBalance;
    const estimatedCosts = medicalExpenses.expectedRetirementMedicalCosts;
    const coverage = estimatedCosts > 0 ? (projectedBalance / estimatedCosts) * 100 : 0;
    const shortfall = Math.max(0, estimatedCosts - projectedBalance);

    const recommendations: string[] = [];
    if (coverage < 50) {
      recommendations.push(
        'Consider increasing HSA contributions to better cover retirement healthcare costs'
      );
    }
    if (strategy.useForCurrentExpenses) {
      recommendations.push(
        'Consider saving receipts for future reimbursement to maximize tax-free growth'
      );
    }

    return {
      projectedRetirementBalance: projectedBalance,
      estimatedRetirementMedicalCosts: estimatedCosts,
      coveragePercentage: Math.min(100, coverage),
      shortfall,
      recommendations,
    };
  }

  private static generateRecommendations(
    maxContribution: { total: number; personalContribution: number },
    taxBenefits: { totalSavings: number },
    hsaProjection: { finalBalance: number },
    strategy: HSAOptimizationInput['strategy'],
    _medicalExpenses: HSAOptimizationInput['medicalExpenses']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Maximum HSA contribution: $${maxContribution.total.toFixed(0)}`);
    recommendations.push(`Annual tax savings: $${taxBenefits.totalSavings.toFixed(0)}`);
    recommendations.push(
      `Projected balance at retirement: $${hsaProjection.finalBalance.toFixed(0)}`
    );

    if (strategy.optimizeFor === 'retirement-healthcare') {
      recommendations.push('Focus on maximizing contributions for retirement healthcare planning');
    }

    if (strategy.saveReceipts) {
      recommendations.push('Save medical receipts for future tax-free reimbursement');
    }

    return recommendations;
  }
}
