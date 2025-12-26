/**
 * Roth vs Traditional IRA Calculator
 * Compare Roth and Traditional IRA strategies with tax optimization
 */

import { Decimal } from 'decimal.js';
import type { RothVsTraditionalIRAInput } from '../schemas/roth-vs-traditional-ira.js';

export class RothVsTraditionalIRACalculator {
  /**
   * Analyze Roth vs Traditional IRA strategies
   */
  static analyze(input: RothVsTraditionalIRAInput): unknown {
    const personalInfo = input.personalInfo;
    const contributionDetails = input.contributionDetails;
    const accountDetails = input.accountDetails;
    const taxInfo = input.taxInfo;
    const withdrawalStrategy = input.withdrawalStrategy;
    const analysis = input.analysis;

    // Calculate Traditional IRA projections
    const traditionalProjection = this.projectTraditionalIRA(
      accountDetails.currentTraditionalBalance,
      contributionDetails,
      accountDetails.expectedReturn,
      taxInfo,
      personalInfo,
      withdrawalStrategy
    );

    // Calculate Roth IRA projections
    const rothProjection = this.projectRothIRA(
      accountDetails.currentRothBalance,
      contributionDetails,
      accountDetails.expectedReturn,
      taxInfo,
      personalInfo,
      withdrawalStrategy
    );

    // Tax analysis
    const taxAnalysis = this.analyzeTaxImpact(
      traditionalProjection,
      rothProjection,
      taxInfo,
      personalInfo
    );

    // Conversion analysis
    const conversionAnalysis = analysis.includeConversionAnalysis
      ? this.analyzeConversion(
          accountDetails.currentTraditionalBalance,
          taxInfo,
          personalInfo
        )
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      traditionalProjection,
      rothProjection,
      taxAnalysis,
      personalInfo,
      taxInfo
    );

    return {
      summary: {
        traditionalFinalValue: traditionalProjection.finalValue,
        rothFinalValue: rothProjection.finalValue,
        traditionalAfterTax: traditionalProjection.afterTaxValue,
        rothAfterTax: rothProjection.afterTaxValue,
        betterOption: rothProjection.afterTaxValue > traditionalProjection.afterTaxValue ? 'roth' : 'traditional',
        taxSavingsDifference: Math.abs(rothProjection.afterTaxValue - traditionalProjection.afterTaxValue),
      },
      traditionalProjection,
      rothProjection,
      taxAnalysis,
      conversionAnalysis,
      recommendations,
    };
  }

  private static projectTraditionalIRA(
    currentBalance: number,
    contributions: RothVsTraditionalIRAInput['contributionDetails'],
    expectedReturn: number,
    taxInfo: RothVsTraditionalIRAInput['taxInfo'],
    personalInfo: RothVsTraditionalIRAInput['personalInfo'],
    _withdrawal: RothVsTraditionalIRAInput['withdrawalStrategy']
  ): {
    finalValue: number;
    afterTaxValue: number;
    totalContributions: number;
    totalGrowth: number;
    taxOnWithdrawal: number;
    annualProjections: Array<{ year: number; balance: number; contributions: number }>;
  } {
    let balance = new Decimal(currentBalance);
    const annualContribution = contributions.annualContribution + contributions.catchUpContribution;
    const projections: Array<{ year: number; balance: number; contributions: number }> = [];
    const years = personalInfo.retirementAge - personalInfo.age;

    for (let year = 1; year <= years; year++) {
      balance = balance.times(new Decimal(1).plus(expectedReturn));
      balance = balance.plus(annualContribution);
      projections.push({
        year,
        balance: balance.toNumber(),
        contributions: annualContribution,
      });
    }

    const finalValue = balance.toNumber();
    const totalContributions = annualContribution * years;
    const totalGrowth = finalValue - currentBalance - totalContributions;
    const withdrawalTaxRate = taxInfo.expectedRetirementMarginalTaxRate + taxInfo.stateTaxRate;
    const taxOnWithdrawal = finalValue * withdrawalTaxRate;
    const afterTaxValue = finalValue - taxOnWithdrawal;

    return {
      finalValue,
      afterTaxValue,
      totalContributions,
      totalGrowth,
      taxOnWithdrawal,
      annualProjections: projections,
    };
  }

  private static projectRothIRA(
    currentBalance: number,
    contributions: RothVsTraditionalIRAInput['contributionDetails'],
    expectedReturn: number,
    taxInfo: RothVsTraditionalIRAInput['taxInfo'],
    personalInfo: RothVsTraditionalIRAInput['personalInfo'],
    _withdrawal: RothVsTraditionalIRAInput['withdrawalStrategy']
  ): {
    finalValue: number;
    afterTaxValue: number;
    totalContributions: number;
    totalGrowth: number;
    taxOnContribution: number;
    annualProjections: Array<{ year: number; balance: number; contributions: number }>;
  } {
    const contributionTaxRate = taxInfo.currentMarginalTaxRate + taxInfo.stateTaxRate;
    const afterTaxContribution = contributions.annualContribution + contributions.catchUpContribution;
    const taxOnContribution = afterTaxContribution * contributionTaxRate;

    let balance = new Decimal(currentBalance);
    const projections: Array<{ year: number; balance: number; contributions: number }> = [];
    const years = personalInfo.retirementAge - personalInfo.age;

    for (let year = 1; year <= years; year++) {
      balance = balance.times(new Decimal(1).plus(expectedReturn));
      balance = balance.plus(afterTaxContribution);
      projections.push({
        year,
        balance: balance.toNumber(),
        contributions: afterTaxContribution,
      });
    }

    const finalValue = balance.toNumber();
    const totalContributions = afterTaxContribution * years;
    const totalGrowth = finalValue - currentBalance - totalContributions;
    const afterTaxValue = finalValue; // Roth withdrawals are tax-free

    return {
      finalValue,
      afterTaxValue,
      totalContributions,
      totalGrowth,
      taxOnContribution: taxOnContribution * years,
      annualProjections: projections,
    };
  }

  private static analyzeTaxImpact(
    traditional: { afterTaxValue: number; taxOnWithdrawal: number },
    roth: { afterTaxValue: number; taxOnContribution: number },
    taxInfo: RothVsTraditionalIRAInput['taxInfo'],
    _personalInfo: RothVsTraditionalIRAInput['personalInfo']
  ): {
    currentTaxSavings: number;
    futureTaxCost: number;
    netTaxBenefit: number;
    breakEvenTaxRate: number;
  } {
    const currentTaxSavings = roth.taxOnContribution; // Tax paid now for Roth
    const futureTaxCost = traditional.taxOnWithdrawal; // Tax paid later for Traditional
    const netTaxBenefit = currentTaxSavings - futureTaxCost;
    const breakEvenTaxRate = taxInfo.currentMarginalTaxRate; // Simplified

    return {
      currentTaxSavings,
      futureTaxCost,
      netTaxBenefit,
      breakEvenTaxRate,
    };
  }

  private static analyzeConversion(
    currentTraditionalBalance: number,
    taxInfo: RothVsTraditionalIRAInput['taxInfo'],
    _personalInfo: RothVsTraditionalIRAInput['personalInfo']
  ): {
    conversionAmount: number;
    conversionTax: number;
    breakEvenYears: number;
    recommendation: string;
  } {
    const conversionAmount = currentTraditionalBalance;
    const conversionTaxRate = taxInfo.currentMarginalTaxRate + taxInfo.stateTaxRate;
    const conversionTax = conversionAmount * conversionTaxRate;
    const breakEvenYears = conversionTax / (conversionAmount * 0.05); // Simplified

    let recommendation = 'Consider Roth conversion if tax rates are expected to increase';
    if (taxInfo.currentMarginalTaxRate > taxInfo.expectedRetirementMarginalTaxRate) {
      recommendation = 'Traditional IRA may be better given current higher tax rate';
    }

    return {
      conversionAmount,
      conversionTax,
      breakEvenYears,
      recommendation,
    };
  }

  private static generateRecommendations(
    traditional: { afterTaxValue: number },
    roth: { afterTaxValue: number },
    _taxAnalysis: { netTaxBenefit: number },
    personalInfo: RothVsTraditionalIRAInput['personalInfo'],
    taxInfo: RothVsTraditionalIRAInput['taxInfo']
  ): string[] {
    const recommendations: string[] = [];

    if (roth.afterTaxValue > traditional.afterTaxValue) {
      recommendations.push('Roth IRA provides better after-tax value in your situation');
    } else {
      recommendations.push('Traditional IRA provides better after-tax value in your situation');
    }

    if (taxInfo.currentMarginalTaxRate < taxInfo.expectedRetirementMarginalTaxRate) {
      recommendations.push('Consider Roth contributions since retirement tax rate may be higher');
    }

    if (personalInfo.age < 40) {
      recommendations.push('Younger investors benefit more from Roth due to longer tax-free growth');
    }

    return recommendations;
  }
}



